import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { TimestampDto } from './timestamp.dto';

type TimestampRow = {
  id: number;
  mode?: string | null;
  onoff_mode?: string | null;
  consultant_id?: number | null;
  consultant_company_id?: number | null;
  customer_id?: number | null;
  optic_number?: string | null;
  app_id?: number | null;
  batch_id?: number | null;
  crm?: any;
  questionnaire?: any;
  capture?: any;
  analysis?: any;
  result?: any;
};

@Injectable()
export class TimestampService {
  constructor(private db: DatabaseService) {}

  private calculateDuration(start: string, end: string): string | null {
    try {
      const startTime = new Date(start).getTime();
      const endTime = new Date(end).getTime();
      if (isNaN(startTime) || isNaN(endTime)) {
        return null;
      }

      const totalSeconds = Math.floor((endTime - startTime) / 1000);
      const hours = Math.floor(totalSeconds / 3600)
        .toString()
        .padStart(2, '0');
      const minutes = Math.floor((totalSeconds % 3600) / 60)
        .toString()
        .padStart(2, '0');
      const seconds = (totalSeconds % 60).toString().padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    } catch {
      return null;
    }
  }

  private addDuration(field: any): any {
    if (field?.event_start && field?.event_finish) {
      const duration = this.calculateDuration(
        field.event_start,
        field.event_finish,
      );
      return { ...field, duration };
    }

    return field;
  }

  private parseNullableInt(value?: string): number | null {
    return parseInt(value, 10) || null;
  }

  private toStringResponse(row: TimestampRow): any {
    const stringifyEventData = (data: any) => ({
      event_start: data?.event_start ?? '',
      event_finish: data?.event_finish ?? '',
      duration: data?.duration ?? '',
    });

    return {
      id: row.id.toString(),
      mode: row.mode,
      onoff_mode: row.onoff_mode,
      consultant_id: row.consultant_id?.toString(),
      consultant_company_id: row.consultant_company_id?.toString(),
      customer_id: row.customer_id?.toString(),
      app_id: row.app_id?.toString(),
      optic_number: row.optic_number?.toString(),
      batch_id: row.batch_id?.toString(),
      crm: stringifyEventData(row.crm),
      questionnaire: stringifyEventData(row.questionnaire),
      capture: stringifyEventData(row.capture),
      analysis: stringifyEventData(row.analysis),
      result: stringifyEventData(row.result),
    };
  }

  async create(dto: TimestampDto) {
    const rows = await this.db.query(
      `
      INSERT INTO offline_timestamp (
        mode,
        onoff_mode,
        consultant_id,
        consultant_company_id,
        customer_id,
        optic_number,
        app_id,
        batch_id,
        crm,
        questionnaire,
        capture,
        analysis,
        result
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11::jsonb, $12::jsonb, $13::jsonb)
      RETURNING *
      `,
      [
        dto.mode ?? null,
        dto.onoff_mode ?? null,
        this.parseNullableInt(dto.consultant_id),
        this.parseNullableInt(dto.consultant_company_id),
        this.parseNullableInt(dto.customer_id),
        dto.optic_number || null,
        this.parseNullableInt(dto.app_id),
        this.parseNullableInt(dto.batch_id),
        JSON.stringify(this.addDuration(dto.crm) ?? null),
        JSON.stringify(this.addDuration(dto.questionnaire) ?? null),
        JSON.stringify(this.addDuration(dto.capture) ?? null),
        JSON.stringify(this.addDuration(dto.analysis) ?? null),
        JSON.stringify(this.addDuration(dto.result) ?? null),
      ],
    );

    return this.toStringResponse(rows[0]);
  }

  async findAll() {
    const rows = await this.db.query(
      `
      SELECT *
      FROM offline_timestamp
      ORDER BY id DESC
      `,
    );

    return rows.map((row) => this.toStringResponse(row));
  }

  async findOne(id: number) {
    const rows = await this.db.query(
      `
      SELECT *
      FROM offline_timestamp
      WHERE id = $1
      `,
      [id],
    );

    return rows[0] ? this.toStringResponse(rows[0]) : null;
  }
}
