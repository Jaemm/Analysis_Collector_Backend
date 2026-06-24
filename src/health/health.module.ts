import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { DatabaseModule } from '../database/database.module';
import { S3Module } from 'src/s3/s3.module';

@Module({
  imports: [DatabaseModule, S3Module],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
