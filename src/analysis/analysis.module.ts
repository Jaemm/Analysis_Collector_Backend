import { Module } from '@nestjs/common';
import { AdminAnalysisController } from './controllers/admin-analysis.controller';
import { AnalysisController } from './controllers/analysis.controller';
import { AnalysisDownloadController } from './controllers/analysis-download.controller';
import { AnalysisInternalController } from './controllers/analysis-internal.controller';
import { AnalysisWebController } from './controllers/analysis-web.controller';
import { AnalysisService } from './services/analysis.service';
import { DatabaseService } from '../database/database.service';
import { S3Service } from '../s3/s3.service';
import { DatabaseModule } from 'src/database/database.module';
import { LoggerModule } from 'src/common/logger/logger.module';
import { AuthModule } from 'src/common/auth/auth.module';
import { AnalysisDownloadService } from './services/analysis-download.service';
import { AnalysisQueryService } from './services/analysis-query.service';
import { AnalysisUploadService } from './services/analysis-upload.service';
import { AnalysisCompletionWebhookService } from './services/analysis-completion-webhook.service';

@Module({
  imports: [DatabaseModule, LoggerModule, AuthModule],
  controllers: [
    AdminAnalysisController,
    AnalysisController,
    AnalysisDownloadController,
    AnalysisInternalController,
    AnalysisWebController,
  ],
  providers: [
    AnalysisService,
    AnalysisDownloadService,
    DatabaseService,
    S3Service,
    AnalysisUploadService,
    AnalysisQueryService,
    AnalysisCompletionWebhookService,
  ],
})
export class AnalysisModule {}
