import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { S3Service } from '../../s3/s3.service';

type DownloadBatch = {
  batch_id: string;
  synced_at: Date | string | null;
  json_files: Array<{ key: string }>;
  image_keys: string[];
};

@Injectable()
export class AnalysisDownloadService {
  constructor(
    private db: DatabaseService,
    private s3: S3Service,
  ) {}

  async downloadByBatch(batchId: string) {
    const batches = await this.db.query(
      `
      SELECT ab.id AS batch_id, ab.synced_at
      FROM analysis_batches ab
      WHERE ab.id = $1
        AND ab.deleted_at IS NULL
      `,
      [batchId],
    );

    if (!batches.length) {
      return null;
    }

    const [batch] = await this.loadBatchDownloads(
      batches.map((row) => ({
        batch_id: String(row.batch_id),
        synced_at: row.synced_at ?? null,
      })),
    );

    return batch ? this.formatBatchUrls(batch) : null;
  }

  async downloadByCustomer(customerId: string) {
    const batchRows = await this.getCustomerBatches(customerId);
    const batches = await this.loadBatchDownloads(batchRows);
    return { batches: batches.map((batch) => this.formatBatchUrls(batch)) };
  }

  async downloadByConsultant(consultantId: string) {
    const batchRows = await this.getConsultantBatches(consultantId);
    const batches = await this.loadBatchDownloads(batchRows);
    return { batches: batches.map((batch) => this.formatBatchUrls(batch)) };
  }

  private getConsultantBatches(
    consultantId: string,
  ): Promise<Array<{ batch_id: string; synced_at: Date | string | null }>> {
    return this.db.query(
      `
      SELECT ab.id AS batch_id, ab.synced_at
      FROM analysis_batches ab
      WHERE ab.consultant_id = $1
        AND ab.deleted_at IS NULL
      ORDER BY ab.synced_at DESC NULLS LAST, ab.created_at DESC
      `,
      [consultantId],
    );
  }

  private getCustomerBatches(
    customerId: string,
  ): Promise<Array<{ batch_id: string; synced_at: Date | string | null }>> {
    return this.db.query(
      `
      SELECT ab.id AS batch_id, ab.synced_at
      FROM analysis_batches ab
      WHERE ab.customer_id = $1
        AND ab.deleted_at IS NULL
      ORDER BY ab.synced_at DESC NULLS LAST, ab.created_at DESC
      `,
      [customerId],
    );
  }

  private async loadBatchDownloads(
    batches: Array<{ batch_id: string; synced_at?: Date | string | null }>,
  ): Promise<DownloadBatch[]> {
    if (!batches.length) {
      return [];
    }

    const batchIds = batches.map((batch) => batch.batch_id);

    const [jsonRows, imageRows] = await Promise.all([
      this.db.query(
        `
        SELECT batch_id, json_key
        FROM analysis_result_files
        WHERE batch_id = ANY($1::bigint[])
        ORDER BY batch_id, created_at DESC, id DESC
        `,
        [batchIds],
      ),
      this.db.query(
        `
        SELECT batch_id, image_key
        FROM analysis_batch_images
        WHERE batch_id = ANY($1::bigint[])
        ORDER BY batch_id, created_at DESC, id DESC
        `,
        [batchIds],
      ),
    ]);

    const jsonByBatch = new Map<string, Array<{ key: string }>>();
    for (const row of jsonRows) {
      const key = String(row.batch_id);
      const current = jsonByBatch.get(key) ?? [];
      current.push({ key: row.json_key });
      jsonByBatch.set(key, current);
    }

    const imageByBatch = new Map<string, string[]>();
    for (const row of imageRows) {
      const key = String(row.batch_id);
      const current = imageByBatch.get(key) ?? [];
      current.push(row.image_key);
      imageByBatch.set(key, current);
    }

    return batches.map((batch) => ({
      batch_id: batch.batch_id,
      synced_at: batch.synced_at ?? null,
      json_files: jsonByBatch.get(batch.batch_id) ?? [],
      image_keys: imageByBatch.get(batch.batch_id) ?? [],
    }));
  }

  private formatBatchUrls(batch: DownloadBatch) {
    return {
      batch_id: String(batch.batch_id),
      synced_at: this.formatTimestamp(batch.synced_at),
      json_urls: (batch.json_files || []).map((file) =>
        this.s3.getCdnUrl(file.key),
      ),
      image_urls: Array.from(
        new Set((batch.image_keys || []).map((key) => this.s3.getCdnUrl(key))),
      ),
    };
  }

  private formatTimestamp(value: Date | string | null) {
    if (!value) {
      return null;
    }

    return value instanceof Date ? value.toISOString() : value;
  }
}
