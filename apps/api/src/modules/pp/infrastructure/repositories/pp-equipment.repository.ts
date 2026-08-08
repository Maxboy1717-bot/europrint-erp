/**
 * @module pp-equipment.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (PP)
 */

import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import type { IPpEquipmentRepo, Equipment360 } from '../../domain/repositories/i-pp-equipment.repo';

type Row = Record<string, unknown>;
const exec = (q: SQL | SQLWrapper): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);
const rowsOf = (r: Result<Row[]>): Row[] => (r.ok && Array.isArray(r.data) ? r.data : []);

@Injectable()
export class PpEquipmentRepository implements IPpEquipmentRepo {
  async listEquipment(status: string | null, limit: number): Promise<Result<Row[]>>  {
  try {
      // Soft-delete: equipment has deleted_at — exclude logically-deleted machines from the list.
      return status
        ? exec(sql`SELECT e.*, wc.name AS work_center_name FROM equipment e LEFT JOIN work_centers wc ON wc.id = e.work_center_id WHERE e.status = ${status} AND e.deleted_at IS NULL ORDER BY e.name LIMIT ${limit}`)
        : exec(sql`SELECT e.*, wc.name AS work_center_name FROM equipment e LEFT JOIN work_centers wc ON wc.id = e.work_center_id WHERE e.deleted_at IS NULL ORDER BY e.name LIMIT ${limit}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listWorkCenters(limit: number): Promise<Result<Row[]>>  {
  try {
      return exec(sql`SELECT wc.id, wc.code AS equipment_code, wc.name, wc.hours_per_day AS capacity_per_hour, 'active' AS status FROM work_centers wc WHERE wc.deleted_at IS NULL ORDER BY wc.name LIMIT ${limit}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async findById(id: number): Promise<Result<Row | null>>  {
  try {
      const r = await exec(sql`SELECT e.*, wc.name AS work_center_name FROM equipment e LEFT JOIN work_centers wc ON wc.id = e.work_center_id WHERE e.id = ${id} AND e.deleted_at IS NULL`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  /**
   * Equipment 360 — aggregates every live signal for one machine. Each block is
   * a real SELECT against the canonical manufacturing tables; blocks with no
   * matching rows return [] / null (honest-empty), never a fabricated value.
   *
   *   - equipment           equipment row + work-center name (REAL)
   *   - currentStatus        latest machine_status_logs row for the work-center,
   *                          falling back to the active production session status (REAL)
   *   - oee + a/p/q          averaged from production_sessions for this equipment (REAL)
   *   - productionSessions   per-equipment sessions + operator name from employees (REAL)
   *   - downtimeEvents        downtime_events joined to this equipment's sessions (REAL;
   *                          honest-empty when no session has a downtime row)
   *   - statusHistory         machine_status_logs stop/run history via work-center (REAL)
   *   - maintenance           equipment_maintenance / maintenance_orders (REAL; honest-empty)
   *   - assignedOperator      operator on the most-recent session, named from employees (REAL)
   *   - utilization           running vs total session time derived from sessions (REAL)
   *   - telemetry             ALWAYS [] — IoT sensors not installed (owner directive);
   *                          mes_telemetry demo rows are deliberately NOT surfaced.
   */
  async getEquipment360(id: number): Promise<Result<Equipment360 | null>> {
    return safeCall(async () => {
      const eqRes = await exec(sql`
        SELECT e.*, wc.name AS work_center_name, wc.code AS work_center_code
        FROM equipment e
        LEFT JOIN work_centers wc ON wc.id = e.work_center_id
        WHERE e.id = ${id} AND e.deleted_at IS NULL`);
      const equipment = rowsOf(eqRes)[0] ?? null;
      if (!equipment) return null;

      const workCenterId = typeof equipment['work_center_id'] === 'number'
        ? (equipment['work_center_id'] as number)
        : null;

      // Production sessions for this equipment + operator name (worker_id → employees).
      const sessionsRes = await exec(sql`
        SELECT ps.id, ps.session_number, ps.status, ps.production_order_id,
               ps.worker_id, ps.operator_id, ps.machine_id,
               emp.full_name AS operator_name,
               ps.target_quantity, ps.actual_quantity, ps.defect_quantity,
               ps.availability, ps.performance, ps.quality, ps.oee,
               ps.running_time_seconds, ps.stopped_time_seconds,
               ps.started_at, ps.ended_at
        FROM production_sessions ps
        LEFT JOIN employees emp ON emp.id = COALESCE(ps.operator_id, ps.worker_id)
        WHERE ps.equipment_id = ${id} AND ps.deleted_at IS NULL
        ORDER BY ps.started_at DESC NULLS LAST
        LIMIT 100`);
      const productionSessions = rowsOf(sessionsRes);

      // OEE — averaged from real per-session factors recorded for this equipment.
      const oeeRes = await exec(sql`
        SELECT
          COUNT(*) FILTER (WHERE oee IS NOT NULL)       AS scored_sessions,
          ROUND(AVG(oee)          FILTER (WHERE oee IS NOT NULL), 1)          AS oee,
          ROUND(AVG(availability) FILTER (WHERE availability IS NOT NULL), 1) AS availability,
          ROUND(AVG(performance)  FILTER (WHERE performance IS NOT NULL), 1)  AS performance,
          ROUND(AVG(quality)      FILTER (WHERE quality IS NOT NULL), 1)      AS quality
        FROM production_sessions
        WHERE equipment_id = ${id} AND deleted_at IS NULL`);
      const oeeRow = rowsOf(oeeRes)[0] ?? null;
      const oee = oeeRow && Number(oeeRow['scored_sessions']) > 0 ? oeeRow : null;

      // Downtime events tied to this equipment via its production sessions.
      const downtimeRes = await exec(sql`
        SELECT d.id, d.session_id, d.event_type, d.reason_code, d.reason_description,
               d.duration_seconds, d.duration_minutes, d.is_planned,
               d.started_at, d.ended_at, r.name AS reason_name, r.category AS reason_category
        FROM downtime_events d
        JOIN production_sessions ps ON ps.id = d.session_id AND ps.equipment_id = ${id}
        LEFT JOIN mes_downtime_reasons r ON r.code = d.reason_code
        ORDER BY d.started_at DESC
        LIMIT 100`);
      const downtimeEvents = rowsOf(downtimeRes);

      // Machine status history + current status via the equipment's work-center.
      let statusHistory: Row[] = [];
      let currentStatus: Row | null = null;
      if (workCenterId !== null) {
        const statusRes = await exec(sql`
          SELECT m.id, m.work_center_id, m.status, m.previous_status,
                 m.stop_reason, m.stop_reason_detail, m.duration_minutes,
                 m.ai_detected, m.status_started_at, m.status_ended_at,
                 r.name AS stop_reason_name, r.category AS stop_reason_category
          FROM machine_status_logs m
          LEFT JOIN mes_downtime_reasons r ON r.code = m.stop_reason
          WHERE m.work_center_id = ${workCenterId}
          ORDER BY m.status_started_at DESC
          LIMIT 50`);
        statusHistory = rowsOf(statusRes);
        currentStatus = statusHistory[0] ?? null;
      }
      // Fallback: derive a live status from the most-recent in-progress session.
      if (!currentStatus) {
        const activeSession = productionSessions.find(
          (s) => s['status'] === 'running' || s['status'] === 'in_progress' || s['status'] === 'paused',
        );
        if (activeSession) {
          currentStatus = { status: activeSession['status'], source: 'production_session', session_id: activeSession['id'] };
        }
      }

      // Maintenance — real SELECT against equipment_maintenance. This table has
      // no equipment_id FK; it links by equipment_code (= equipment.equipment_number)
      // or by work_center_id. 0 rows today (honest-empty) until the owner records
      // maintenance schedules/logs.
      const equipmentNumber = typeof equipment['equipment_number'] === 'string'
        ? (equipment['equipment_number'] as string)
        : null;
      const maintenanceRes = await exec(sql`
        SELECT em.id, em.maintenance_type, em.type, em.status, em.scheduled_date,
               em.completed_date, em.next_maintenance_date, em.last_maintenance_date,
               em.frequency, em.assigned_to, em.notes, em.cost
        FROM equipment_maintenance em
        WHERE em.equipment_code = ${equipmentNumber}
           OR (${workCenterId}::int IS NOT NULL AND em.work_center_id = ${workCenterId})
        ORDER BY em.scheduled_date DESC NULLS LAST
        LIMIT 50`);
      const maintenance = rowsOf(maintenanceRes);

      // Assigned operator — from the most-recent session that names a worker.
      const operatorSession = productionSessions.find((s) => s['operator_name']);
      const assignedOperator = operatorSession
        ? {
            employee_id: operatorSession['operator_id'] ?? operatorSession['worker_id'] ?? null,
            name: operatorSession['operator_name'],
            session_id: operatorSession['id'],
          }
        : null;

      // Utilization — running vs (running + stopped) seconds across real sessions.
      const utilRes = await exec(sql`
        SELECT
          COALESCE(SUM(running_time_seconds), 0) AS running_seconds,
          COALESCE(SUM(stopped_time_seconds), 0) AS stopped_seconds,
          COUNT(*)                                AS total_sessions,
          COUNT(*) FILTER (WHERE status IN ('running','in_progress')) AS active_sessions
        FROM production_sessions
        WHERE equipment_id = ${id} AND deleted_at IS NULL`);
      const utilRow = rowsOf(utilRes)[0] ?? null;
      let utilization: Row | null = null;
      if (utilRow) {
        const running = Number(utilRow['running_seconds']) || 0;
        const stopped = Number(utilRow['stopped_seconds']) || 0;
        const denom = running + stopped;
        utilization = {
          running_seconds: running,
          stopped_seconds: stopped,
          total_sessions: Number(utilRow['total_sessions']) || 0,
          active_sessions: Number(utilRow['active_sessions']) || 0,
          utilization_percent: denom > 0 ? Math.round((running / denom) * 1000) / 10 : null,
        };
      }

      const result: Equipment360 = {
        equipment,
        currentStatus,
        oee,
        productionSessions,
        downtimeEvents,
        statusHistory,
        maintenance,
        assignedOperator,
        utilization,
        // Honest-empty per owner: IoT sensors are NOT installed. The mes_telemetry
        // table holds only seed/demo rows and is intentionally not exposed here.
        telemetry: [],
        telemetryNote: 'IoT sensorlar hali o\'rnatilmagan — telemetriya ma\'lumoti yo\'q.',
      };
      return result;
    });
  }

  async create(body: Row): Promise<Result<Row | null>>  {
  try {
      // equipment_number (NOT NULL) ← code, fallback to a generated value so the row is never rejected.
      const equipmentNumber = (body['code'] as string | undefined) ?? `EQ-${Date.now()}`;
      // category (NOT NULL, no DB default) ← type when provided, else a neutral default.
      const category = (body['type'] as string | undefined) ?? 'general';
      const r = await exec(sql`INSERT INTO equipment (name, equipment_number, type, manufacturer, model, location, category, status)
        VALUES (
          ${body['name'] ?? null},
          ${equipmentNumber},
          ${body['type'] ?? null},
          ${body['manufacturer'] ?? null},
          ${body['model'] ?? null},
          ${body['location'] ?? null},
          ${category},
          ${body['status'] ?? 'active'}
        ) RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async update(id: number, body: Row): Promise<Result<Row | null>>  {
  try {
      // Batch 2 item 1.6: `location` is a real equipment column the UPDATE dropped (only status+name
      // were set), so an equipment location edit "saved" but was lost. Added. NB: `notes` is NOT a
      // column on equipment (verified live) — deliberately not added here; flagged Q-35 (owner schema).
      const r = await exec(sql`UPDATE equipment SET status = COALESCE(${body['status'] ?? null}, status), name = COALESCE(${body['name'] ?? null}, name), location = COALESCE(${body['location'] ?? null}, location), updated_at = NOW() WHERE id = ${id} RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }
}
