/**
 * @module reference-sample.repository
 * @description QC etalon (arxiv) namunalari (qc_reference_samples) — modul 09 (09#67, TASDIQ-2146 §09 #21).
 *   Namuna metadata + ombor joylashuvi + 6 oy saqlash muddati. retention_until = arxivlangan sana + retention_months.
 *   Muddat yaqinlashganda (30 kun) expiring_soon, o'tganda is_expired. Result (Qoida 1), repo-owns-DB (Qoida 6/15).
 *
 * NOTE: Raw SQL — retention sana-arifmetikasi va derived bayroqlar (kalibrovka patterni). ARCHITECTURE_RULES.md Rule 4.
 * @layer Repository (QC)
 */
import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Result, Ok, Err } from '@common/result';

export interface ReferenceSampleRow {
  id: number;
  sample_ref: string;
  product_id: number | null;
  order_id: number | null;
  inspection_id: number | null;
  description: string | null;
  storage_location: string | null;
  responsible_user_id: number | null;
  metadata_json: unknown;
  archived_at: string;
  retention_months: number;
  retention_until: string | null;
  status: string;
  disposed_at: string | null;
  notes: string | null;
  expiring_soon: boolean;
  is_expired: boolean;
}

// Derived bayroqlar (kalibrovka due_soon patterni): faqat arxivdagi namuna uchun.
const SELECT_COLS = sql`
  id, sample_ref, product_id, order_id, inspection_id, description, storage_location,
  responsible_user_id, metadata_json, archived_at, retention_months, retention_until,
  status, disposed_at, notes,
  (status = 'archived' AND retention_until IS NOT NULL AND retention_until <= CURRENT_DATE + 30) AS expiring_soon,
  (status = 'archived' AND retention_until IS NOT NULL AND retention_until <  CURRENT_DATE)      AS is_expired
`;

@Injectable()
export class ReferenceSampleRepository {
  async list(opts: { expiringSoonOnly: boolean; includeDisposed: boolean }): Promise<Result<ReferenceSampleRow[]>> {
    try {
      const statusFilter = opts.includeDisposed ? sql`` : sql`AND status = 'archived'`;
      const dueFilter = opts.expiringSoonOnly
        ? sql`AND retention_until IS NOT NULL AND retention_until <= CURRENT_DATE + 30`
        : sql``;
      const r = await runQuery<ReferenceSampleRow>(sql`
        SELECT ${SELECT_COLS}
        FROM qc_reference_samples
        WHERE 1 = 1 ${statusFilter} ${dueFilter}
        ORDER BY (retention_until IS NULL), retention_until ASC, id DESC
      `);
      return Ok(r.rows);
    } catch (e) { return Err({ message: (e as Error).message, code: 'DB_ERROR' }); }
  }

  async getById(id: number): Promise<Result<ReferenceSampleRow>> {
    try {
      const r = await runQuery<ReferenceSampleRow>(sql`
        SELECT ${SELECT_COLS} FROM qc_reference_samples WHERE id = ${id}
      `);
      if (!r.rows[0]) return Err({ message: 'Namuna topilmadi', code: 'NOT_FOUND' });
      return Ok(r.rows[0]);
    } catch (e) { return Err({ message: (e as Error).message, code: 'DB_ERROR' }); }
  }

  async create(input: {
    sampleRef: string; productId: number | null; orderId: number | null; inspectionId: number | null;
    description: string | null; storageLocation: string | null; responsibleUserId: number | null;
    retentionMonths: number; metadata: unknown;
  }): Promise<Result<{ id: number; retentionUntil: string | null }>> {
    try {
      const meta = JSON.stringify(input.metadata ?? {});
      const r = await runQuery<{ id: number; retention_until: string | null }>(sql`
        INSERT INTO qc_reference_samples
          (sample_ref, product_id, order_id, inspection_id, description, storage_location,
           responsible_user_id, retention_months, metadata_json, retention_until)
        VALUES
          (${input.sampleRef}, ${input.productId}, ${input.orderId}, ${input.inspectionId},
           ${input.description}, ${input.storageLocation}, ${input.responsibleUserId},
           ${input.retentionMonths}, ${meta}::jsonb,
           (CURRENT_DATE + (${input.retentionMonths} || ' months')::interval)::date)
        RETURNING id, retention_until
      `);
      const row = r.rows[0];
      if (!row) return Err({ message: 'Namuna qo\'shilmadi', code: 'DB_ERROR' });
      return Ok({ id: row.id, retentionUntil: row.retention_until });
    } catch (e) { return Err({ message: (e as Error).message, code: 'DB_ERROR' }); }
  }

  async update(id: number, patch: {
    sampleRef?: string | null; description?: string | null; storageLocation?: string | null;
    responsibleUserId?: number | null; notes?: string | null;
  }): Promise<Result<void>> {
    try {
      const r = await runQuery<{ id: number }>(sql`
        UPDATE qc_reference_samples SET
          sample_ref          = COALESCE(${patch.sampleRef ?? null}, sample_ref),
          description         = COALESCE(${patch.description ?? null}, description),
          storage_location    = COALESCE(${patch.storageLocation ?? null}, storage_location),
          responsible_user_id = COALESCE(${patch.responsibleUserId ?? null}, responsible_user_id),
          notes               = COALESCE(${patch.notes ?? null}, notes),
          updated_at          = NOW()
        WHERE id = ${id} RETURNING id
      `);
      if (r.rows.length === 0) return Err({ message: 'Namuna topilmadi', code: 'NOT_FOUND' });
      return Ok(undefined);
    } catch (e) { return Err({ message: (e as Error).message, code: 'DB_ERROR' }); }
  }

  /** Utilizatsiya: saqlash muddati tugagach etalon yo'q qilinadi (status=disposed). */
  async dispose(id: number): Promise<Result<void>> {
    try {
      const r = await runQuery<{ id: number }>(sql`
        UPDATE qc_reference_samples
        SET status = 'disposed', disposed_at = NOW(), updated_at = NOW()
        WHERE id = ${id} AND status = 'archived'
        RETURNING id
      `);
      if (r.rows.length === 0) return Err({ message: 'Faol namuna topilmadi', code: 'NOT_FOUND' });
      return Ok(undefined);
    } catch (e) { return Err({ message: (e as Error).message, code: 'DB_ERROR' }); }
  }

  async remove(id: number): Promise<Result<void>> {
    try {
      const r = await runQuery<{ id: number }>(sql`DELETE FROM qc_reference_samples WHERE id = ${id} RETURNING id`);
      if (r.rows.length === 0) return Err({ message: 'Namuna topilmadi', code: 'NOT_FOUND' });
      return Ok(undefined);
    } catch (e) { return Err({ message: (e as Error).message, code: 'DB_ERROR' }); }
  }
}
