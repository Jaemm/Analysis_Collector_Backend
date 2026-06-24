import { IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TimestampDto {
  @ApiPropertyOptional({ example: 'offline' })
  @IsOptional()
  @IsString()
  mode?: string;

  @ApiPropertyOptional({ example: 'offline' })
  @IsOptional()
  @IsString()
  onoff_mode?: string;

  @ApiPropertyOptional({ example: '1001' })
  @IsOptional()
  @IsString()
  consultant_id?: string;

  @ApiPropertyOptional({ example: '2001' })
  @IsOptional()
  @IsString()
  consultant_company_id?: string;

  @ApiPropertyOptional({ example: '3001' })
  @IsOptional()
  @IsString()
  customer_id?: string;

  @ApiPropertyOptional({ example: 'OPTIC-001' })
  @IsOptional()
  @IsString()
  optic_number?: string;

  @ApiPropertyOptional({ example: '4001' })
  @IsOptional()
  @IsString()
  app_id?: string;

  @ApiPropertyOptional({ example: '5001' })
  @IsOptional()
  @IsString()
  batch_id?: string;

  @ApiPropertyOptional({
    example: {
      event_start: '2026-04-13T10:00:00.000Z',
      event_finish: '2026-04-13T10:00:03.000Z',
    },
  })
  @IsOptional()
  @IsObject()
  crm?: {
    event_start: string;
    event_finish: string;
  };

  @ApiPropertyOptional({
    example: {
      event_start: '2026-04-13T10:00:03.000Z',
      event_finish: '2026-04-13T10:00:08.000Z',
    },
  })
  @IsOptional()
  @IsObject()
  questionnaire?: {
    event_start: string;
    event_finish: string;
  };

  @ApiPropertyOptional({
    example: {
      event_start: '2026-04-13T10:00:08.000Z',
      event_finish: '2026-04-13T10:00:15.000Z',
    },
  })
  @IsOptional()
  @IsObject()
  capture?: {
    event_start: string;
    event_finish: string;
  };

  @ApiPropertyOptional({
    example: {
      event_start: '2026-04-13T10:00:15.000Z',
      event_finish: '2026-04-13T10:00:30.000Z',
    },
  })
  @IsOptional()
  @IsObject()
  analysis?: {
    event_start: string;
    event_finish: string;
  };

  @ApiPropertyOptional({
    example: {
      event_start: '2026-04-13T10:00:30.000Z',
      event_finish: '2026-04-13T10:00:35.000Z',
    },
  })
  @IsOptional()
  @IsObject()
  result?: {
    event_start: string;
    event_finish: string;
  };
}

export class TimestampEventResponseDto {
  @ApiProperty({ example: '2026-04-13T10:00:00.000Z' })
  event_start: string;

  @ApiProperty({ example: '2026-04-13T10:00:03.000Z' })
  event_finish: string;

  @ApiProperty({ example: '00:00:03' })
  duration: string;
}

export class TimestampResponseDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiPropertyOptional({ example: 'offline' })
  mode?: string;

  @ApiPropertyOptional({ example: 'offline' })
  onoff_mode?: string;

  @ApiPropertyOptional({ example: '1001' })
  consultant_id?: string;

  @ApiPropertyOptional({ example: '2001' })
  consultant_company_id?: string;

  @ApiPropertyOptional({ example: '3001' })
  customer_id?: string;

  @ApiPropertyOptional({ example: '4001' })
  app_id?: string;

  @ApiPropertyOptional({ example: 'OPTIC-001' })
  optic_number?: string;

  @ApiPropertyOptional({ example: '5001' })
  batch_id?: string;

  @ApiProperty({ type: TimestampEventResponseDto })
  crm: TimestampEventResponseDto;

  @ApiProperty({ type: TimestampEventResponseDto })
  questionnaire: TimestampEventResponseDto;

  @ApiProperty({ type: TimestampEventResponseDto })
  capture: TimestampEventResponseDto;

  @ApiProperty({ type: TimestampEventResponseDto })
  analysis: TimestampEventResponseDto;

  @ApiProperty({ type: TimestampEventResponseDto })
  result: TimestampEventResponseDto;
}

export class TimestampCreateResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: '데이터 저장 성공' })
  message: string;

  @ApiProperty({ type: TimestampResponseDto })
  data: TimestampResponseDto;
}

export class TimestampListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: [TimestampResponseDto] })
  data: TimestampResponseDto[];
}

export class TimestampDetailResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: TimestampResponseDto, nullable: true })
  data: TimestampResponseDto | null;
}
