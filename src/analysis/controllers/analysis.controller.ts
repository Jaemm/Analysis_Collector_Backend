import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Req,
  Res,
  Delete,
} from '@nestjs/common';
import { Response } from 'express';
import { AnalysisService } from '../services/analysis.service';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
  ApiOkResponse,
} from '@nestjs/swagger';
import { ApiCommonErrorResponses } from '../../common/decorators/api-error-response.decorator';
import { ApiSuccessResponse } from '../../common/decorators/api-response.decorator';
import { CreateBatchDto } from '../dto/create-batch.dto';
import {
  buildFailureResponse,
  buildSuccessResponse,
} from '../../common/response/response-format';
import {
  BatchResponseDto,
  DeleteBatchResponseDto,
} from '../dto/response/batch-response.dto';
import { AnalysisResultDto } from '../dto/response/analysis-result.dto';
import { ConfirmUploadResponseDto } from '../dto/response/confirm-upload-response.dto';
import {
  AnalysisCommentDto,
  AnalysisCommentGetResponseDto,
  AnalysisCommentResponseDto,
} from '../dto/analysis-comment.dto';
import {
  UploadUrlsRequestDto,
  UploadUrlsResponseDto,
} from '../dto/upload-urls.dto';

@ApiTags('analysis')
@Controller('analysis')
export class AnalysisController {
  constructor(private analysisService: AnalysisService) {}

  private normalizeValue(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const normalized = String(value).trim();
    return normalized && normalized !== 'undefined' ? normalized : null;
  }

  @Post('batches')
  @ApiOperation({
    summary: 'Create analysis batch',
    description:
      'Creates a batch before uploading result JSON and image files.',
  })
  @ApiBearerAuth('bearer')
  @ApiSuccessResponse(BatchResponseDto, 201)
  @ApiCommonErrorResponses()
  async start(@Body() dto: CreateBatchDto, @Req() req: any) {
    const user = req.user;
    const analysisType = dto.analysis_type ?? 'online';

    return this.analysisService.createBatch(
      analysisType === 'quick' ? null : this.normalizeValue(dto.customer_id),
      analysisType,
      this.normalizeValue(user?.app_id ?? user?.appId),
      this.normalizeValue(user?.id ?? user?.sub),
      this.normalizeValue(user?.email ?? user?.sub),
      this.normalizeValue(dto.device_id),
    );
  }

  @Post('batches/:batch_id(\\d+)/upload-urls')
  @ApiOperation({
    summary: 'Issue presigned upload URLs',
    description:
      'Returns presigned S3 upload URLs for result JSON files and image files belonging to a batch.',
  })
  @ApiBearerAuth('bearer')
  @ApiParam({ name: 'batch_id', example: '123' })
  @ApiBody({ type: UploadUrlsRequestDto })
  @ApiSuccessResponse(UploadUrlsResponseDto, 201)
  @ApiCommonErrorResponses()
  async getUploadUrls(
    @Param('batch_id') batchId: string,
    @Body() body: UploadUrlsRequestDto,
  ) {
    return this.analysisService.getUploadUrls(batchId, body);
  }

  @Post('batches/:batch_id(\\d+)/confirm')
  @ApiOperation({
    summary: 'Confirm batch upload',
    description:
      'Marks a batch as uploaded after the client finishes uploading all files to the issued presigned URLs.',
  })
  @ApiBearerAuth('bearer')
  @ApiParam({ name: 'batch_id', example: '123' })
  @ApiSuccessResponse(ConfirmUploadResponseDto, 201)
  @ApiCommonErrorResponses()
  async confirmUpload(@Param('batch_id') batchId: string) {
    return this.analysisService.confirmUpload(batchId);
  }

  @Post('comment')
  @ApiOperation({ summary: 'Create or update analysis batch comment' })
  @ApiBearerAuth('bearer')
  @ApiBody({ type: AnalysisCommentDto })
  @ApiOkResponse({ type: AnalysisCommentResponseDto })
  @ApiCommonErrorResponses()
  async analysisComment(
    @Body() body: AnalysisCommentDto,
    @Res() res: Response,
  ) {
    try {
      const updated = await this.analysisService.updateComment(
        body.batchId,
        body.comment,
      );

      if (!updated) {
        return res
          .status(404)
          .json(
            buildFailureResponse(
              'Analysis batch not found.',
              `batch_id ${body.batchId} was not found.`,
            ),
          );
      }

      return res
        .status(200)
        .json(
          buildSuccessResponse(
            {
              service: 'analysis/comment',
              response: 'Comment inserted',
            },
            'Comment inserted',
          ),
        );
    } catch (error) {
      return res
        .status(500)
        .json(
          buildFailureResponse(
            'Failed to insert comment.',
            error instanceof Error ? error.message : String(error),
          ),
        );
    }
  }

  @Get('comment/:batch_id(\\d+)')
  @ApiOperation({ summary: 'Get analysis batch comment' })
  @ApiBearerAuth('bearer')
  @ApiParam({ name: 'batch_id', example: '123' })
  @ApiOkResponse({ type: AnalysisCommentGetResponseDto })
  @ApiCommonErrorResponses()
  async getAnalysisComment(
    @Param('batch_id') batchId: string,
    @Res() res: Response,
  ) {
    try {
      const comment = await this.analysisService.getComment(batchId);

      if (!comment) {
        return res
          .status(404)
          .json(
            buildFailureResponse(
              'Analysis batch not found.',
              `batch_id ${batchId} was not found.`,
            ),
          );
      }

      return res
        .status(200)
        .json(
          buildSuccessResponse(
            {
              service: 'analysis/comment',
              response: 'Comment found',
              result: {
                batchId: Number(comment.batch_id),
                comment: comment.analysis_comment,
              },
            },
            'Comment found',
          ),
        );
    } catch (error) {
      return res
        .status(500)
        .json(
          buildFailureResponse(
            'Failed to get comment.',
            error instanceof Error ? error.message : String(error),
          ),
        );
    }
  }

  @Get('batches/:batch_id(\\d+)')
  @ApiOperation({ summary: 'Get analysis batch detail' })
  @ApiBearerAuth('bearer')
  @ApiParam({ name: 'batch_id', example: '123' })
  @ApiSuccessResponse(AnalysisResultDto)
  @ApiCommonErrorResponses()
  async getBatch(@Param('batch_id') batchId: string) {
    return this.analysisService.getFullResult(batchId);
  }

  @Delete('batches/:batch_id(\\d+)')
  @ApiOperation({
    summary: 'Soft delete analysis batch',
    description:
      'Marks a batch as deleted. Uploaded files remain in storage until an admin hard delete is executed.',
  })
  @ApiBearerAuth('bearer')
  @ApiParam({ name: 'batch_id', example: '123' })
  @ApiSuccessResponse(DeleteBatchResponseDto)
  @ApiCommonErrorResponses()
  async deleteBatch(@Param('batch_id') batchId: string, @Req() req: any) {
    const user = req.user;
    const deleted = await this.analysisService.deleteBatch(
      batchId,
      this.normalizeValue(user?.id ?? user?.sub ?? user?.email),
    );

    if (!deleted) {
      return {
        batch_id: batchId,
        deleted: false,
        deleted_at: null,
      };
    }

    return deleted;
  }
}
