import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { TimestampController } from './timestamp.controller';
import { TimestampService } from './timestamp.service';

@Module({
  imports: [DatabaseModule],
  controllers: [TimestampController],
  providers: [TimestampService],
})
export class TimestampModule {}
