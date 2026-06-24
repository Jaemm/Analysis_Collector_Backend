import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { S3Service } from '../s3/s3.service';

@Injectable()
export class HealthService {
  constructor(
    private database: DatabaseService,
    private s3: S3Service,
  ) {}

  async checkServer() {
    return {
      status: 'ok',
      timestamp: new Date(),
    };
  }

  async checkDatabase() {
    try {
      await this.database.executeQuery('SELECT 1');

      return {
        database: 'ok',
      };
    } catch (error) {
      return {
        database: 'error',
        message: error.message,
      };
    }
  }

  // 추가
  async checkS3() {
    try {
      await this.s3.testConnection();

      return {
        s3: 'ok',
      };
    } catch (error) {
      return {
        s3: 'error',
        message: error.message,
      };
    }
  }

  // readiness 확장
  async checkReady() {
    try {
      await Promise.all([
        this.database.executeQuery('SELECT 1'),
        this.s3.testConnection(),
      ]);

      return {
        status: 'ready',
      };
    } catch (error) {
      return {
        status: 'not_ready',
      };
    }
  }
}
