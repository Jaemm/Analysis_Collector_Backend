import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HealthStatusDto {
  @ApiProperty({ example: 'ok' })
  status: string;

  @ApiProperty({ example: '2026-04-13T12:34:56.000Z' })
  timestamp: string;
}

export class HealthDatabaseDto {
  @ApiProperty({ example: 'ok', enum: ['ok', 'error'] })
  database: 'ok' | 'error';

  @ApiPropertyOptional({ example: 'connect ECONNREFUSED 127.0.0.1:5432' })
  message?: string;
}

export class HealthS3Dto {
  @ApiProperty({ example: 'ok', enum: ['ok', 'error'] })
  s3: 'ok' | 'error';

  @ApiPropertyOptional({
    example:
      'The AWS Access Key Id you provided does not exist in our records.',
  })
  message?: string;
}

export class HealthReadyDto {
  @ApiProperty({ example: 'ready', enum: ['ready', 'not_ready'] })
  status: 'ready' | 'not_ready';
}
