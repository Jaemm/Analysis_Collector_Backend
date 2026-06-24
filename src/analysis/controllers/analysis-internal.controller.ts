import {
  Body,
  Controller,
  Get,
  Headers,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCodes } from '../../common/exceptions/error-codes';
import { AnalysisQueryService } from '../services/analysis-query.service';

@Public()
@Controller('internal/analysis')
export class AnalysisInternalController {
  constructor(private readonly queryService: AnalysisQueryService) {}

  @Get('batches/:batch_id(\\d+)/webhook-result')
  async getWebhookResult(
    @Param('batch_id') batchId: string,
    @Headers('x-internal-analysis-token') internalToken?: string,
  ) {
    this.assertInternalToken(internalToken);

    const result = await this.queryService.getInternalWebhookResult(batchId);

    if (!result) {
      throw new AppException(
        ErrorCodes.NOT_FOUND,
        'Analysis batch not found.',
        HttpStatus.NOT_FOUND,
      );
    }

    return result;
  }

  @Post('batches/search')
  async searchWebhookBatches(
    @Headers('x-internal-analysis-token') internalToken: string | undefined,
    @Body()
    body: {
      customer_ids?: Array<string | number>;
      consultant_ids?: Array<string | number>;
      limit?: number;
    },
  ) {
    this.assertInternalToken(internalToken);

    return this.queryService.searchInternalWebhookBatches(
      body.customer_ids ?? [],
      body.consultant_ids ?? [],
      Number(body.limit) || 20,
    );
  }

  private assertInternalToken(internalToken?: string) {
    const expectedToken = process.env.LOGIN_CRM_INTERNAL_TOKEN;

    if (expectedToken && internalToken !== expectedToken) {
      throw new AppException(
        ErrorCodes.AUTH_TOKEN_INVALID,
        'Invalid internal analysis token.',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
