/**
 * @module qc-extended-final.repository (infrastructure)
 * @description Sub-repository for QC extended — final inspections aggregate
 *   (list/create/update/complete + queue of orders pending final QC).
 *   Split from `qc-extended.repository.ts` (Wave 13 PR1) per the
 *   Wave 9 R16 umbrella-pattern. Plain `@Injectable()` — the umbrella
 *   `QcExtendedRepository` is the sole implementer of `IQcExtendedRepo`.
 * @layer Infrastructure (QC)
 */

import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

type Row = Record<string, unknown>;

@Injectable()
export class QcExtendedFinalRepository {
  async listFinalInspections(status: string | undefined, oid: number | null, lim: number, off: number): Promise<Result<Row[]>>  {
    try {
      // NOTE: qc_final_inspections schema uses `result` (not status), `papka_order_id` (not order_id),
      // `inspected_by` (FK to users, not employees). `inspector_name` is best-effort from users table.
      const rows = await runQuery<Row>(sql`
        SELECT fi.*, fi.result AS status, fi.papka_order_id, u.username AS inspector_name
        FROM qc_final_inspections fi
        LEFT JOIN users u ON u.id = fi.inspected_by
        WHERE (${status ?? null}::text IS NULL OR fi.result = ${status ?? null})
          AND (${oid}::int IS NULL OR fi.papka_order_id::text = ${oid}::text)
        ORDER BY fi.created_at DESC LIMIT ${lim} OFFSET ${off}
      `);
      return Ok(rows.rows as Row[]);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async createFinalInspection(
    order_id: number | null,
    inspector_id: number | null,
    status: string | null,
    notes: string | null,
    passed: boolean | null,
    sampleSize: number,
    defectCount: number,
    passedCount: number,
    defectRate: number | null,
  ): Promise<Result<Row>>  {
    try {
      // qc_final_inspections.papka_order_id is NOT NULL (no default) → must be supplied; the legacy
      // order_id/inspector_id/status columns are optional. Map to canonical cols (result is read by the
      // list query, status by update/complete — set both for consistency). inspected_by = FK to users.
      // sample_size / passed_count / defect_count / defect_rate — all exist in DB (verified info_schema).
      const resolvedStatus = status ?? 'pending';
      const rows = await runQuery<Row>(sql`
        INSERT INTO qc_final_inspections
          (papka_order_id, inspected_by, result, status, notes, passed,
           sample_size, passed_count, defect_count, defect_rate)
        VALUES
          (${order_id ?? null}, ${inspector_id ?? null},
           ${resolvedStatus}, ${resolvedStatus}, ${notes ?? null}, ${passed ?? false},
           ${sampleSize}, ${passedCount}, ${defectCount}, ${defectRate})
        RETURNING *
      `);
      const row = rows.rows[0] as Row;
      // Wrap in shape FE expects: { inspection: { ...row, status, defectRate } }
      return Ok({
        inspection: {
          ...row,
          status: (row['result'] ?? row['status']) as string,
          defectRate: Number(row['defect_rate'] ?? 0),
        },
      } as Row);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async updateFinalInspection(id: number, status: string | null, notes: string | null, passed: boolean | null): Promise<Result<Row[]>>  {
    try {
      const rows = await runQuery<Row>(sql`
        UPDATE qc_final_inspections
        SET status = COALESCE(${status ?? null}, status),
            notes = COALESCE(${notes ?? null}, notes),
            passed = COALESCE(${passed ?? null}, passed),
            updated_at = NOW()
        WHERE id = ${id} RETURNING *
      `);
      return Ok(rows.rows as Row[]);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async getFinalOrders(lim: number): Promise<Result<Row[]>>  {
    try {
      // NOTE: sales_orders columns — document_number (not order_number),
      // master_status (not status), customer_id (FK; customer name joined from crm_companies).
      // qc_final_inspections links via papka_order_id, not sales_orders.id — so the inspection
      // join is best-effort and may be null until orders cross to papka workflow.
      const rows = await runQuery<Row>(sql`
        SELECT so.id, so.document_number AS order_number, so.master_status AS status,
               COALESCE(cc.title, so.sold_to_party) AS customer_name,
               NULL::text AS inspection_status, NULL::int AS inspection_id
        FROM sales_orders so
        LEFT JOIN crm_companies cc ON cc.id = so.customer_id
        WHERE so.master_status IN ('pending_qc_final', 'in_production', 'qc_failed', 'rework')
        ORDER BY so.created_at DESC LIMIT ${lim}
      `);
      return Ok(rows.rows as Row[]);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async completeFinalInspection(id: number, inspResult: string | null, notes: string | null, defect_count: number, passed: boolean): Promise<Result<Row[]>>  {
    try {
      const status = passed ? 'passed' : 'failed';
      const rows = await runQuery<Row>(sql`
        UPDATE qc_final_inspections
        SET status = ${status}, result = ${inspResult ?? null},
            notes = COALESCE(${notes ?? null}, notes), defect_count = ${defect_count},
            completed_at = NOW(), updated_at = NOW()
        WHERE id = ${id} RETURNING *
      `);
      return Ok(rows.rows as Row[]);
    } catch (_e) {
      return Err(String(_e));
    }
  }
}
