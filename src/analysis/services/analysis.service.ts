import { Injectable } from '@nestjs/common';
import { AnalysisType } from '../dto/create-batch.dto';
import { AnalysisDownloadService } from './analysis-download.service';
import { AnalysisQueryService } from './analysis-query.service';
import { AnalysisUploadService } from './analysis-upload.service';

@Injectable()
export class AnalysisService {
  constructor(
    private downloadService: AnalysisDownloadService,
    private queryService: AnalysisQueryService,
    private uploadService: AnalysisUploadService,
  ) {}

  createBatch(
    customerId: string | null,
    analysisType: AnalysisType,
    appId: string | null,
    consultantId: string | null,
    consultantEmail: string | null,
    deviceId?: string | null,
  ) {
    return this.queryService.createBatch(
      customerId,
      analysisType,
      appId,
      consultantId,
      consultantEmail,
      deviceId,
    );
  }

  getFullResult(batchId: string) {
    return this.queryService.getBatchDetail(batchId);
  }

  getComment(batchId: string) {
    return this.queryService.getBatchComment(batchId);
  }

  updateComment(batchId: number, comment?: string | null) {
    return this.queryService.updateBatchComment(batchId, comment);
  }

  async deleteBatch(batchId: string, deletedBy?: string | null) {
    const deleted = await this.queryService.softDeleteBatch(batchId, deletedBy);

    if (!deleted) {
      return null;
    }

    return {
      batch_id: String(deleted.batch_id),
      deleted: true,
      deleted_at:
        deleted.deleted_at instanceof Date
          ? deleted.deleted_at.toISOString()
          : deleted.deleted_at,
    };
  }

  async hardDeleteBatch(batchId: string) {
    const target = await this.queryService.getBatchStorageKeys(batchId);

    if (!target) {
      return null;
    }

    const jsonKeys = target.json_keys || [];
    const imageKeys = target.image_keys || [];

    await this.uploadService.deleteFiles([...jsonKeys, ...imageKeys]);
    const deleted = await this.queryService.hardDeleteBatch(batchId);

    if (!deleted) {
      return null;
    }

    return {
      batch_id: String(deleted.batch_id),
      hard_deleted: true,
      deleted_files: {
        json: jsonKeys.length,
        images: imageKeys.length,
      },
    };
  }

  getWebResult(batchId: string) {
    return this.queryService.getWebBatchResult(batchId);
  }

  getDownloadJson(batchId: string) {
    return this.downloadService.downloadByBatch(batchId);
  }

  getDownloadByCustomer(customerId: string) {
    return this.downloadService.downloadByCustomer(customerId);
  }

  getDownloadByConsultant(consultantId: string) {
    return this.downloadService.downloadByConsultant(consultantId);
  }

  getUploadUrls(batchId: string, body: any) {
    return this.uploadService.getUploadUrls(batchId, body);
  }

  confirmUpload(batchId: string) {
    return this.uploadService.confirmUpload(batchId);
  }
}
