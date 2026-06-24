import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsArray, IsString } from 'class-validator';

export class UploadUrlsRequestDto {
  @ApiProperty({
    type: [String],
    example: ['result1.json', 'result2.json'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  json_files?: string[];

  @ApiProperty({
    type: [String],
    example: ['img1.jpg', 'img2.jpg'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  image_files?: string[];
}

export class UploadFileItemDto {
  @ApiProperty()
  file_name: string;

  @ApiProperty()
  key: string;

  @ApiProperty()
  upload_url: string;
}

export class UploadUrlsResponseDto {
  @ApiProperty({ type: [UploadFileItemDto] })
  json_files: UploadFileItemDto[];

  @ApiProperty({ type: [UploadFileItemDto] })
  image_files: UploadFileItemDto[];
}
