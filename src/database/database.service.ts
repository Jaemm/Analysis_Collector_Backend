import { Injectable, OnModuleInit } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as crypto from 'crypto';
import * as path from 'path';
import { Pool, PoolClient } from 'pg';
import { AppLogger } from '../common/logger/logger.service';

type MigrationFile = {
  name: string;
  checksum: string;
  sql: string;
};

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly pool: Pool;
  private readonly targetDatabaseName: string;
  private readonly bootstrapDatabaseName: string;
  private readonly autoCreateDatabase: boolean;
  private readonly autoMigrate: boolean;
  private readonly sslConfig: false | { rejectUnauthorized: boolean };
  private readonly bootstrapLockName = 'analysis-collector-db-bootstrap';
  private readonly schemaMigrationsTable = 'schema_migrations';

  constructor(private readonly logger: AppLogger) {
    this.targetDatabaseName = this.requireEnv('DB_NAME');
    this.bootstrapDatabaseName = this.getEnv('DB_BOOTSTRAP_DATABASE', 'postgres');
    this.autoCreateDatabase = this.parseBooleanEnv(
      'DB_AUTO_CREATE_DATABASE',
      true,
    );
    this.autoMigrate = this.parseBooleanEnv('DB_AUTO_MIGRATE', true);
    this.sslConfig = this.parseBooleanEnv('DB_SSL', true)
      ? {
          rejectUnauthorized: this.parseBooleanEnv(
            'DB_SSL_REJECT_UNAUTHORIZED',
            false,
          ),
        }
      : false;

    this.pool = this.createPool(this.targetDatabaseName);

    this.logger.log('Database pool initialized');
  }

  async onModuleInit() {
    try {
      await this.ensureDatabaseAndMigrations();
      await this.warmUp();
    } catch (error) {
      this.logger.error(
        'Database bootstrap failed',
        this.extractErrorTrace(error),
      );
      throw error;
    }
  }

  // 기본 query (가볍게)
  async query(query: string, params?: any[]) {
    const start = Date.now();
    const result = await this.pool.query(query, params);
    const duration = Date.now() - start;

    if (duration > 200) {
      this.logger.warn('SLOW QUERY', {
        query: this.shortenQuery(query),
        duration,
      });
    }

    return result.rows;
  }

  // 상세 로그용
  async executeQuery(queryText: string, values?: any[]) {
    const start = Date.now();

    try {
      const result = await this.pool.query(queryText, values);
      const duration = Date.now() - start;

      const payload = {
        query: this.shortenQuery(queryText),
        duration,
        rowCount: result.rowCount,
      };

      if (duration > 200) {
        this.logger.warn('SLOW QUERY', payload);
      } else {
        this.logger.debug('DB QUERY', payload);
      }

      return result.rows;
    } catch (error) {
      const duration = Date.now() - start;

      this.logger.error('DB QUERY ERROR', error.stack, {
        query: this.shortenQuery(queryText),
        duration,
      });

      throw error;
    }
  }

  // raw query
  async runQuery(queryText: string, values?: any[]) {
    const start = Date.now();

    try {
      const result = await this.pool.query(queryText, values);
      const duration = Date.now() - start;

      this.logger.debug('RAW QUERY', {
        query: this.shortenQuery(queryText),
        duration,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - start;

      this.logger.error('RAW QUERY ERROR', error.stack, {
        query: this.shortenQuery(queryText),
        duration,
      });

      throw error;
    }
  }

  // transaction
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();
    const start = Date.now();

    try {
      await client.query('BEGIN');

      const result = await callback(client);

      await client.query('COMMIT');

      this.logger.debug('TX COMMIT', {
        duration: Date.now() - start,
      });

      return result;
    } catch (error) {
      await client.query('ROLLBACK');

      this.logger.error('TX ROLLBACK', error.stack, {
        duration: Date.now() - start,
      });

      throw error;
    } finally {
      client.release();
    }
  }

  // client 직접 사용
  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  private async ensureDatabaseAndMigrations() {
    const adminPool = this.createPool(this.bootstrapDatabaseName);
    const adminClient = await adminPool.connect();

    try {
      await this.acquireBootstrapLock(adminClient);
      await this.ensureTargetDatabaseExists(adminClient);
    } finally {
      await this.releaseBootstrapLock(adminClient).catch(() => undefined);
      adminClient.release();
      await adminPool.end().catch(() => undefined);
    }

    if (!this.autoMigrate) {
      this.logger.log('Automatic migrations are disabled');
      return;
    }

    await this.ensureMigrationsTable();
    const migrations = await this.loadMigrationFiles();
    await this.applyPendingMigrations(migrations);
  }

  private async warmUp() {
    const start = Date.now();
    await this.pool.query('SELECT 1');
    this.logger.log(`DB warm-up success (${Date.now() - start}ms)`);
  }

  private async ensureTargetDatabaseExists(adminClient: PoolClient) {
    const exists = await adminClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [this.targetDatabaseName],
    );

    if (exists.rowCount > 0) {
      this.logger.log(`Database ${this.targetDatabaseName} already exists`);
      return;
    }

    if (!this.autoCreateDatabase) {
      throw new Error(
        `Database ${this.targetDatabaseName} does not exist and DB_AUTO_CREATE_DATABASE is disabled`,
      );
    }

    await adminClient.query(
      `CREATE DATABASE ${this.escapeIdentifier(this.targetDatabaseName)}`,
    );
    this.logger.log(`Database ${this.targetDatabaseName} created`);
  }

  private async ensureMigrationsTable() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS ${this.escapeIdentifier(
        this.schemaMigrationsTable,
      )} (
        id BIGSERIAL PRIMARY KEY,
        filename TEXT NOT NULL UNIQUE,
        checksum TEXT NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  private async loadMigrationFiles(): Promise<MigrationFile[]> {
    const migrationsDir = path.resolve(process.cwd(), 'migrations');
    const entries = await fs.readdir(migrationsDir);

    const sqlFiles = entries
      .filter((entry) => entry.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b, 'en'));

    const migrations: MigrationFile[] = [];

    for (const name of sqlFiles) {
      const filePath = path.join(migrationsDir, name);
      const sql = await fs.readFile(filePath, 'utf8');
      const checksum = crypto.createHash('sha256').update(sql).digest('hex');

      migrations.push({ name, checksum, sql });
    }

    return migrations;
  }

  private async applyPendingMigrations(migrations: MigrationFile[]) {
    for (const migration of migrations) {
      const applied = await this.pool.query(
        `SELECT checksum FROM ${this.escapeIdentifier(
          this.schemaMigrationsTable,
        )} WHERE filename = $1`,
        [migration.name],
      );

      if (applied.rowCount > 0) {
        const appliedChecksum = applied.rows[0].checksum;
        if (appliedChecksum !== migration.checksum) {
          throw new Error(
            `Migration ${migration.name} checksum mismatch. The file has changed after being applied.`,
          );
        }

        continue;
      }

      const start = Date.now();
      await this.executeMigrationSql(migration.sql);
      await this.pool.query(
        `INSERT INTO ${this.escapeIdentifier(
          this.schemaMigrationsTable,
        )} (filename, checksum) VALUES ($1, $2)`,
        [migration.name, migration.checksum],
      );

      this.logger.log(
        `Migration applied: ${migration.name} (${Date.now() - start}ms)`,
      );
    }
  }

  private async executeMigrationSql(sql: string) {
    if (!/\bCONCURRENTLY\b/i.test(sql)) {
      await this.pool.query(sql);
      return;
    }

    const statements = sql
      .split(';')
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await this.pool.query(statement);
    }
  }

  private async acquireBootstrapLock(client: PoolClient) {
    await client.query('SELECT pg_advisory_lock(hashtext($1))', [
      this.bootstrapLockName,
    ]);
  }

  private async releaseBootstrapLock(client: PoolClient) {
    await client.query('SELECT pg_advisory_unlock(hashtext($1))', [
      this.bootstrapLockName,
    ]);
  }

  private createPool(database: string) {
    return new Pool({
      host: this.requireEnv('DB_HOST'),
      port: this.parseNumberEnv('DB_PORT', 5432),
      user: this.requireEnv('DB_USER'),
      password: this.requireEnv('DB_PASSWORD'),
      database,

      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,

      ssl: this.sslConfig || undefined,
    });
  }

  private getEnv(name: string, fallback: string) {
    return process.env[name] || fallback;
  }

  private requireEnv(name: string) {
    const value = process.env[name];
    if (!value) {
      throw new Error(`${name} is required`);
    }

    return value;
  }

  private parseNumberEnv(name: string, fallback: number) {
    const value = process.env[name];
    if (!value) {
      return fallback;
    }

    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      throw new Error(`${name} must be a number`);
    }

    return parsed;
  }

  private parseBooleanEnv(name: string, fallback: boolean) {
    const value = process.env[name];
    if (value === undefined) {
      return fallback;
    }

    return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
  }

  private escapeIdentifier(identifier: string) {
    return `"${identifier.replace(/"/g, '""')}"`;
  }

  private extractErrorTrace(error: unknown) {
    if (error instanceof Error) {
      return error.stack ?? error.message;
    }

    return String(error);
  }

  private shortenQuery(query: string): string {
    return query.replace(/\s+/g, ' ').trim().slice(0, 300);
  }
}
