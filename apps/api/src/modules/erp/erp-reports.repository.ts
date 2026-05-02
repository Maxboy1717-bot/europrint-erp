import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { db , runQuery } from '@shared/db';

type Row = Record<string, unknown>;
const exec = (q: Parameters<typeof db.execute>[0]): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

@Injectable()
export class ErpReportsRepository {
  async listDailyReports(limit: number, offset: number): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT dr.*, wc.name AS work_center_name FROM erp_daily_reports dr LEFT JOIN work_centers wc ON wc.id = dr.work_center_id ORDER BY dr.report_date DESC LIMIT ${limit} OFFSET ${offset}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getDailyReport(id: number): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`SELECT dr.*, wc.name AS work_center_name FROM erp_daily_reports dr LEFT JOIN work_centers wc ON wc.id = dr.work_center_id WHERE dr.id = ${id}`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listProductionFacts(limit: number, offset: number): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT pf.*, mc.name AS product_name, wc.name AS work_center_name FROM erp_production_facts pf LEFT JOIN material_cards mc ON mc.id = pf.product_id LEFT JOIN work_centers wc ON wc.id = pf.work_center_id ORDER BY pf.fact_date DESC LIMIT ${limit} OFFSET ${offset}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listProductionPlans(limit: number, offset: number): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT pp.*, mc.name AS product_name FROM erp_production_plans pp LEFT JOIN material_cards mc ON mc.id = pp.product_id ORDER BY pp.plan_date DESC LIMIT ${limit} OFFSET ${offset}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async updateProductionPlan(id: number, body: Row): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`UPDATE erp_production_plans SET planned_qty = COALESCE(${body.plannedQty ?? null}, planned_qty), status = COALESCE(${body.status ?? null}, status), updated_at = NOW() WHERE id = ${id} RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listDowntimeLogs(limit: number, offset: number): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT dl.*, wc.name AS work_center_name, u.full_name AS reported_by_name FROM erp_downtime_logs dl LEFT JOIN work_centers wc ON wc.id = dl.work_center_id LEFT JOIN users u ON u.id = dl.reported_by ORDER BY dl.started_at DESC LIMIT ${limit} OFFSET ${offset}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getDowntimeLog(id: number): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`SELECT dl.*, wc.name AS work_center_name FROM erp_downtime_logs dl LEFT JOIN work_centers wc ON wc.id = dl.work_center_id WHERE dl.id = ${id}`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async updateDowntimeLog(id: number, body: Row): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`UPDATE erp_downtime_logs SET reason = COALESCE(${body.reason ?? null}, reason), duration_minutes = COALESCE(${body.durationMinutes ?? null}, duration_minutes), resolved = COALESCE(${body.resolved ?? null}, resolved), updated_at = NOW() WHERE id = ${id} RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getCapacity(): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT wc.id, wc.name, wc.hours_per_day AS capacity_per_hour, COUNT(ms.id) FILTER (WHERE ms.status = 'active') AS active_sessions, ROUND(100.0 * COUNT(ms.id) FILTER (WHERE ms.status = 'active') / NULLIF(wc.hours_per_day, 0), 2) AS utilization_pct FROM work_centers wc LEFT JOIN mes_sessions ms ON ms.work_center_id = wc.id GROUP BY wc.id, wc.name, wc.hours_per_day ORDER BY wc.name`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async capacityLoadAnalysis(): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT wc.id, wc.name, wc.hours_per_day AS capacity, COUNT(po.id) AS planned_orders, SUM(po.quantity) AS total_planned_qty FROM work_centers wc LEFT JOIN production_orders po ON po.work_center_id = wc.id AND po.status IN ('planned', 'in_progress') GROUP BY wc.id, wc.name, wc.hours_per_day ORDER BY planned_orders DESC`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listShiftCalendars(): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT * FROM erp_shift_calendars ORDER BY shift_date DESC LIMIT 100`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listEmployeeWorkCenters(limit: number): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT ewc.*, u.full_name, wc.name AS work_center_name FROM erp_employee_work_centers ewc LEFT JOIN users u ON u.id = ewc.employee_id LEFT JOIN work_centers wc ON wc.id = ewc.work_center_id ORDER BY u.full_name LIMIT ${limit}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getEmployeeWorkCenter(id: number): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`SELECT ewc.*, u.full_name, wc.name AS work_center_name FROM erp_employee_work_centers ewc LEFT JOIN users u ON u.id = ewc.employee_id LEFT JOIN work_centers wc ON wc.id = ewc.work_center_id WHERE ewc.id = ${id}`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async workCenterCapacity(): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT wc.id, wc.name, wc.hours_per_day AS capacity_per_hour, COUNT(DISTINCT ewc.employee_id) AS assigned_employees FROM work_centers wc LEFT JOIN erp_employee_work_centers ewc ON ewc.work_center_id = wc.id GROUP BY wc.id, wc.name, wc.hours_per_day ORDER BY wc.name`);  } catch (_e) {
    return Err(String(_e));
  }

  }
}
