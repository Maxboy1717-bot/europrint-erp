/**
 * @module erp-extra.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { db , runQuery } from '@shared/db';

import { SECONDS_PER_HOUR, MAX_QUERY_LIMIT } from '@common/constants/app.constants';
type Row = Record<string, unknown>;
const exec = (q: SQL | SQLWrapper): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

@Injectable()
export class ErpExtraRepository {
  async listWorkCenters(limit: number, offset: number): Promise<Result<Row[]>>  {
  try {  
      const r = await exec(sql`SELECT wc.*, COUNT(e.id) AS equipment_count FROM work_centers wc LEFT JOIN equipment e ON e.work_center_id = wc.id GROUP BY wc.id ORDER BY wc.name LIMIT ${limit} OFFSET ${offset}`);
      if ((r.ok ? r.data : []).length > 0) return r;
      return exec(sql`SELECT id, code, name, hours_per_day AS capacity_per_hour, created_at FROM work_centers ORDER BY name LIMIT ${limit}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getWorkCenter(id: number): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`SELECT * FROM work_centers WHERE id = ${id}`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async updateWorkCenter(id: number, body: Row): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`UPDATE work_centers SET name = COALESCE(${body.name ?? null}, name), hours_per_day = COALESCE(${body.capacityPerHour ?? null}::numeric, hours_per_day) WHERE id = ${id} RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getWorkCenterStats(id: number): Promise<Result<Row>>  {
  try {  
      const r = await exec(sql`SELECT wc.id, wc.name, COUNT(ms.id) FILTER (WHERE ms.status = 'active') AS active_sessions, AVG(EXTRACT(EPOCH FROM (ms.end_time - ms.start_time))/${SECONDS_PER_HOUR}) FILTER (WHERE ms.status = 'completed') AS avg_duration_hours FROM work_centers wc LEFT JOIN mes_sessions ms ON ms.work_center_id = wc.id WHERE wc.id = ${id} GROUP BY wc.id, wc.name`);
      return r.ok ? Ok(r.data[0] ?? { id, activeSessionCount: 0, avgDurationHours: 0 }) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listOrders(limit: number, offset: number, status?: string): Promise<Result<Row[]>>  {
  try {  
      return status
        ? exec(sql`SELECT po.*, mc.xom_ashyo AS product_name, wc.name AS work_center_name FROM production_orders po LEFT JOIN material_cards mc ON mc.id = po.product_id LEFT JOIN work_centers wc ON wc.id = po.work_center_id WHERE po.status = ${status} ORDER BY po.created_at DESC LIMIT ${limit} OFFSET ${offset}`)
        : exec(sql`SELECT po.*, mc.xom_ashyo AS product_name, wc.name AS work_center_name FROM production_orders po LEFT JOIN material_cards mc ON mc.id = po.product_id LEFT JOIN work_centers wc ON wc.id = po.work_center_id ORDER BY po.created_at DESC LIMIT ${limit} OFFSET ${offset}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getOrder(id: number): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`SELECT po.*, mc.xom_ashyo AS product_name, wc.name AS work_center_name FROM production_orders po LEFT JOIN material_cards mc ON mc.id = po.product_id LEFT JOIN work_centers wc ON wc.id = po.work_center_id WHERE po.id = ${id}`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async updateOrder(id: number, body: Row): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`UPDATE production_orders SET status = COALESCE(${body.status ?? null}, status), notes = COALESCE(${body.notes ?? null}, notes), updated_at = NOW() WHERE id = ${id} RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listMrpRuns(limit: number, offset: number): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT * FROM erp_mrp_runs ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createMrpRun(body: Row): Promise<Result<Row>>  {
  try {  
      const r = await exec(sql`INSERT INTO erp_mrp_runs (run_date, status, notes, created_by) VALUES (NOW(), 'pending', ${body.notes ?? null}, ${body.createdBy ?? null}) RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? { id: 0, status: 'pending', createdAt: _time.now() }) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async calculateMrpRun(runId: number): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`UPDATE erp_mrp_runs SET status = 'running', started_at = NOW() WHERE id = ${runId} RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listMrpResults(runId?: number): Promise<Result<Row[]>>  {
  try {  
      return runId
        ? exec(sql`SELECT mr.*, mc.xom_ashyo AS material_name FROM erp_mrp_results mr LEFT JOIN material_cards mc ON mc.id = mr.material_id WHERE mr.run_id = ${runId} ORDER BY mr.created_at DESC LIMIT ${MAX_QUERY_LIMIT}`)
        : exec(sql`SELECT mr.*, mc.xom_ashyo AS material_name FROM erp_mrp_results mr LEFT JOIN material_cards mc ON mc.id = mr.material_id ORDER BY mr.created_at DESC LIMIT ${MAX_QUERY_LIMIT}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listPurchaseRequisitions(limit: number, offset: number): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT pr.*, mc.xom_ashyo AS material_name FROM erp_purchase_requisitions pr LEFT JOIN material_cards mc ON mc.id = pr.material_id ORDER BY pr.created_at DESC LIMIT ${limit} OFFSET ${offset}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listDashboardStats(): Promise<Result<Row>>  {
  try {
      const r = await exec(sql`SELECT (SELECT COUNT(*) FROM production_orders WHERE status = 'active') AS active_orders, (SELECT COUNT(*) FROM production_orders WHERE DATE(created_at) = CURRENT_DATE) AS today_orders, (SELECT COUNT(*) FROM work_centers) AS total_work_centers, (SELECT COUNT(*) FROM material_cards WHERE is_active = true) AS active_materials`);
      return r.ok ? Ok(r.data[0] ?? {}) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createOrder(body: Row): Promise<Result<Row | null>> {
  try {
    const orderNumber = body.orderNumber ?? `PO-${Date.now()}`;
    const r = await exec(sql`INSERT INTO production_orders (order_number, product_id, quantity, customer_name, due_date, priority, status, notes) VALUES (${orderNumber}, ${body.productId ?? null}, ${body.quantity ?? 1}, ${body.customerName ?? null}, ${body.dueDate ?? null}, ${body.priority ?? 'normal'}, ${body.status ?? 'pending'}, ${body.notes ?? null}) RETURNING *`);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  } catch (_e) { return Err(String(_e)); }
  }

  async deleteOrder(id: number): Promise<Result<Row | null>> {
  try {
    const r = await exec(sql`DELETE FROM production_orders WHERE id = ${id} RETURNING *`);
    return r.ok ? Ok(r.data[0] ?? { id, deleted: true }) : Err(r.error);
  } catch (_e) { return Err(String(_e)); }
  }

  async createWorkCenter(body: Row): Promise<Result<Row | null>> {
  try {
    const code = body.code ?? `WC-${Date.now()}`;
    const type = ['line','machine','workshop'].includes(String(body.type)) ? body.type : 'machine';
    const r = await exec(sql`INSERT INTO work_centers (code, name, name_ru, type, hours_per_day) VALUES (${code}, ${body.name ?? 'Yangi ish markazi'}, ${body.nameRu ?? null}, ${type}, ${body.hoursPerDay ?? body.capacityPerHour ?? 8}) RETURNING *`);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  } catch (_e) { return Err(String(_e)); }
  }

  async deleteWorkCenter(id: number): Promise<Result<Row | null>> {
  try {
    const r = await exec(sql`UPDATE work_centers SET deleted_at = NOW() WHERE id = ${id} RETURNING *`);
    return r.ok ? Ok(r.data[0] ?? { id, deleted: true }) : Err(r.error);
  } catch (_e) { return Err(String(_e)); }
  }
}
