import { ApiProperty } from '@nestjs/swagger';

export class StagingMasterTokenResponseDto {
  @ApiProperty({ example: 'Bearer' })
  token_type: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.staging.payload.signature',
  })
  access_token: string;

  @ApiProperty({ example: 604800 })
  expires_in: number;

  @ApiProperty({ example: '0' })
  consultant_id: string;

  @ApiProperty({ example: 'staging-master@chowis.com' })
  consultant_email: string;

  @ApiProperty({ example: '0' })
  app_id: string;

  @ApiProperty({ example: true })
  is_master: boolean;
}
