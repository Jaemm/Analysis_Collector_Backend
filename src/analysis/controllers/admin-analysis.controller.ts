import { Controller, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AdminGuard } from '../../common/auth/guards/admin.guard';
import { ApiCommonErrorResponses } from '../../common/decorators/api-error-response.decorator';
import { ApiSuccessResponse } from '../../common/decorators/api-response.decorator';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCodes } from '../../common/exceptions/error-codes';
import { HardDeleteBatchResponseDto } from '../dto/response/batch-response.dto';
import { AnalysisService } from '../services/analysis.service';

@ApiTags('admin-analysis')
@ApiBearerAuth('bearer')
@UseGuards(AdminGuard)
@Controller('admin/analysis')
export class AdminAnalysisController {
  constructor(private analysisService: AnalysisService) {}

  @Post('batches/:batch_id(\\d+)/hard-delete')
  @ApiOperation({ summary: 'Hard delete analysis batch' })
  @ApiParam({ name: 'batch_id', example: '123' })
  @ApiSuccessResponse(HardDeleteBatchResponseDto)
  @ApiCommonErrorResponses()
  async hardDeleteBatch(@Param('batch_id') batchId: string) {
    const deleted = await this.analysisService.hardDeleteBatch(batchId);

    if (!deleted) {
      throw new AppException(
        ErrorCodes.NOT_FOUND,
        'Analysis batch not found.',
        HttpStatus.NOT_FOUND,
      );
    }

    return deleted;
  }
}
