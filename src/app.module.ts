import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import databaseConfig from './config/database.config';
import { envValidationSchema } from './config/env.validation';

import { AnalysisModule } from './analysis/analysis.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { HealthModule } from './health/health.module';
import { AccessLogInterceptor } from './common/interceptors/access-log.interceptor';
import { LoggerModule } from './common/logger/logger.module';
import { ContextInterceptor } from './common/interceptors/context.interceptor';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { DatabaseModule } from './database/database.module';
import { S3Module } from './s3/s3.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AuthModule } from './common/auth/auth.module';
import { JwtAuthGuard } from './common/auth/guards/jwt-auth.guard';
import { TimestampModule } from './timestamp/timestamp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      validationSchema: envValidationSchema,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60,
          limit: 100,
        },
      ],
    }),
    AnalysisModule,
    HealthModule,
    LoggerModule,
    DatabaseModule,
    S3Module,
    AuthModule,
    TimestampModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    AccessLogInterceptor,
    RequestIdInterceptor,
    ContextInterceptor,
    ResponseInterceptor,
    HttpExceptionFilter,
  ],
})
export class AppModule {}
