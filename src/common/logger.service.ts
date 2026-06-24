import { Injectable } from '@nestjs/common';

@Injectable()
export class LoggerService {
  log(message: string, data?: any) {
    console.log(`[AnalysisCollector] ${message}`, data ?? '');
  }

  error(message: string, error?: any) {
    console.error(`[AnalysisCollector ERROR] ${message}`, error ?? '');
  }
}
