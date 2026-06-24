import { Injectable, HttpStatus } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { S3Service } from '../../s3/s3.service';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCodes } from '../../common/exceptions/error-codes';
import { AnalysisCompletionWebhookService } from './analysis-completion-webhook.service';

@Injectable()
export class AnalysisUploadService {
  constructor(
    private db: DatabaseService,
    private s3: S3Service,
    private completionWebhook: AnalysisCompletionWebhookService,
  ) {}

  private buildJsonKey(batchId: string, fileName: string) {
    const env = process.env.NODE_ENV || 'dev';
    return `${env}/analysis/json/${batchId}/${fileName}`;
  }

  private buildImageKey(batchId: string, fileName: string) {
    const env = process.env.NODE_ENV || 'dev';
    return `${env}/analysis/images/${batchId}/${fileName}`;
  }

  private buildJsonPrefix(batchId: string) {
    return this.buildJsonKey(batchId, '');
  }

  private buildImagePrefix(batchId: string) {
    return this.buildImageKey(batchId, '');
  }

  // presigned URL 한번에 발급
  async getUploadUrls(batchId: string, body: any) {
    const jsonFiles: string[] = body.json_files || [];
    const imageFiles: string[] = body.image_files || [];

    if (!batchId) {
      throw new AppException(
        ErrorCodes.INVALID_BATCH_ID,
        'batch_id is required.',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.ensureBatchActive(batchId);

    const jsonUploads = await Promise.all(
      jsonFiles.map(async (fileName) => {
        const key = this.buildJsonKey(batchId, fileName);

        return {
          file_name: fileName,
          key,
          upload_url: await this.s3.getUploadSignedUrl(key, 'application/json'),
        };
      }),
    );

    const imageUploads = await Promise.all(
      imageFiles.map(async (fileName) => {
        const key = this.buildImageKey(batchId, fileName);

        return {
          file_name: fileName,
          key,
          upload_url: await this.s3.getUploadSignedUrl(key, 'image/jpeg'),
        };
      }),
    );

    return {
      json_files: jsonUploads,
      image_files: imageUploads,
    };
  }

  // confirm
  async confirmUpload(batchId: string) {
    if (!batchId) {
      throw new AppException(
        ErrorCodes.INVALID_BATCH_ID,
        'batch_id is required.',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.ensureBatchActive(batchId);

    const uniqueJsonKeys: string[] = Array.from(
      new Set(await this.s3.listKeys(this.buildJsonPrefix(batchId))),
    );

    await this.db.query(
      `DELETE FROM analysis_result_files WHERE batch_id = $1`,
      [batchId],
    );

    if (uniqueJsonKeys.length) {
      const values = uniqueJsonKeys
        .map((_, i) => {
          const idx = i * 2;
          return `($${idx + 1}, $${idx + 2})`;
        })
        .join(',');

      const params = uniqueJsonKeys.flatMap((key) => [batchId, key]);

      await this.db.query(
        `
        INSERT INTO analysis_result_files (batch_id, json_key)
        VALUES ${values}
        `,
        params,
      );
    }

    await this.db.query(
      `DELETE FROM analysis_batch_images WHERE batch_id = $1`,
      [batchId],
    );

    const uniqueKeys: string[] = Array.from(
      new Set(await this.s3.listKeys(this.buildImagePrefix(batchId))),
    );

    if (uniqueKeys.length) {
      const values = uniqueKeys
        .map((_, i) => {
          const idx = i * 2;
          return `($${idx + 1}, $${idx + 2})`;
        })
        .join(',');

      const params = uniqueKeys.flatMap((key) => [batchId, key]);

      await this.db.query(
        `
        INSERT INTO analysis_batch_images (batch_id, image_key)
        VALUES ${values}
        `,
        params,
      );
    }

    await this.markBatchConfirmed(batchId);
    await this.completionWebhook.notifyBatchConfirmed(batchId);

    return {
      status: 'confirmed',
      json_file_count: uniqueJsonKeys.length,
      image_file_count: uniqueKeys.length,
    };
  }

  deleteFiles(keys: string[]) {
    return this.s3.deleteFiles(keys);
  }

  private async markBatchConfirmed(batchId: string) {
    try {
      await this.db.query(
        `
        UPDATE analysis_batches
        SET sync_status = 'confirmed',
            synced_at = NOW()
        WHERE id = $1
          AND deleted_at IS NULL
        `,
        [batchId],
      );
    } catch (error) {
      if ((error as any)?.code === '42703') {
        return;
      }

      throw error;
    }
  }

  private async ensureBatchActive(batchId: string) {
    const result = await this.db.query(
      `
      SELECT id
      FROM analysis_batches
      WHERE id = $1
        AND deleted_at IS NULL
      `,
      [batchId],
    );

    if (!result.length) {
      throw new AppException(
        ErrorCodes.NOT_FOUND,
        'Analysis batch not found.',
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
