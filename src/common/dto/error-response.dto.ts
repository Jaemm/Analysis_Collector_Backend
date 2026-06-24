import { ApiProperty } from '@nestjs/swagger';

export class ErrorDetailItemDTO {
  @ApiProperty({ example: 'customer_id' })
  field: string;

  @ApiProperty({
    example: ['customer_id must match /^\\d+$/ regular expression'],
  })
  reasons: string[];
}

export class ErrorBodyDTO {
  @ApiProperty({ example: 'VALIDATION_ERROR' })
  code: string;

  @ApiProperty({ example: 'Request validation failed.' })
  message: string;

  @ApiProperty({
    type: [ErrorDetailItemDTO],
    required: false,
  })
  details?: ErrorDetailItemDTO[];
}

export class ErrorResponseDTO {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 'a1b2c3d4' })
  requestId: string;

  @ApiProperty({ type: ErrorBodyDTO })
  error: ErrorBodyDTO;
}
