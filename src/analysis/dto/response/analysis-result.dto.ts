import { ApiProperty } from '@nestjs/swagger';

export class AnalysisResultDto {
  @ApiProperty({ example: '10' })
  batch_id: string;

  @ApiProperty({
    required: false,
    nullable: true,
    example: 'This is the comment for this analysis',
  })
  analysis_comment?: string | null;

  @ApiProperty({ type: [String] })
  json_urls: string[];

  @ApiProperty({ type: [String] })
  image_urls: string[];
}
