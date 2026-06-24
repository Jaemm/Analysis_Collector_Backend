import { ApiProperty } from '@nestjs/swagger';

export class ResultUrlItemDto {
  @ApiProperty()
  url: string;
}

export class ResultUrlsResponseDto {
  @ApiProperty({ type: [ResultUrlItemDto] })
  json_files: ResultUrlItemDto[];

  @ApiProperty({ type: [ResultUrlItemDto] })
  image_files: ResultUrlItemDto[];
}
