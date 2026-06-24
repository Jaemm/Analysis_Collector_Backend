import { Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../decorators/public.decorator';
import { ApiCommonErrorResponses } from '../../decorators/api-error-response.decorator';
import { ApiSuccessResponse } from '../../decorators/api-response.decorator';
import { AuthService } from '../auth.service';
import { StagingMasterTokenResponseDto } from '../dto/staging-master-token-response.dto';

@ApiTags('staging-auth')
@Public()
@Controller('staging/auth')
export class StagingAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('master-token')
  @ApiOperation({ summary: 'Issue staging master token' })
  @ApiSuccessResponse(StagingMasterTokenResponseDto, 201)
  @ApiCommonErrorResponses()
  async issueMasterToken() {
    return this.authService.issueStagingMasterToken();
  }
}
