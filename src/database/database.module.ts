import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { LoggerModule } from 'src/common/logger/logger.module';

@Module({
  imports: [LoggerModule],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
