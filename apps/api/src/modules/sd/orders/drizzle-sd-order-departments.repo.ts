/**
 * @module drizzle-sd-order-departments.repo
 * @description Repository for sd_order_departments — the manager's per-order department
 *   selection that drives the Phase 4 advance-paid fan-out. Raw SQL (simple CRUD on a
 *   table with no Drizzle def); returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Result, Ok, Err } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class SdOrderDepartmentsRepository {
  async setForOrder(orderId: number, depts: Array<{ department: string; mode?: string }>): Promise<Result<Row[]>> {
    try {
      for (const d of depts) {
        await runQuery(sql`
          INSERT INTO sd_order_departments (order_id, department, mode, status)
          VALUES (${orderId}, ${d.department}, ${d.mode ?? null}, 'pending')
          ON CONFLICT (order_id, department)
          DO UPDATE SET mode = EXCLUDED.mode, updated_at = NOW()
        `);
      }
      return this.listForOrder(orderId);
    } catch (e: unknown) { return Err((e as Error)?.message || "Bo'lim tanlashni saqlashda xatolik"); }
  }

  async listForOrder(orderId: number): Promise<Result<Row[]>> {
    try {
      const r = await runQuery<Row>(sql`
        SELECT id, order_id, department, mode, status, created_at, updated_at
        FROM sd_order_departments WHERE order_id = ${orderId} ORDER BY department
      `);
      return Ok(r.rows);
    } catch (e: unknown) { return Err((e as Error)?.message || "Bo'limlarni o'qishda xatolik"); }
  }

  /** Create the mold dept-job for an order (Phase 4 fan-out). Idempotent: skips if a mold
   *  row already exists for the order. vendor is NOT NULL (CHECK) — defaults to 'Internal'
   *  for auto-created jobs (the mold dept reassigns it). status defaults to 'ORDERED' (started). */
  async createMoldJob(orderId: number): Promise<Result<{ created: boolean }>> {
    try {
      const r = await runQuery<Row>(sql`
        INSERT INTO ow_molds (order_id, vendor, status)
        SELECT ${orderId}, 'Internal', 'ORDERED'
        WHERE NOT EXISTS (SELECT 1 FROM ow_molds WHERE order_id = ${orderId})
        RETURNING id
      `);
      return Ok({ created: r.rows.length > 0 });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Mold job yaratishda xatolik'); }
  }

  /** Saga view: the order + its selected departments + the mold dept-track detail
   *  (ow_molds keyed to sd_sales_orders.id). Reuses the ow_molds table + progress pattern. */
  async getSaga(orderId: number): Promise<Result<Row>> {
    try {
      const ord = await runQuery<Row>(sql`
        SELECT id, order_number, status, advance_status, advance_paid, total_amount
        FROM sd_sales_orders WHERE id = ${orderId} AND deleted_at IS NULL LIMIT 1
      `);
      if (!ord.rows[0]) return Err(`Buyurtma #${orderId} topilmadi`);
      const depts = await runQuery<Row>(sql`
        SELECT department, mode, status FROM sd_order_departments WHERE order_id = ${orderId} ORDER BY department
      `);
      const molds = await runQuery<Row>(sql`
        SELECT id, vendor, status, order_sent_at, received_at FROM ow_molds WHERE order_id = ${orderId} ORDER BY id
      `);
      const moldRows = molds.rows;
      const moldDone = moldRows.filter((m) => m['status'] === 'RECEIVED').length;
      const moldPct  = moldRows.length ? Math.round((moldDone / moldRows.length) * 100) : 0;
      return Ok({
        order: ord.rows[0],
        departments: depts.rows,
        tracks: [
          { name: 'mold', count: moldRows.length, done: moldDone, progressPct: moldPct, rows: moldRows },
        ],
      });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Saga ko\'rinishini o\'qishda xatolik'); }
  }

  /** Update a mold dept-job's detailed status (ORDERED->IN_TRANSIT->RECEIVED/REJECTED).
   *  When RECEIVED, stamp received_at and mark the mold department 'done'. */
  async setMoldStatus(orderId: number, moldId: string, status: string): Promise<Result<Row | null>> {
    try {
      const r = await runQuery<Row>(sql`
        UPDATE ow_molds
           SET status = ${status},
               received_at = CASE WHEN ${status} = 'RECEIVED' THEN NOW() ELSE received_at END
         WHERE id = ${moldId}::uuid AND order_id = ${orderId}
        RETURNING id, vendor, status, received_at
      `);
      if (!r.rows[0]) return Err('Mold topilmadi');
      if (status === 'RECEIVED') await this.markStatus(orderId, 'mold', 'done');
      return Ok(r.rows[0]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Mold statusini yangilashda xatolik'); }
  }

  async markStatus(orderId: number, department: string, status: string): Promise<Result<void>> {
    try {
      await runQuery(sql`
        UPDATE sd_order_departments SET status = ${status}, updated_at = NOW()
        WHERE order_id = ${orderId} AND department = ${department}
      `);
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Status yangilashda xatolik'); }
  }
}
