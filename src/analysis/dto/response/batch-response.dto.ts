import { ApiProperty } from '@nestjs/swagger';

export class BatchResponseDto {
  @ApiProperty({ example: '10' })
  batch_id: string;
}

export class DeleteBatchResponseDto {
  @ApiProperty({ example: '10' })
  batch_id: string;

  @ApiProperty({ example: true })
  deleted: boolean;

  @ApiProperty({ example: '2026-04-13T12:34:56.000Z', nullable: true })
  deleted_at: string | null;
}

export class HardDeleteFileCountsDto {
  @ApiProperty({ example: 2 })
  json: number;

  @ApiProperty({ example: 5 })
  images: number;
}

export class HardDeleteBatchResponseDto {
  @ApiProperty({ example: '10' })
  batch_id: string;

  @ApiProperty({ example: true })
  hard_deleted: boolean;

  @ApiProperty({ type: HardDeleteFileCountsDto })
  deleted_files: HardDeleteFileCountsDto;
}
