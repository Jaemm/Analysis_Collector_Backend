import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';

export type AnalysisType = 'online' | 'offline' | 'quick';

export class CreateBatchDto {
  @ApiProperty({
    required: false,
    enum: ['online', 'offline', 'quick'],
    default: 'online',
    description:
      'Use quick for analysis batches that are not tied to a customer.',
  })
  @IsOptional()
  @IsIn(['online', 'offline', 'quick'])
  analysis_type?: AnalysisType;

  @ApiProperty({
    required: false,
    example: '1001',
    description:
      'Required for online/offline analysis. Omit for quick analysis.',
  })
  @ValidateIf((dto: CreateBatchDto) => dto.analysis_type !== 'quick')
  @IsString()
  @Matches(/^\d+$/)
  customer_id?: string;

  @ApiProperty({
    required: false,
    example: 'device-001',
    description: 'Client device identifier used when the batch was created.',
  })
  @IsOptional()
  @IsString()
  device_id?: string;
}
