import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ApiCommonErrorResponses } from '../../common/decorators/api-error-response.decorator';
import { ApiSuccessResponse } from '../../common/decorators/api-response.decorator';
import { AnalysisWebResultDto } from '../dto/response/analysis-web-result.dto';
import { AnalysisService } from '../services/analysis.service';

@ApiTags('analysis-web')
@Public()
@Controller('analysis/web')
export class AnalysisWebController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Get('results/:batch_id(\\d+)')
  @ApiOperation({ summary: 'Get analysis result for web' })
  @ApiParam({ name: 'batch_id', example: '123' })
  @ApiSuccessResponse(AnalysisWebResultDto)
  @ApiCommonErrorResponses()
  async getBatch(@Param('batch_id') batchId: string) {
    return this.analysisService.getWebResult(batchId);
  }
}
