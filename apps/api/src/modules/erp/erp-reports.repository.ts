/**
 * @module erp-reports.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { db , runQuery } from '@shared/db';

type Row = Record<string, unknown>;
const exec = (q: SQL | SQLWrapper): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

@Injectable()
export class ErpReportsRepository {
  async listDailyReports(limit: number, offset: number): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT dr.* FROM erp_daily_reports dr ORDER BY dr.report_date DESC LIMIT ${limit} OFFSET ${offset}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getDailyReport(id: number): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`SELECT dr.* FROM erp_daily_reports dr WHERE dr.id = ${id}`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listProductionFacts(limit: number, offset: number): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT pf.*, mc.xom_ashyo AS product_name, wc.name AS work_center_name FROM erp_production_facts pf LEFT JOIN material_cards mc ON mc.id = pf.product_id LEFT JOIN work_centers wc ON wc.id = pf.work_center_id ORDER BY pf.fact_date DESC LIMIT ${limit} OFFSET ${offset}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listProductionPlans(limit: number, offset: number): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT pp.*, mc.xom_ashyo AS product_name FROM erp_production_plans pp LEFT JOIN material_cards mc ON mc.id = pp.product_id ORDER BY pp.plan_date DESC LIMIT ${limit} OFFSET ${offset}`);  } catch (_e) {
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
      return exec(sql`SELECT dl.* FROM erp_downtime_logs dl ORDER BY dl.started_at DESC LIMIT ${limit} OFFSET ${offset}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getDowntimeLog(id: number): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`SELECT dl.* FROM erp_downtime_logs dl WHERE dl.id = ${id}`);
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
      return exec(sql`SELECT ewc.*, (u.first_name || ' ' || u.last_name) AS full_name, wc.name AS work_center_name FROM erp_employee_work_centers ewc LEFT JOIN users u ON u.id = ewc.employee_id LEFT JOIN work_centers wc ON wc.id = ewc.work_center_id ORDER BY full_name LIMIT ${limit}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getEmployeeWorkCenter(id: number): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`SELECT ewc.*, (u.first_name || ' ' || u.last_name) AS full_name, wc.name AS work_center_name FROM erp_employee_work_centers ewc LEFT JOIN users u ON u.id = ewc.employee_id LEFT JOIN work_centers wc ON wc.id = ewc.work_center_id WHERE ewc.id = ${id}`);
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

  async createDailyReport(body: Row): Promise<Result<Row | null>> {
  try {
    const r = await exec(sql`INSERT INTO erp_daily_reports (work_center_id, report_date, shift, planned_qty, actual_qty, notes) VALUES (${body.workCenterId ?? null}, ${body.reportDate ?? body.date ?? new Date().toISOString().slice(0,10)}, ${body.shift ?? null}, ${body.plannedQty ?? 0}, ${body.actualQty ?? 0}, ${body.notes ?? null}) RETURNING *`);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  } catch (_e) { return Err(String(_e)); }
  }

  async updateDailyReport(id: number, body: Row): Promise<Result<Row | null>> {
  try {
    const r = await exec(sql`UPDATE erp_daily_reports SET planned_qty = COALESCE(${body.plannedQty ?? null}, planned_qty), actual_qty = COALESCE(${body.actualQty ?? null}, actual_qty), notes = COALESCE(${body.notes ?? null}, notes), updated_at = NOW() WHERE id = ${id} RETURNING *`);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  } catch (_e) { return Err(String(_e)); }
  }

  async deleteDailyReport(id: number): Promise<Result<Row | null>> {
  try {
    const r = await exec(sql`DELETE FROM erp_daily_reports WHERE id = ${id} RETURNING *`);
    return r.ok ? Ok(r.data[0] ?? { id, deleted: true }) : Err(r.error);
  } catch (_e) { return Err(String(_e)); }
  }

  async createProductionPlan(body: Row): Promise<Result<Row | null>> {
  try {
    const r = await exec(sql`INSERT INTO erp_production_plans (product_id, plan_date, planned_qty, status) VALUES (${body.productId ?? null}, ${body.planDate ?? body.date ?? new Date().toISOString().slice(0,10)}, ${body.plannedQty ?? 0}, ${body.status ?? 'draft'}) RETURNING *`);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  } catch (_e) { return Err(String(_e)); }
  }

  async createProductionFact(body: Row): Promise<Result<Row | null>> {
  try {
    const r = await exec(sql`INSERT INTO erp_production_facts (product_id, work_center_id, fact_date, fact_qty, good_qty, defect_qty, notes) VALUES (${body.productId ?? null}, ${body.workCenterId ?? null}, ${body.factDate ?? body.date ?? new Date().toISOString().slice(0,10)}, ${body.factQty ?? body.quantity ?? 0}, ${body.goodQty ?? body.quantity ?? 0}, ${body.defectQty ?? 0}, ${body.notes ?? null}) RETURNING *`);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  } catch (_e) { return Err(String(_e)); }
  }

  async createDowntimeLog(body: Row): Promise<Result<Row | null>> {
  try {
    const r = await exec(sql`INSERT INTO erp_downtime_logs (work_center_id, started_at, reason, duration_minutes, resolved, reported_by) VALUES (${body.workCenterId ?? null}, ${body.startedAt ?? body.date ?? new Date().toISOString()}, ${body.reason ?? 'Noma\'lum sabab'}, ${body.durationMinutes ?? 0}, ${body.resolved ?? false}, ${body.reportedBy ?? null}) RETURNING *`);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  } catch (_e) { return Err(String(_e)); }
  }

  async deleteDowntimeLog(id: number): Promise<Result<Row | null>> {
  try {
    const r = await exec(sql`DELETE FROM erp_downtime_logs WHERE id = ${id} RETURNING *`);
    return r.ok ? Ok(r.data[0] ?? { id, deleted: true }) : Err(r.error);
  } catch (_e) { return Err(String(_e)); }
  }

  async createShiftCalendar(body: Row): Promise<Result<Row | null>> {
  try {
    const r = await exec(sql`INSERT INTO erp_shift_calendars (shift_date, shift_name, is_working) VALUES (${body.shiftDate ?? body.date ?? new Date().toISOString().slice(0,10)}, ${body.shiftName ?? body.name ?? '1-shift'}, ${body.isWorking ?? true}) RETURNING *`);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  } catch (_e) { return Err(String(_e)); }
  }

  async createEmployeeWorkCenter(body: Row): Promise<Result<Row | null>> {
  try {
    const r = await exec(sql`INSERT INTO erp_employee_work_centers (employee_id, work_center_id) VALUES (${body.employeeId ?? null}, ${body.workCenterId ?? null}) RETURNING *`);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  } catch (_e) { return Err(String(_e)); }
  }

  async updateEmployeeWorkCenter(id: number, body: Row): Promise<Result<Row | null>> {
  try {
    const r = await exec(sql`UPDATE erp_employee_work_centers SET work_center_id = COALESCE(${body.workCenterId ?? null}, work_center_id), employee_id = COALESCE(${body.employeeId ?? null}, employee_id) WHERE id = ${id} RETURNING *`);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  } catch (_e) { return Err(String(_e)); }
  }

  async deleteEmployeeWorkCenter(id: number): Promise<Result<Row | null>> {
  try {
    const r = await exec(sql`DELETE FROM erp_employee_work_centers WHERE id = ${id} RETURNING *`);
    return r.ok ? Ok(r.data[0] ?? { id, deleted: true }) : Err(r.error);
  } catch (_e) { return Err(String(_e)); }
  }
}
