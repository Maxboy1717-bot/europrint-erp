/**
 * @module qc-norm-versions.repository
 * @description QC norma snapshot-versiyalash (qc_norm_versions) — modul 09 (09.39).
 *   Norma o'zgarganda joriy normalar JSON-snapshot sifatida yopiladi va yangi versiya
 *   ochiladi ([valid_from, valid_to) oynasi). getActiveAt = berilgan sanada faol bo'lgan
 *   versiyani qaytaradi — eski buyurtma o'sha paytdagi (eski) normaga bog'lanadi.
 *   Result (Qoida 1); raw SQL (Rule 4 — versiya-oyna resolyutsiyasi + MAX(version_no)).
 * @layer Repository (QC)
 */
import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Result, Ok, Err } from '@common/result';

export interface NormVersionRow {
  id: number;
  norm_ref: string;
  version_no: number;
  valid_from: string;
  valid_to: string | null;
  snapshot_json: unknown;
  note: string | null;
  created_by: number | null;
  created_at: string;
}

@Injectable()
export class QcNormVersionsRepository {
  /** Yangi versiya: joriy ochiq versiyani yopadi (valid_to=NOW()), yangi ochiq versiya kiritadi. */
  async snapshot(input: {
    normRef: string; snapshotJson: unknown; note: string | null; createdBy: number | null;
  }): Promise<Result<{ id: number; versionNo: number }>> {
    try {
      // 1) Joriy ochiq versiyani yopamiz (agar bo'lsa).
      await runQuery(sql`
        UPDATE qc_norm_versions SET valid_to = NOW()
        WHERE norm_ref = ${input.normRef} AND valid_to IS NULL
      `);
      // 2) Yangi ochiq versiya: version_no = mavjud maksimal + 1.
      const json = JSON.stringify(input.snapshotJson ?? {});
      const r = await runQuery<{ id: number; version_no: number }>(sql`
        INSERT INTO qc_norm_versions (norm_ref, version_no, snapshot_json, note, created_by, valid_from, valid_to)
        SELECT ${input.normRef}, COALESCE(MAX(version_no), 0) + 1, ${json}::jsonb,
               ${input.note}, ${input.createdBy}, NOW(), NULL
          FROM qc_norm_versions WHERE norm_ref = ${input.normRef}
        RETURNING id, version_no
      `);
      const row = r.rows[0];
      if (!row) return Err({ message: 'Norma versiyasi yaratilmadi', code: 'DB_ERROR' });
      return Ok({ id: row.id, versionNo: row.version_no });
    } catch (e) {
      const msg = (e as Error).message;
      // Partial unique index — poyga holatida bir vaqtda 2 ochiq versiya urinishi.
      if (msg.includes('uq_qc_norm_versions_open'))
        return Err({ message: 'Bu norma uchun allaqachon ochiq versiya mavjud', code: 'CONFLICT' });
      return Err({ message: msg, code: 'DB_ERROR' });
    }
  }

  /** norm_ref bo'yicha barcha versiyalar (yangi -> eski). */
  async listByRef(normRef: string): Promise<Result<NormVersionRow[]>> {
    try {
      const r = await runQuery<NormVersionRow>(sql`
        SELECT id, norm_ref, version_no, valid_from, valid_to, snapshot_json, note, created_by, created_at
        FROM qc_norm_versions WHERE norm_ref = ${normRef}
        ORDER BY version_no DESC
      `);
      return Ok(r.rows);
    } catch (e) { return Err({ message: (e as Error).message, code: 'DB_ERROR' }); }
  }

  /** Berilgan sanada (yoki hozir) faol bo'lgan versiya — buyurtmani eski normaga pin qilish mexanizmi. */
  async getActiveAt(normRef: string, at: string | null): Promise<Result<NormVersionRow>> {
    try {
      const r = await runQuery<NormVersionRow>(sql`
        SELECT id, norm_ref, version_no, valid_from, valid_to, snapshot_json, note, created_by, created_at
        FROM qc_norm_versions
        WHERE norm_ref = ${normRef}
          AND valid_from <= COALESCE(${at}::timestamptz, NOW())
          AND (valid_to IS NULL OR valid_to > COALESCE(${at}::timestamptz, NOW()))
        ORDER BY version_no DESC LIMIT 1
      `);
      if (!r.rows[0]) return Err({ message: 'Faol norma versiyasi topilmadi', code: 'NOT_FOUND' });
      return Ok(r.rows[0]);
    } catch (e) { return Err({ message: (e as Error).message, code: 'DB_ERROR' }); }
  }

  async getById(id: number): Promise<Result<NormVersionRow>> {
    try {
      const r = await runQuery<NormVersionRow>(sql`
        SELECT id, norm_ref, version_no, valid_from, valid_to, snapshot_json, note, created_by, created_at
        FROM qc_norm_versions WHERE id = ${id}
      `);
      if (!r.rows[0]) return Err({ message: 'Norma versiyasi topilmadi', code: 'NOT_FOUND' });
      return Ok(r.rows[0]);
    } catch (e) { return Err({ message: (e as Error).message, code: 'DB_ERROR' }); }
  }
}
