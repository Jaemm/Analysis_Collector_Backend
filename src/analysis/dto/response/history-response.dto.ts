import { ApiProperty } from '@nestjs/swagger';

export class HistoryItemDto {
  @ApiProperty({ example: '10' })
  id: string;

  @ApiProperty()
  created_at: string;
}
