/**
 * @module erp-reports.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { db , runQuery } from '@shared/db';
import {
  CAPACITY_BOTTLENECK_THRESHOLD_PCT,
  CAPACITY_OVERLOAD_THRESHOLD_PCT,
} from '@common/constants/business.constants';

type Row = Record<string, unknown>;
const exec = (q: SQL | SQLWrapper): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);
// APPROVED: egasi ikki-dunyo-tuzatish 2026-07-02 — production plan CRUD ni PP MPS
// jadvaliga (production_plan_header) bog'lash uchun helper: bo'sh string/undefined
// ID larni NULL ga aylantiradi (Postgres integer ustuniga "" yuborilsa xato beradi).
const toIntOrNull = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

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

  // APPROVED: egasi ikki-dunyo-tuzatish 2026-07-02 — legacy `erp_production_plans`
  // (order_id/product_id/planned_qty, `status` ustuni umuman yo'q — INSERT/UPDATE
  // crash bergan) o'rniga PP MPS kanonik jadvali `production_plan_header` ga
  // bog'landi. FE (PlanningBoard.tsx) allaqachon shu shakl bilan ishlaydi:
  // planNumber/planDate/planType/workCenterId/shift/status/notes
  // (InsertProductionPlanHeader, @shared/schema → lib/db pp-production.ts).
  async listProductionPlans(limit: number, offset: number): Promise<Result<Row[]>>  {
  try {
      return exec(sql`
        SELECT pp.id, pp.plan_number AS "planNumber", pp.plan_date AS "planDate", pp.plan_type AS "planType",
          pp.work_center_id AS "workCenterId", wc.name AS "workCenterName", pp.shift, pp.status, pp.notes,
          pp.approved_by AS "approvedBy", pp.approved_at AS "approvedAt",
          pp.created_at AS "createdAt", pp.updated_at AS "updatedAt"
        FROM production_plan_header pp
        LEFT JOIN work_centers wc ON wc.id = pp.work_center_id
        ORDER BY pp.plan_date DESC LIMIT ${limit} OFFSET ${offset}
      `);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async updateProductionPlan(id: number, body: Row): Promise<Result<Row | null>>  {
  try {
      const r = await exec(sql`
        UPDATE production_plan_header SET
          plan_number = COALESCE(${(body.planNumber as string) || null}, plan_number),
          plan_date = COALESCE(${(body.planDate as string) || null}, plan_date),
          plan_type = COALESCE(${(body.planType as string) || null}, plan_type),
          work_center_id = COALESCE(${toIntOrNull(body.workCenterId)}, work_center_id),
          shift = COALESCE(${(body.shift as string) || null}, shift),
          status = COALESCE(${(body.status as string) || null}, status),
          notes = COALESCE(${(body.notes as string) || null}, notes),
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, plan_number AS "planNumber", plan_date AS "planDate", plan_type AS "planType",
          work_center_id AS "workCenterId", shift, status, notes,
          approved_by AS "approvedBy", approved_at AS "approvedAt",
          created_at AS "createdAt", updated_at AS "updatedAt"
      `);
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
      const r = await exec(sql`UPDATE erp_downtime_logs SET reason = COALESCE(${body.reason ?? null}, reason), duration_min = COALESCE(${body.durationMinutes ?? null}, duration_min), resolved = COALESCE(${body.resolved ?? null}, resolved), updated_at = NOW() WHERE id = ${id} RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getCapacity(): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT wc.id, wc.name, wc.hours_per_day AS capacity_per_hour, COUNT(ms.id) FILTER (WHERE ms.status = 'active') AS active_sessions, ROUND(100.0 * COUNT(ms.id) FILTER (WHERE ms.status = 'active') / NULLIF(wc.hours_per_day, 0), 2) AS utilization_pct FROM work_centers wc LEFT JOIN mes_sessions ms ON ms.work_center_id::text = wc.id::text GROUP BY wc.id, wc.name, wc.hours_per_day ORDER BY wc.name`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  // FE (CapacityPlanning.tsx) reads this as `LoadAnalysis = { workCenters: WorkCenterLoad[] }`
  // with camelCase fields — the response envelope AND field names must match exactly
  // (this endpoint used to return a bare array of snake_case rows that the FE never
  // actually consumed: `loadAnalysis?.workCenters` was always undefined).
  // availableHours comes from real `work_center_capacity` entries created via
  // POST /erp/work-center-capacity (falls back to work_centers.hours_per_day when no
  // capacity entry exists yet for the range); loadedHours sums planned_quantity from
  // production_orders overlapping [startDate, endDate].
  async capacityLoadAnalysis(startDate?: string, endDate?: string): Promise<Result<Row>>  {
  try {
      const from = startDate || new Date().toISOString().slice(0, 10);
      const to = endDate || from;
      const r = await exec(sql`
        SELECT
          wc.id AS wc_id,
          wc.code AS wc_code,
          wc.name AS wc_name,
          COALESCE(cap.available_hours, wc.hours_per_day, 0) AS available_hours,
          COALESCE(load_agg.loaded_qty, 0) AS loaded_hours
        FROM work_centers wc
        LEFT JOIN LATERAL (
          SELECT SUM(wcc.available_capacity_hours) AS available_hours
          FROM work_center_capacity wcc
          WHERE wcc.work_center_id = wc.id
            AND wcc.deleted_at IS NULL
            AND wcc.valid_from <= ${to}
            AND (wcc.valid_to IS NULL OR wcc.valid_to >= ${from})
        ) cap ON true
        LEFT JOIN LATERAL (
          SELECT SUM(po.planned_quantity) AS loaded_qty
          FROM production_orders po
          WHERE po.work_center_id = wc.id
            AND po.status IN ('planned', 'in_progress')
            AND (po.planned_start_date IS NULL OR po.planned_start_date <= ${to})
            AND (po.planned_end_date IS NULL OR po.planned_end_date >= ${from})
        ) load_agg ON true
        WHERE wc.deleted_at IS NULL AND wc.is_active = true
        ORDER BY wc.name
      `);
      if (!r.ok) return Err(r.error);
      const workCenters = r.data.map((row) => {
        const availableHours = Number(row.available_hours ?? 0);
        const loadedHours = Number(row.loaded_hours ?? 0);
        const loadPercentage = availableHours > 0
          ? Math.round((loadedHours / availableHours) * 1000) / 10
          : 0;
        const isBottleneck = loadPercentage >= CAPACITY_BOTTLENECK_THRESHOLD_PCT;
        const status = loadPercentage >= CAPACITY_OVERLOAD_THRESHOLD_PCT
          ? 'overloaded'
          : (isBottleneck ? 'high' : 'normal');
        return {
          workCenterName: row.wc_name,
          workCenterCode: row.wc_code,
          availableHours,
          loadedHours,
          loadPercentage,
          isBottleneck,
          status,
        };
      });
      return Ok({ workCenters });
  } catch (_e) {
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

  // FE (CapacityPlanningTabs.tsx `CapacityDataTab`) reads each row as
  // `CapacityListItem = { capacity: Capacity, workCenter: WorkCenter }` and renders
  // `item.capacity.id` / `item.capacity.date` directly — this used to return flat
  // work_centers rows (no `capacity` key at all), which crashed the tab with
  // "Cannot read properties of undefined (reading 'id')". Now reads the real
  // `work_center_capacity` table (per-date capacity entries) created via
  // POST /erp/work-center-capacity.
  async workCenterCapacity(): Promise<Result<Row[]>>  {
  try {
      const r = await exec(sql`
        SELECT
          wcc.id AS capacity_id,
          wcc.work_center_id AS work_center_id,
          wcc.valid_from AS valid_from,
          wcc.available_capacity_hours AS available_hours,
          wcc.total_capacity_hours AS total_hours,
          wcc.utilization_percentage AS utilization_target,
          wc.id AS wc_id,
          wc.code AS wc_code,
          wc.name AS wc_name
        FROM work_center_capacity wcc
        JOIN work_centers wc ON wc.id = wcc.work_center_id
        WHERE wcc.deleted_at IS NULL
        ORDER BY wcc.valid_from DESC, wcc.id DESC
        LIMIT 200
      `);
      if (!r.ok) return Err(r.error);
      const items = r.data.map((row) => {
        const totalHours = row.total_hours !== null && row.total_hours !== undefined ? Number(row.total_hours) : null;
        const availableHours = Number(row.available_hours ?? totalHours ?? 0);
        const efficiency = totalHours && totalHours > 0
          ? Math.round((availableHours / totalHours) * 1000) / 10
          : 100;
        return {
          capacity: {
            id: String(row.capacity_id),
            workCenterId: String(row.work_center_id),
            date: row.valid_from,
            availableHours,
            efficiency,
            utilizationTarget: Number(row.utilization_target ?? 0),
          },
          workCenter: {
            id: String(row.wc_id),
            code: row.wc_code,
            name: row.wc_name,
          },
        };
      });
      return Ok(items);
  } catch (_e) {
    return Err(String(_e));
  }

  }

  // Real INSERT into `work_center_capacity` — the FE "Quvvat qo'shildi" create dialog
  // (CapacityPlanning.tsx createCapacityMutation) posts { workCenterId, date,
  // availableHours, efficiency, utilizationTarget } with no `id`. This used to be
  // swallowed by createWorkCenterCapacity()'s "no id" branch, which just returned the
  // current list unchanged — a fake success (toast fired, nothing was ever written).
  async createWorkCenterCapacityEntry(body: Row): Promise<Result<Row | null>> {
    try {
      const workCenterId = toIntOrNull(body['workCenterId']);
      const date = (body['date'] as string) || new Date().toISOString().slice(0, 10);
      const availableHours = body['availableHours'] !== undefined ? Number(body['availableHours']) : 8;
      const efficiency = body['efficiency'] !== undefined ? Number(body['efficiency']) : 100;
      const utilizationTarget = body['utilizationTarget'] !== undefined ? Number(body['utilizationTarget']) : 85;
      const totalCapacityHours = availableHours;
      const availableCapacityHours = availableHours * (efficiency / 100);
      const r = await exec(sql`
        INSERT INTO work_center_capacity (
          work_center_id, valid_from, valid_to, number_of_machines,
          utilization_percentage, shifts_per_day, hours_per_shift,
          working_days_per_week, total_capacity_hours, available_capacity_hours
        ) VALUES (
          ${workCenterId}, ${date}, ${date}, 1,
          ${utilizationTarget}, 1, ${availableHours},
          5, ${totalCapacityHours}, ${availableCapacityHours}
        )
        RETURNING
          id AS capacity_id, work_center_id, valid_from,
          available_capacity_hours AS available_hours,
          total_capacity_hours AS total_hours,
          utilization_percentage AS utilization_target
      `);
      if (!r.ok) return Err(r.error);
      const row = r.data[0];
      if (!row) return Ok(null);
      return Ok({
        capacity: {
          id: String(row.capacity_id),
          workCenterId: String(row.work_center_id),
          date: row.valid_from,
          availableHours: Number(row.available_hours ?? 0),
          efficiency,
          utilizationTarget: Number(row.utilization_target ?? 0),
        },
      });
    } catch (_e) { return Err(String(_e)); }
  }

  async updateWorkCenterCapacity(id: number, patches: Row): Promise<Result<Row | null>> {
    try {
      const capacityPerHour = patches['capacity_per_hour'] !== undefined ? Number(patches['capacity_per_hour']) : null;
      const hoursPerDay     = patches['hours_per_day']     !== undefined ? Number(patches['hours_per_day'])     : null;
      const efficiencyRate  = patches['efficiency_rate']   !== undefined ? Number(patches['efficiency_rate'])   : null;
      const capacity        = patches['capacity']          !== undefined ? Number(patches['capacity'])          : null;
      const r = await exec(sql`
        UPDATE work_centers SET
          capacity_per_hour = COALESCE(${capacityPerHour}, capacity_per_hour),
          hours_per_day     = COALESCE(${hoursPerDay},     hours_per_day),
          efficiency_rate   = COALESCE(${efficiencyRate},  efficiency_rate),
          capacity          = COALESCE(${capacity},        capacity),
          updated_at        = NOW()
        WHERE id = ${id}
        RETURNING id, name, capacity_per_hour, hours_per_day, efficiency_rate, capacity, updated_at
      `);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
    } catch (_e) { return Err(String(_e)); }
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
    const planNumber = (body.planNumber as string) || `PP-${Date.now()}`;
    const r = await exec(sql`
      INSERT INTO production_plan_header (plan_number, plan_date, plan_type, work_center_id, shift, status, notes)
      VALUES (
        ${planNumber},
        ${(body.planDate as string) || (body.date as string) || new Date().toISOString().slice(0,10)},
        ${(body.planType as string) || 'daily'},
        ${toIntOrNull(body.workCenterId)},
        ${(body.shift as string) || null},
        ${(body.status as string) || 'draft'},
        ${(body.notes as string) || null}
      )
      RETURNING id, plan_number AS "planNumber", plan_date AS "planDate", plan_type AS "planType",
        work_center_id AS "workCenterId", shift, status, notes,
        approved_by AS "approvedBy", approved_at AS "approvedAt",
        created_at AS "createdAt", updated_at AS "updatedAt"
    `);
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
    const r = await exec(sql`INSERT INTO erp_downtime_logs (machine_id, started_at, reason, duration_min, resolved, reported_by) VALUES (${body.workCenterId ?? body.machineId ?? null}, ${body.startedAt ?? body.date ?? new Date().toISOString()}, ${body.reason ?? 'Noma\'lum sabab'}, ${body.durationMinutes ?? 0}, ${body.resolved ?? false}, ${body.reportedBy ?? null}) RETURNING *`);
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
