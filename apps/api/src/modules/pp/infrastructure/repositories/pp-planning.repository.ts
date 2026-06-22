/**
 * @module pp-planning.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (PP)
 */

import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import type { IPpPlanningRepo } from '../../domain/repositories/i-pp-planning.repo';

type Row = Record<string, unknown>;
const exec = (q: SQL | SQLWrapper): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

@Injectable()
export class PpPlanningRepository implements IPpPlanningRepo {
  async getSchedule(start: string, end: string): Promise<Result<Row[]>>  {
  try {
      return exec(sql`SELECT po.id, po.order_number, po.product_id, po.quantity, po.planned_start_date, po.planned_end_date, po.status, wc.name AS work_center_name, mc.xom_ashyo AS product_name FROM production_orders po LEFT JOIN work_centers wc ON wc.id = po.work_center_id LEFT JOIN material_cards mc ON mc.id = po.product_id WHERE po.planned_start_date BETWEEN ${start} AND ${end} ORDER BY po.planned_start_date`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createScheduleEntry(body: Row): Promise<Result<Row | null>>  {
  try {
      // Read the DTO's snake_case keys (PpCreateScheduleEntrySchema) and map them onto the
      // real production_orders columns. is_urgent/is_frozen keep their DB defaults (golden-thread
      // priority columns — additive insert contract preserved).
      const r = await exec(sql`INSERT INTO production_orders (order_number, product_id, quantity, planned_quantity, planned_start_date, planned_end_date, work_center_id, responsible_manager_id, sales_order_id, notes, status) VALUES (CONCAT('PO-', EXTRACT(EPOCH FROM NOW())::bigint), ${body.work_order_id ?? null}, ${body.quantity ?? 1}, ${body.quantity ?? 1}, ${body.planned_start ?? null}, ${body.planned_end ?? null}, ${body.work_center_id ?? null}, ${body.operator_id ?? null}, ${body.sales_order_id ?? null}, ${body.notes ?? null}, 'planned') RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async updateOperation(id: number, body: Row): Promise<Result<Row | null>>  {
  try {
      // A planning "operation" is the production_orders row surfaced by getSchedule.
      // Persist the DTO's snake_case fields (PpUpdateOperationSchema): status / progress / actual_time / notes.
      const r = await exec(sql`UPDATE production_orders SET status = COALESCE(${body.status ?? null}, status), progress = COALESCE(${body.progress ?? null}, progress), actual_time = COALESCE(${body.actual_time ?? null}, actual_time), notes = COALESCE(${body.notes ?? null}, notes), updated_at = NOW() WHERE id = ${id} RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }
}
