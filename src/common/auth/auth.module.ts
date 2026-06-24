import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AdminGuard } from './guards/admin.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoggerModule } from '../logger/logger.module';
import { StagingAuthController } from './controllers/staging-auth.controller';

@Module({
  imports: [LoggerModule],
  controllers: [StagingAuthController],
  providers: [AuthService, AdminGuard, JwtAuthGuard],
  exports: [AuthService, AdminGuard, JwtAuthGuard],
})
export class AuthModule {}
