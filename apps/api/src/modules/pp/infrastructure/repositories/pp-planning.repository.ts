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
      return exec(sql`SELECT po.id, po.order_number, po.product_id, po.quantity, po.planned_start, po.planned_end, po.status, wc.name AS work_center_name, mc.xom_ashyo AS product_name FROM production_orders po LEFT JOIN work_centers wc ON wc.id = po.work_center_id LEFT JOIN material_cards mc ON mc.id = po.product_id WHERE po.planned_start BETWEEN ${start} AND ${end} ORDER BY po.planned_start`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createScheduleEntry(body: Row): Promise<Result<Row | null>>  {
  try {
      const r = await exec(sql`INSERT INTO production_orders (order_number, product_id, quantity, planned_start, planned_end, work_center_id, status) VALUES (CONCAT('PO-', EXTRACT(EPOCH FROM NOW())::bigint), ${body.productId ?? null}, ${body.quantity ?? 1}, ${body.plannedStart ?? null}, ${body.plannedEnd ?? null}, ${body.workCenterId ?? null}, 'planned') RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async updateOperation(id: number, body: Row): Promise<Result<Row | null>>  {
  try {
      const r = await exec(sql`UPDATE pp_routing_operations SET status = COALESCE(${body.status ?? null}, status), work_center_id = COALESCE(${body.workCenterId ?? null}, work_center_id), planned_duration = COALESCE(${body.plannedDuration ?? null}, planned_duration), updated_at = NOW() WHERE id = ${id} RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }
}
