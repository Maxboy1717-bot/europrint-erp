/**
 * @module production.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { db , runQuery } from '@shared/db';

import { SECONDS_PER_HOUR } from '@common/constants/app.constants';
type Row = Record<string, unknown>;
const exec = (q: SQL | SQLWrapper): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

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
      const r = await exec(sql`INSERT INTO downtime_events (session_id, duration_min, event_type, reason_description, started_at) VALUES (${id}, ${body.duration_min ?? body.durationMin ?? 0}, ${body.category ?? body.downtimeType ?? 'unplanned'}, ${body.reason ?? null}, NOW()) RETURNING *`);
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
      // 1. Main production order row + responsible user names
      const poRes = await exec(sql`
        SELECT
          po.id,
          po.order_number,
          po.status,
          po.production_type,
          po.product_name,
          po.notes,
          po.priority,
          po.planned_quantity,
          po.confirmed_quantity,
          po.scrap_quantity,
          po.planned_cost,
          po.actual_cost,
          po.planned_start_date,
          po.planned_end_date,
          po.actual_start_date,
          po.actual_end_date,
          TRIM(COALESCE(rm.first_name,'') || ' ' || COALESCE(rm.last_name,'')) AS responsible_manager_name,
          TRIM(COALESCE(ss.first_name,'') || ' ' || COALESCE(ss.last_name,'')) AS shift_supervisor_name,
          TRIM(COALESCE(qi.first_name,'') || ' ' || COALESCE(qi.last_name,'')) AS qc_inspector_name
        FROM production_orders po
        LEFT JOIN users rm ON rm.id = po.responsible_manager_id
        LEFT JOIN users ss ON ss.id = po.shift_supervisor_id
        LEFT JOIN users qi ON qi.id = po.qc_inspector_id
        WHERE po.id = ${id} AND po.deleted_at IS NULL
      `);
      if (!poRes.ok) return Err(poRes.error);
      const po = poRes.data[0];
      if (!po) return Ok(null);

      // 2. Production sessions (shifts)
      const sessRes = await exec(sql`
        SELECT
          id,
          session_number,
          status,
          oee,
          target_quantity,
          actual_quantity,
          defect_quantity,
          availability,
          performance,
          quality,
          started_at,
          ended_at,
          running_time_seconds,
          stopped_time_seconds
        FROM production_sessions
        WHERE production_order_id = ${id}
          AND deleted_at IS NULL
        ORDER BY started_at DESC
      `);
      if (!sessRes.ok) return Err(sessRes.error);
      const sessions = sessRes.data;

      // 3. Downtime events for all sessions of this order
      const dtRes = await exec(sql`
        SELECT
          de.reason_description,
          de.reason_code,
          de.event_type,
          de.duration_seconds,
          de.duration_min,
          de.started_at,
          de.is_planned
        FROM downtime_events de
        WHERE de.session_id IN (
          SELECT id FROM production_sessions
          WHERE production_order_id = ${id}
        )
        ORDER BY de.started_at DESC
      `);
      if (!dtRes.ok) return Err(dtRes.error);
      const downtimes = dtRes.data;

      // 4. QC inspections
      const qcRes = await exec(sql`
        SELECT
          pass_count,
          fail_count,
          total_count,
          status,
          result,
          inspected_at,
          notes
        FROM qc_inspections
        WHERE order_id = ${id}
        ORDER BY inspected_at DESC
      `);
      if (!qcRes.ok) return Err(qcRes.error);
      const qcChecks = qcRes.data;

      // 5a. Material allocations for cost breakdown
      // production_material_allocs.production_order_id is varchar → cast id::text
      const allocRes = await exec(sql`
        SELECT
          pma.material_id,
          mc.xom_ashyo        AS material_name,
          mc.unit_of_measure  AS unit,
          pma.allocated_qty   AS issued_quantity,
          pma.unit_cost,
          pma.total_financial_value AS total_actual_cost
        FROM production_material_allocs pma
        LEFT JOIN material_cards mc ON mc.id = pma.material_id
        WHERE pma.production_order_id = ${id}::text
      `);
      if (!allocRes.ok) return Err(allocRes.error);
      const allocRows = allocRes.data;

      const materialCost = allocRows.reduce(
        (sum, r) => sum + (Number(r.total_actual_cost) || 0),
        0,
      );
      const components = allocRows.map(r => ({
        materialId:      r.material_id,
        materialName:    r.material_name ?? '',
        unit:            r.unit ?? '',
        issuedQuantity:  Number(r.issued_quantity) || 0,
        unitCost:        Number(r.unit_cost) || 0,
        totalActualCost: Number(r.total_actual_cost) || 0,
      }));

      // 5. Compute derived metrics in JS
      const plannedQty = Number(po.planned_quantity) || 0;
      const confirmedQty = Number(po.confirmed_quantity) || 0;
      const plannedCost = Number(po.planned_cost) || 0;
      const actualCost = Number(po.actual_cost) || 0;

      const avgOee = sessions.length > 0
        ? sessions.reduce((sum, s) => sum + (Number(s.oee) || 0), 0) / sessions.length
        : 0;

      const qcTotalChecked = qcChecks.reduce((s, q) => s + (Number(q.total_count) || 0), 0);
      const qcTotalPassed = qcChecks.reduce((s, q) => s + (Number(q.pass_count) || 0), 0);
      const qcPassRate = qcTotalChecked > 0 ? Math.round((qcTotalPassed / qcTotalChecked) * 100) : 0;

      const totalDowntimeMins = downtimes.reduce((s, d) => {
        const mins = d.duration_min != null
          ? Number(d.duration_min)
          : (d.duration_seconds != null ? Math.round(Number(d.duration_seconds) / 60) : 0);
        return s + mins;
      }, 0);

      const costVariance = actualCost - plannedCost;
      const costVariancePct = plannedCost !== 0
        ? Math.round((costVariance / plannedCost) * 100 * 100) / 100
        : 0;

      const totalRunningHours = sessions.reduce((s, ses) =>
        s + (Number(ses.running_time_seconds) || 0), 0) / SECONDS_PER_HOUR;
      const totalStoppedHours = sessions.reduce((s, ses) =>
        s + (Number(ses.stopped_time_seconds) || 0), 0) / SECONDS_PER_HOUR;

      const card: Row = {
        overview: {
          status: po.status,
          orderNumber: po.order_number,
          productionType: po.production_type,
          productName: po.product_name,
          notes: po.notes,
          priority: po.priority,
          responsibleManagerName: po.responsible_manager_name ?? '',
          shiftSupervisorName: po.shift_supervisor_name ?? '',
          qcInspectorName: po.qc_inspector_name ?? '',
          plannedStartDate: po.planned_start_date,
          plannedEndDate: po.planned_end_date,
          actualStartDate: po.actual_start_date,
          actualEndDate: po.actual_end_date,
        },
        kpi: {
          completionRate: plannedQty > 0 ? Math.round((confirmedQty / plannedQty) * 100) : 0,
          produced: confirmedQty,
          planned: plannedQty,
          avgOee: Math.round(avgOee * 100) / 100,
          qcPassRate,
          costVariance,
          costVariancePct,
          totalDowntimeMins,
        },
        shifts: {
          sessions: sessions.map(s => ({
            id: s.id,
            sessionNumber: s.session_number,
            status: s.status,
            oee: s.oee,
            targetQuantity: s.target_quantity,
            actualQuantity: s.actual_quantity,
            defectQuantity: s.defect_quantity,
            availability: s.availability,
            performance: s.performance,
            quality: s.quality,
            startedAt: s.started_at,
            endedAt: s.ended_at,
          })),
          downtimes: downtimes.map(d => ({
            reasonDescription: d.reason_description,
            reasonCode: d.reason_code,
            eventType: d.event_type,
            durationMins: d.duration_min != null
              ? Number(d.duration_min)
              : (d.duration_seconds != null ? Math.round(Number(d.duration_seconds) / 60) : 0),
            startedAt: d.started_at,
            isPlanned: d.is_planned,
          })),
          totalRunningHours: Math.round(totalRunningHours * 100) / 100,
          totalStoppedHours: Math.round(totalStoppedHours * 100) / 100,
        },
        quality: {
          totalChecked: qcTotalChecked,
          totalFailed: qcChecks.reduce((s, q) => s + (Number(q.fail_count) || 0), 0),
          checks: qcChecks.map(q => ({
            status: q.status,
            result: q.result,
            passCount: q.pass_count,
            failCount: q.fail_count,
            totalCount: q.total_count,
            inspectedAt: q.inspected_at,
            notes: q.notes,
          })),
        },
        costAnalysis: {
          plannedCost,
          actualCost,
          variance: costVariance,
          variancePct: costVariancePct,
          materialCost,
          components,
        },
      };

      return Ok(card);
  } catch (_e) {
    return Err(String(_e));
  }

  }
}
