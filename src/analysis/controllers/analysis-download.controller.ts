import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiCommonErrorResponses } from '../../common/decorators/api-error-response.decorator';
import { AnalysisService } from '../services/analysis.service';

@ApiTags('analysis-download')
@ApiBearerAuth('bearer')
@ApiCommonErrorResponses()
@Controller('analysis')
export class AnalysisDownloadController {
  constructor(private analysisService: AnalysisService) {}

  @Get('batches/:batch_id(\\d+)/result-urls')
  @ApiOperation({
    summary: 'Get batch result file URLs',
    description:
      'Returns stored result JSON and image download URLs for a batch.',
  })
  @ApiParam({ name: 'batch_id', example: '123' })
  @ApiOkResponse({
    description: 'Analysis result file URLs.',
    schema: { type: 'object', additionalProperties: true },
  })
  async downloadBatch(@Param('batch_id') batchId: string) {
    return this.analysisService.getDownloadJson(batchId);
  }

  @Get('customers/:customer_id(\\d+)/result-urls')
  @ApiOperation({
    summary: 'Get customer result file URLs',
    description:
      'Returns stored result JSON and image download URLs for a customer.',
  })
  @ApiParam({ name: 'customer_id', example: '1001' })
  @ApiOkResponse({
    description: 'Customer analysis result file URLs.',
    schema: { type: 'object', additionalProperties: true },
  })
  async downloadCustomer(@Param('customer_id') customerId: string) {
    return this.analysisService.getDownloadByCustomer(customerId);
  }

  @Get('consultants/:consultant_id(\\d+)/result-urls')
  @ApiOperation({
    summary: 'Get consultant result file URLs',
    description:
      'Returns stored result JSON and image download URLs for a consultant.',
  })
  @ApiParam({ name: 'consultant_id', example: '5001' })
  @ApiOkResponse({
    description: 'Consultant analysis result file URLs.',
    schema: { type: 'object', additionalProperties: true },
  })
  async downloadConsultant(@Param('consultant_id') consultantId: string) {
    return this.analysisService.getDownloadByConsultant(consultantId);
  }
}
