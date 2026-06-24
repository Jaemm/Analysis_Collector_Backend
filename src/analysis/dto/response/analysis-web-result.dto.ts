import { ApiProperty } from '@nestjs/swagger';

export class AnalysisWebResultDto {
  @ApiProperty({ example: '10' })
  batch_id: string;

  @ApiProperty({
    required: false,
    nullable: true,
    example: 'This is the comment for this analysis',
  })
  analysis_comment?: string | null;

  @ApiProperty({ type: [String] })
  image_urls: string[];

  @ApiProperty({
    type: 'object',
    additionalProperties: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
      },
    },
    example: {
      AI_hair_thickness: [
        {
          measurement_data: {
            algorithm_version: '1.1.4',
          },
        },
      ],
    },
  })
  results: Record<string, any[]>;
}
