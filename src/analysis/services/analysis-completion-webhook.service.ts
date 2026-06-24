import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { DatabaseService } from '../../database/database.service';

type AnalysisCompletionPayload = {
  batch_id: number;
  customer_id: number | null;
  consultant_id: number | null;
  app_id: string | number | null;
  analysis_type: string | null;
};

@Injectable()
export class AnalysisCompletionWebhookService {
  private readonly logger = new Logger(AnalysisCompletionWebhookService.name);

  constructor(private readonly db: DatabaseService) {}

  async notifyBatchConfirmed(batchId: string): Promise<void> {
    const webhookUrl = process.env.LOGIN_CRM_ANALYSIS_COMPLETE_URL;

    if (!webhookUrl) {
      return;
    }

    try {
      const rows = await this.db.query(
        `
        SELECT
          id AS batch_id,
          customer_id,
          consultant_id,
          app_id,
          analysis_type
        FROM analysis_batches
        WHERE id = $1
          AND deleted_at IS NULL
        LIMIT 1
        `,
        [batchId],
      );

      const batch = rows[0];

      if (!batch) {
        this.logger.warn(`[SKIP] batch not found for completion webhook batchId=${batchId}`);
        return;
      }

      const payload: AnalysisCompletionPayload = {
        batch_id: Number(batch.batch_id),
        customer_id: this.toOptionalNumber(batch.customer_id),
        consultant_id: this.toOptionalNumber(batch.consultant_id),
        app_id: batch.app_id ?? null,
        analysis_type: batch.analysis_type ?? null,
      };

      const timeoutMs = this.resolveTimeoutMs();
      const token = process.env.LOGIN_CRM_INTERNAL_TOKEN;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['x-internal-analysis-token'] = token;
      }

      await axios.post(webhookUrl, payload, {
        headers,
        timeout: timeoutMs,
        validateStatus: (status) => status >= 200 && status < 300,
      });

      this.logger.log(`[DONE] completion webhook sent batchId=${batchId}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.warn(
          `[WEBHOOK FAILED] completion webhook batchId=${batchId} message=${error.message} status=${
            error.response?.status ?? null
          }`,
        );
        return;
      }

      this.logger.warn(
        `[WEBHOOK FAILED] completion webhook batchId=${batchId} message=${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private toOptionalNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private resolveTimeoutMs(): number {
    const parsed = Number(process.env.LOGIN_CRM_WEBHOOK_TIMEOUT_MS);

    if (!Number.isFinite(parsed) || parsed < 1000) {
      return 10000;
    }

    return parsed;
  }
}
