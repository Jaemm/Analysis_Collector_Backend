import { ApiProperty } from '@nestjs/swagger';

export class ConfirmUploadResponseDto {
  @ApiProperty({ example: 'confirmed' })
  status: string;

  @ApiProperty({ example: 2 })
  json_file_count: number;

  @ApiProperty({ example: 3 })
  image_file_count: number;
}
