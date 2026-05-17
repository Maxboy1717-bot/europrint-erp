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

  async createFinalInspection(order_id: number | null, inspector_id: number | null, status: string | null, notes: string | null, passed: boolean | null): Promise<Result<Row>>  {
    try {
      const rows = await runQuery<Row>(sql`
        INSERT INTO qc_final_inspections (order_id, inspector_id, status, notes, passed)
        VALUES (${order_id ?? null}, ${inspector_id ?? null}, ${status ?? 'pending'}, ${notes ?? null}, ${passed ?? false})
        RETURNING *
      `);
      return Ok(rows.rows[0] as Row);
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
               COALESCE(cc.name, so.sold_to_party) AS customer_name,
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
