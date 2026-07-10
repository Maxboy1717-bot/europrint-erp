/**
 * @module qc-material-scan.repository
 * @description Repository / data-access layer for qc_material_scan_log (Vision
 *   09-qc#11). Uses raw parametrised SQL — the SAME access idiom qc-new.repository
 *   already uses for its traceability / certificate writers — and returns Result<T>.
 *   Owns all DB access for the roll-scan log (Qoida 15).
 */

import { Injectable } from '@nestjs/common';
import { db, runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;

export interface RecordScanInput {
  orderId: number | null;
  sessionId: number | null;
  lot: string | null;
  materialId: number | null;
  workCenterId: number | null;
  shiftId: number | null;
  scannedBy: number | null;
  tabletId: string | null;
  localSeqNo: number | null;
  notes: string | null;
}

export interface FindScansFilter {
  orderId?: number;
  sessionId?: number;
  lot?: string;
  workCenterId?: number;
  fifo?: boolean;
  limit?: number;
}

@Injectable()
export class QcMaterialScanRepository {
  /**
   * Append-only per-roll scan insert with tablet idempotency (mirrors
   * IotTabletController.isDuplicateTabletSubmit): when BOTH tablet_id and
   * local_seq_no are supplied and a row already carries that pair, the scan has
   * already landed — return that row with idempotent:true and DO NOT insert a
   * second time. The partial unique index is the race backstop if two retries
   * slip past this probe.
   */
  async recordScan(
    input: RecordScanInput,
  ): Promise<Result<{ row: Row; idempotent: boolean }>> {
    return safeCall(async () => {
      if (input.tabletId != null && input.localSeqNo != null) {
        const dupe = await runQuery<Row>(sql`
          SELECT * FROM qc_material_scan_log
          WHERE tablet_id = ${input.tabletId} AND local_seq_no = ${input.localSeqNo}
          LIMIT 1
        `);
        const existing = Array.isArray(dupe.rows) ? dupe.rows[0] : undefined;
        if (existing) return { row: existing, idempotent: true };
      }
      const r = await db.execute(sql`
        INSERT INTO qc_material_scan_log
          (order_id, session_id, lot, material_id, work_center_id, shift_id,
           scanned_by, scanned_at, tablet_id, local_seq_no, notes, created_at)
        VALUES
          (${input.orderId}, ${input.sessionId}, ${input.lot}, ${input.materialId},
           ${input.workCenterId}, ${input.shiftId}, ${input.scannedBy}, NOW(),
           ${input.tabletId}, ${input.localSeqNo}, ${input.notes}, NOW())
        RETURNING *
      `);
      const rows = ((r as { rows?: Row[] }).rows) ?? [];
      return { row: (rows[0] ?? {}) as Row, idempotent: false };
    }, 'DB_ERROR');
  }

  /**
   * Scan history for guilty-lot tracing. All filters are optional and AND-combined;
   * fifo=true orders oldest-first (consumption order) instead of newest-first.
   */
  async findScans(filter: FindScansFilter): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const conds = [sql`1 = 1`];
      if (filter.orderId != null) conds.push(sql`order_id = ${filter.orderId}`);
      if (filter.sessionId != null) conds.push(sql`session_id = ${filter.sessionId}`);
      if (filter.lot != null) conds.push(sql`lot = ${filter.lot}`);
      if (filter.workCenterId != null) conds.push(sql`work_center_id = ${filter.workCenterId}`);
      const where = sql.join(conds, sql` AND `);
      const order = filter.fifo ? sql`scanned_at ASC, id ASC` : sql`scanned_at DESC, id DESC`;
      const lim = filter.limit && filter.limit > 0 && filter.limit <= 500 ? filter.limit : 200;
      const r = await runQuery<Row>(sql`
        SELECT * FROM qc_material_scan_log
        WHERE ${where}
        ORDER BY ${order}
        LIMIT ${lim}
      `);
      return Array.isArray(r.rows) ? r.rows : [];
    }, 'DB_ERROR');
  }
}
