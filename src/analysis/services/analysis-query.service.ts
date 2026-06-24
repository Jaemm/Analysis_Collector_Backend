import { Injectable } from '@nestjs/common';
import { AnalysisType } from '../dto/create-batch.dto';
import { DatabaseService } from '../../database/database.service';
import { S3Service } from '../../s3/s3.service';

@Injectable()
export class AnalysisQueryService {
  constructor(
    private db: DatabaseService,
    private s3: S3Service,
  ) {}

  async createBatch(
    customerId: string | null,
    analysisType: AnalysisType,
    appId: string | null,
    consultantId: string | null,
    consultantEmail: string | null,
    deviceId?: string | null,
  ) {
    const result = await this.db.query(
      `
      INSERT INTO analysis_batches
      (customer_id, analysis_type, app_id, consultant_id, consultant_email, device_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
      `,
      [
        customerId,
        analysisType,
        appId,
        consultantId,
        consultantEmail,
        deviceId ?? null,
      ],
    );

    return { batch_id: result[0].id };
  }

  async updateBatchComment(batchId: number, comment?: string | null) {
    const result = await this.db.query(
      `
      UPDATE analysis_batches
      SET analysis_comment = $2
      WHERE id = $1
        AND deleted_at IS NULL
      RETURNING id AS batch_id, analysis_comment
      `,
      [batchId, comment ?? null],
    );

    return result[0] ?? null;
  }

  async getBatchComment(batchId: string) {
    const result = await this.db.query(
      `
      SELECT id AS batch_id, analysis_comment
      FROM analysis_batches
      WHERE id = $1
        AND deleted_at IS NULL
      `,
      [batchId],
    );

    return result[0] ?? null;
  }

  async softDeleteBatch(batchId: string, deletedBy?: string | null) {
    const result = await this.db.query(
      `
      UPDATE analysis_batches
      SET deleted_at = NOW(),
          deleted_by = $2
      WHERE id = $1
        AND deleted_at IS NULL
      RETURNING id AS batch_id, deleted_at
      `,
      [batchId, deletedBy ?? null],
    );

    return result[0] ?? null;
  }

  async getBatchStorageKeys(batchId: string) {
    const batchRows = await this.db.query(
      `
      SELECT id AS batch_id
      FROM analysis_batches
      WHERE id = $1
      `,
      [batchId],
    );

    if (!batchRows.length) {
      return null;
    }

    const jsonRows = await this.db.query(
      `
      SELECT json_key
      FROM analysis_result_files
      WHERE batch_id = $1
      `,
      [batchId],
    );

    const imageRows = await this.db.query(
      `
      SELECT image_key
      FROM analysis_batch_images
      WHERE batch_id = $1
      `,
      [batchId],
    );

    return {
      batch_id: String(batchRows[0].batch_id),
      json_keys: jsonRows.map((row) => row.json_key),
      image_keys: imageRows.map((row) => row.image_key),
    };
  }

  async hardDeleteBatch(batchId: string) {
    const result = await this.db.query(
      `
      DELETE FROM analysis_batches
      WHERE id = $1
      RETURNING id AS batch_id
      `,
      [batchId],
    );

    return result[0] ?? null;
  }

  async getBatchDetail(batchId: string) {
    const batchRows = await this.db.query(
      `
      SELECT
        ab.id AS batch_id,
        ab.analysis_comment
      FROM analysis_batches ab
      WHERE ab.id = $1
        AND ab.deleted_at IS NULL
      `,
      [batchId],
    );

    if (!batchRows.length) {
      return {
        batch_id: batchId,
        analysis_comment: null,
        json_urls: [],
        image_urls: [],
      };
    }

    const jsonRows = await this.db.query(
      `
      SELECT json_key
      FROM analysis_result_files
      WHERE batch_id = $1
      ORDER BY created_at DESC, id DESC
      `,
      [batchId],
    );

    const imageRows = await this.db.query(
      `
      SELECT image_key
      FROM analysis_batch_images
      WHERE batch_id = $1
      ORDER BY created_at DESC, id DESC
      `,
      [batchId],
    );

    return {
      batch_id: batchId,
      analysis_comment: batchRows[0].analysis_comment ?? null,
      json_urls: jsonRows.map((row) => this.s3.getCdnUrl(row.json_key)),
      image_urls: Array.from(
        new Set(imageRows.map((row) => this.s3.getCdnUrl(row.image_key))),
      ),
    };
  }

  async getWebBatchResult(batchId: string) {
    const batchRows = await this.db.query(
      `
      SELECT
        ab.id AS batch_id,
        ab.analysis_comment
      FROM analysis_batches ab
      WHERE ab.id = $1
        AND ab.deleted_at IS NULL
      `,
      [batchId],
    );

    if (!batchRows.length) {
      return {
        batch_id: batchId,
        analysis_comment: null,
        image_urls: [],
        results: {},
      };
    }

    const jsonRows = await this.db.query(
      `
      SELECT json_key
      FROM analysis_result_files
      WHERE batch_id = $1
      ORDER BY created_at DESC, id DESC
      `,
      [batchId],
    );

    const imageRows = await this.db.query(
      `
      SELECT image_key
      FROM analysis_batch_images
      WHERE batch_id = $1
      ORDER BY created_at DESC, id DESC
      `,
      [batchId],
    );

    const parsedResults = await Promise.all(
      jsonRows.map(async (row) => {
        const buffer = await this.s3.getFile(row.json_key);
        return {
          type: this.extractResultType(row.json_key),
          data: JSON.parse(buffer.toString('utf-8')),
        };
      }),
    );

    const results = parsedResults.reduce<Record<string, any[]>>((acc, item) => {
      if (!acc[item.type]) {
        acc[item.type] = [];
      }

      acc[item.type].push(item.data);
      return acc;
    }, {});

    return {
      batch_id: batchId,
      analysis_comment: batchRows[0].analysis_comment ?? null,
      image_urls: Array.from(
        new Set(imageRows.map((row) => this.s3.getCdnUrl(row.image_key))),
      ),
      results,
    };
  }

  async getInternalWebhookResult(batchId: string) {
    const batchRows = await this.db.query(
      `
      SELECT
        ab.id AS batch_id,
        ab.customer_id,
        ab.consultant_id,
        ab.app_id,
        ab.analysis_type,
        ab.sync_status,
        ab.synced_at,
        ab.created_at
      FROM analysis_batches ab
      WHERE ab.id = $1
        AND ab.deleted_at IS NULL
      `,
      [batchId],
    );

    if (!batchRows.length) {
      return null;
    }

    const result = await this.getWebBatchResult(batchId);

    return {
      ...result,
      customer_id: batchRows[0].customer_id ?? null,
      consultant_id: batchRows[0].consultant_id ?? null,
      app_id: batchRows[0].app_id ?? null,
      analysis_type: batchRows[0].analysis_type ?? null,
      sync_status: batchRows[0].sync_status ?? null,
      synced_at: batchRows[0].synced_at ?? null,
      created_at: batchRows[0].created_at ?? null,
    };
  }

  async searchInternalWebhookBatches(
    customerIds: Array<string | number>,
    consultantIds: Array<string | number>,
    limit: number,
  ) {
    const normalizedCustomerIds = customerIds
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id));
    const normalizedConsultantIds = consultantIds
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id));

    if (!normalizedCustomerIds.length && !normalizedConsultantIds.length) {
      return {
        batches: [],
      };
    }

    const rows = await this.db.query(
      `
      SELECT
        ab.id AS batch_id,
        ab.customer_id,
        ab.consultant_id,
        ab.app_id,
        ab.analysis_type,
        ab.sync_status,
        ab.synced_at,
        ab.created_at
      FROM analysis_batches ab
      WHERE ab.deleted_at IS NULL
        AND (
          ($1::bigint[] IS NOT NULL AND ab.customer_id = ANY($1::bigint[]))
          OR ($2::bigint[] IS NOT NULL AND ab.consultant_id = ANY($2::bigint[]))
        )
      ORDER BY COALESCE(ab.synced_at, ab.created_at) DESC, ab.id DESC
      LIMIT $3
      `,
      [
        normalizedCustomerIds.length ? normalizedCustomerIds : null,
        normalizedConsultantIds.length ? normalizedConsultantIds : null,
        Math.min(Math.max(limit, 1), 100),
      ],
    );

    return {
      batches: rows.map((row) => ({
        batch_id: Number(row.batch_id),
        customer_id: row.customer_id === null ? null : Number(row.customer_id),
        consultant_id:
          row.consultant_id === null ? null : Number(row.consultant_id),
        app_id: row.app_id ?? null,
        analysis_type: row.analysis_type ?? null,
        sync_status: row.sync_status ?? null,
        synced_at: row.synced_at ?? null,
        created_at: row.created_at ?? null,
      })),
    };
  }

  private extractResultType(jsonKey: string) {
    const fileName = jsonKey.split('/').pop() || jsonKey;
    const baseName = fileName.replace(/\.json$/i, '');
    const parts = baseName.split('_');
    const aiIndex = parts.findIndex((part) => part === 'AI');

    if (aiIndex >= 0 && parts.length - aiIndex > 2) {
      return parts.slice(aiIndex, -1).join('_');
    }

    return baseName;
  }
}
