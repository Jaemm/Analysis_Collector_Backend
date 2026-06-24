import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AnalysisCommentDto {
  @ApiProperty({ example: 6 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  batchId: number;

  @ApiPropertyOptional({ example: 'This is the comment for this analysis' })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class AnalysisCommentResponseDto {
  @ApiProperty({ example: 200 })
  status: number;

  @ApiProperty({ example: 'analysis/comment' })
  service: string;

  @ApiProperty({ example: 'Comment inserted' })
  response: string;
}

export class AnalysisCommentResultDto {
  @ApiProperty({ example: 6 })
  batchId: number;

  @ApiPropertyOptional({ example: 'This is the comment for this analysis' })
  comment?: string | null;
}

export class AnalysisCommentGetResponseDto {
  @ApiProperty({ example: 200 })
  status: number;

  @ApiProperty({ example: 'analysis/comment' })
  service: string;

  @ApiProperty({ example: 'Comment found' })
  response: string;

  @ApiProperty({ type: AnalysisCommentResultDto })
  result: AnalysisCommentResultDto;
}
