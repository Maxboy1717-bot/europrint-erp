import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { db , runQuery } from '@shared/db';

import { SECONDS_PER_HOUR } from '@common/constants/app.constants';
type Row = Record<string, unknown>;
const exec = (q: Parameters<typeof db.execute>[0]): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

@Injectable()
export class ProductionRepository {
  async listShiftReports(limit: number, offset: number): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT ps.*, COALESCE(e.first_name || ' ' || e.last_name, '') AS operator_name FROM production_sessions ps LEFT JOIN employees e ON e.id = ps.worker_id ORDER BY ps.started_at DESC LIMIT ${limit} OFFSET ${offset}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getShiftReport(id: number): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`SELECT ps.*, COALESCE(e.first_name || ' ' || e.last_name, '') AS operator_name FROM production_sessions ps LEFT JOIN employees e ON e.id = ps.worker_id WHERE ps.id = ${id}`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createShiftReport(body: Row): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`INSERT INTO production_sessions (worker_id, equipment_id, status, started_at, worker_notes) VALUES (${body.operatorId ?? null}, ${body.workCenterId ?? null}, 'running', NOW(), ${body.notes ?? null}) RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async updateShiftReport(id: number, body: Row): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`UPDATE production_sessions SET worker_notes = COALESCE(${body.notes ?? null}, worker_notes), status = COALESCE(${body.status ?? null}, status), updated_at = NOW() WHERE id = ${id} RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async closeShiftReport(id: number, body: Row): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`UPDATE production_sessions SET status = 'completed', ended_at = NOW(), actual_quantity = COALESCE(${body.outputQty ?? null}, actual_quantity), worker_notes = COALESCE(${body.notes ?? null}, worker_notes), updated_at = NOW() WHERE id = ${id} AND status != 'completed' RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async addShiftDowntime(id: number, body: Row): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`INSERT INTO downtime_events (session_id, duration_min, downtime_type, reason, start_time) VALUES (${id}, ${body.duration_min ?? body.durationMin ?? 0}, ${body.category ?? body.downtimeType ?? 'unplanned'}, ${body.reason ?? null}, NOW()) RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async weeklyReport(start: string, end: string): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT DATE_TRUNC('week', started_at) AS week_start, COUNT(*) AS total_shifts, SUM(actual_quantity) AS total_output, SUM(EXTRACT(EPOCH FROM (ended_at - started_at))/${SECONDS_PER_HOUR}) AS total_hours, COUNT(*) FILTER (WHERE status = 'completed') AS closed_shifts FROM production_sessions WHERE started_at BETWEEN ${start} AND ${end} GROUP BY week_start ORDER BY week_start`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getProductionStats(): Promise<Result<Row>>  {
  try {  
      const rows = await exec(sql`SELECT COUNT(*) FILTER (WHERE status = 'running') AS active_shifts, COUNT(*) FILTER (WHERE DATE(started_at) = CURRENT_DATE) AS today_shifts, COALESCE(SUM(actual_quantity) FILTER (WHERE DATE(started_at) = CURRENT_DATE), 0) AS today_output, COUNT(DISTINCT worker_id) FILTER (WHERE status = 'running') AS active_operators FROM production_sessions`);
      return rows.ok ? Ok(rows.data[0] ?? {}) : Err(rows.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getOrder360Card(id: number): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`SELECT po.*, wc.name AS work_center_name, u.full_name AS operator_name, bh.bom_number AS bom_code, rt.routing_number AS routing_name FROM production_orders po LEFT JOIN work_centers wc ON wc.id = po.work_center_id LEFT JOIN users u ON u.id = po.operator_id LEFT JOIN bom_headers bh ON bh.id = po.bom_header_id LEFT JOIN routings rt ON rt.id = po.routing_id WHERE po.id = ${id}`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }
}
