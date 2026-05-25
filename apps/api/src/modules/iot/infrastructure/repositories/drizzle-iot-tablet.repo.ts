/**
 * @module drizzle-iot-tablet.repo
 * @description Data-access layer for IoT tablet PWA endpoints (Wave 11 P1).
 *              Powers /iot/tablet/{login,sos-alert,equipment,orders,worker-schedule}.
 *              All methods return Result<T>; raw SQL via typedExecute<T> is used
 *              for tables not yet plumbed into the shared/db barrel (sos_alerts,
 *              shift_assignments) — see TODO P3-31 annotations below.
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { Ok, Err, Result } from '@common/result';
import { typedExecute } from '@shared/db/typed-execute';

export interface TabletWorkerRow {
  id: number;
  user_id: number | null;
  employee_code: string;
  first_name: string;
  last_name: string;
  password_hash: string | null;
  role: string | null;
  equipment_id: number | null;
  equipment_name: string | null;
}

export interface TabletEquipmentRow {
  id: number;
  name: string;
  status: string;
  model: string | null;
  last_maintenance_at: string | null;
}

export interface TabletOrderRow {
  id: number;
  order_number: string;
  product_name: string | null;
  qty: number;
  due_date: string | null;
  priority: number;
  status: string;
}

export interface TabletScheduleRow {
  id: number;
  shift_date: string;
  start_time: string | null;
  end_time: string | null;
  equipment_id: number | null;
  role: string | null;
}

export interface SosInsertResult {
  id: number;
  created_at: string;
}

@Injectable()
export class DrizzleIotTabletRepo {
  /**
   * Resolve a worker by their tabel-number (= employees.employee_code).
   * Joins users for the password hash and role; equipment via work_center_id
   * is best-effort (no direct worker→equipment FK exists in the canonical schema).
   * TODO P3-31: introduce a dedicated `worker_equipment_assignments` table so
   * the "currently signed-in operator on machine X" mapping is single-sourced
   * instead of inferred from work_center_id.
   */
  async findWorkerByTabel(tabelNumber: string): Promise<Result<TabletWorkerRow | null>> {
    try {
      const rows = await typedExecute<TabletWorkerRow>(sql`
        SELECT
          e.id,
          e.user_id,
          e.employee_code,
          e.first_name,
          e.last_name,
          u.password_hash,
          p.name AS role,
          eq.id AS equipment_id,
          eq.name AS equipment_name
        FROM employees e
        LEFT JOIN users u ON u.id = e.user_id
        LEFT JOIN positions p ON p.id = e.position_id
        LEFT JOIN equipment eq ON eq.work_center_id::int = e.work_center_id
                              AND eq.is_active = true
        WHERE e.employee_code = ${tabelNumber}
          AND e.deleted_at IS NULL
          AND COALESCE(e.is_blocked, false) = false
        ORDER BY eq.id ASC
        LIMIT 1
      `);
      return Ok(rows[0] ?? null);
    } catch (e) { return Err((e as Error).message); }
  }

  /**
   * Equipment list for the tablet view. Returns all active equipment when no
   * filter is given; if workerId is supplied, narrows to equipment in the
   * same work_center as the worker (same heuristic as findWorkerByTabel).
   */
  async findTabletEquipment(
    workerId?: number,
    shopFloor?: string,
  ): Promise<Result<TabletEquipmentRow[]>> {
    try {
      const rows = workerId
        ? await typedExecute<TabletEquipmentRow>(sql`
            SELECT eq.id, eq.name, eq.status, eq.model,
                   eq.last_maintenance_date AS last_maintenance_at
            FROM equipment eq
            JOIN employees e
              ON eq.work_center_id::int = e.work_center_id
            WHERE e.id = ${workerId}
              AND eq.is_active = true
              AND eq.deleted_at IS NULL
            ORDER BY eq.name
            LIMIT 100
          `)
        : shopFloor
          ? await typedExecute<TabletEquipmentRow>(sql`
              SELECT id, name, status, model,
                     last_maintenance_date AS last_maintenance_at
              FROM equipment
              WHERE is_active = true
                AND deleted_at IS NULL
                AND location ILIKE ${'%' + shopFloor + '%'}
              ORDER BY name
              LIMIT 100
            `)
          : await typedExecute<TabletEquipmentRow>(sql`
              SELECT id, name, status, model,
                     last_maintenance_date AS last_maintenance_at
              FROM equipment
              WHERE is_active = true
                AND deleted_at IS NULL
              ORDER BY name
              LIMIT 100
            `);
      return Ok(rows);
    } catch (e) { return Err((e as Error).message); }
  }

  /**
   * Production orders assigned to a worker / equipment / status filter.
   * Active states default to: created, released, in_progress.
   * Worker→order linkage uses production_sessions.worker_id; equipment linkage
   * uses production_sessions.equipment_id.
   */
  async findTabletOrders(
    workerId?: number,
    equipmentId?: number,
    status?: string,
  ): Promise<Result<TabletOrderRow[]>> {
    try {
      const statusFilter = status
        ? sql`AND po.status = ${status}`
        : sql`AND po.status IN ('created','released','in_progress')`;

      const whereJoin =
        workerId && equipmentId
          ? sql`WHERE ps.worker_id = ${workerId} AND ps.equipment_id = ${equipmentId}`
          : workerId
            ? sql`WHERE ps.worker_id = ${workerId}`
            : equipmentId
              ? sql`WHERE ps.equipment_id = ${equipmentId}`
              : sql`WHERE 1=1`;

      const rows = await typedExecute<TabletOrderRow>(sql`
        SELECT DISTINCT
          po.id,
          po.order_number,
          pr.name AS product_name,
          po.planned_quantity::float AS qty,
          po.planned_end_date AS due_date,
          po.priority,
          po.status
        FROM production_orders po
        LEFT JOIN products pr ON pr.id = po.product_id
        LEFT JOIN production_sessions ps ON ps.production_order_id = po.id
        ${whereJoin}
        ${statusFilter}
        AND po.deleted_at IS NULL
        ORDER BY po.priority ASC, po.planned_end_date ASC NULLS LAST
        LIMIT 100
      `);
      return Ok(rows);
    } catch (e) { return Err((e as Error).message); }
  }

  /**
   * Worker shift schedule. Reads shift_assignments joined to shift_types for
   * start/end time labels. Range defaults to "today..today+14d" when no `from`
   * supplied. TODO P3-31: shift_types table is referenced by integer FK but
   * not yet plumbed into the shared/db barrel; the join is best-effort.
   */
  async findWorkerSchedule(
    workerId: number,
    from?: string,
    to?: string,
  ): Promise<Result<TabletScheduleRow[]>> {
    try {
      const fromDate = from ?? new Date().toISOString().slice(0, 10);
      const toDate =
        to ??
        new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10);

      const rows = await typedExecute<TabletScheduleRow>(sql`
        SELECT
          sa.id,
          sa.assignment_date::text AS shift_date,
          st.start_time::text AS start_time,
          st.end_time::text AS end_time,
          e.work_center_id AS equipment_id,
          p.name AS role
        FROM shift_assignments sa
        LEFT JOIN shift_types st ON st.id = sa.shift_type_id
        LEFT JOIN employees e ON e.id = sa.employee_id
        LEFT JOIN positions p ON p.id = e.position_id
        WHERE sa.employee_id = ${workerId}
          AND sa.assignment_date BETWEEN ${fromDate}::date AND ${toDate}::date
        ORDER BY sa.assignment_date ASC
        LIMIT 100
      `);
      return Ok(rows);
    } catch (e) { return Err((e as Error).message); }
  }

  /**
   * Insert a new SOS alert row.
   * TODO P3-31: the `sos_alerts` table is defined in lib/db/src/schema/pp/
   * pp-enhanced.ts but is not yet exported through the apps/api shared/db
   * barrel. We insert via raw SQL with typedExecute so the safety button can
   * function NOW; a follow-up commit should wire the Drizzle table object
   * through and migrate this method to a builder-style insert.
   */
  async insertSosAlert(payload: {
    workerId: number;
    workerName: string;
    sessionId: string | null;
    equipmentId: string | null;
    alertType: string;
    message: string;
  }): Promise<Result<SosInsertResult>> {
    try {
      const rows = await typedExecute<SosInsertResult>(sql`
        INSERT INTO sos_alerts
          (worker_id, worker_name, session_id, equipment_id,
           alert_type, message, status, created_at)
        VALUES
          (${payload.workerId},
           ${payload.workerName},
           ${payload.sessionId},
           ${payload.equipmentId},
           ${payload.alertType},
           ${payload.message},
           'open',
           NOW())
        RETURNING id, created_at::text AS created_at
      `);
      const row = rows[0];
      if (!row) return Err('SOS insert returned no row');
      return Ok(row);
    } catch (e) { return Err((e as Error).message); }
  }
}
