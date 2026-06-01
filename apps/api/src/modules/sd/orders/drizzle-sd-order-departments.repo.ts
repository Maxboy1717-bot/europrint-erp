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
