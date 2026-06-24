import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiResponseDTO<T> {
  @ApiProperty({
    example: true,
  })
  success: boolean;

  @ApiProperty({
    example: 'a1b2c3d4',
  })
  requestId: string;

  @ApiPropertyOptional({
    example: '데이터 저장 성공',
  })
  message?: string;

  data: T;
}
