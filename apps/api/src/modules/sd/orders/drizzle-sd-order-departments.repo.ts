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
