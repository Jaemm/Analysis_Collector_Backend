import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  name: process.env.DB_NAME,
  bootstrapDatabase: process.env.DB_BOOTSTRAP_DATABASE || 'postgres',
  autoCreateDatabase: process.env.DB_AUTO_CREATE_DATABASE !== 'false',
  autoMigrate: process.env.DB_AUTO_MIGRATE !== 'false',
  ssl: process.env.DB_SSL !== 'false',
  sslRejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true',
}));
