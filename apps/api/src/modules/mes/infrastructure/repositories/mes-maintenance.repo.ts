/**
 * @module mes-maintenance.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';

type Row = Record<string, unknown>;

/** Outcome of an emergency-downtime → maintenance-task auto-open attempt. */
export interface CreateFromDowntimeResult {
  created: boolean;
  taskId: number | null;
  /** Why nothing was created (or 'created'): 'not_emergency' | 'duplicate' | 'created'. */
  outcome: 'not_emergency' | 'duplicate' | 'created';
  /** mes_maintenance_requests.id carrying the machine link — only set when created=true. */
  requestId: number | null;
  /** Down machine / work-center id actually stored on the request — only set when created=true. */
  equipmentId: number | null;
  /** Human-readable reason text stored on the request/task — only set when created=true. */
  description: string | null;
}

@Injectable()
export class MesMaintenanceRepository {
  async listMaintenanceRequests(status: string | undefined, lim: number, off: number): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      SELECT mr.*, COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS requested_by_name
      FROM mes_maintenance_requests mr
      LEFT JOIN employees e ON e.id = mr.requested_by
      WHERE (${status ?? null}::text IS NULL OR mr.status = ${status ?? null})
      ORDER BY mr.priority DESC, mr.created_at DESC
      LIMIT ${lim} OFFSET ${off}
    `);
    return rows.rows as Row[];
  }

  async createMaintenanceRequest(title: string, description: string | null, work_center_id: number | null, priority: string, userId: number | null): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      INSERT INTO mes_maintenance_requests (title, description, equipment_id, priority, requested_by, status)
      VALUES (${title}, ${description ?? null}, ${work_center_id ?? null}, ${priority ?? 'normal'}, ${userId}, 'open')
      RETURNING *
    `);
    return rows.rows as Row[];
  }

  async updateMaintenanceRequest(mid: number, status: string | null, assigned_to: number | null, notes: string | null, resolved_at: string | null): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      UPDATE mes_maintenance_requests
      SET status = COALESCE(${status ?? null}, status),
          assigned_to = COALESCE(${assigned_to ?? null}, assigned_to),
          notes = COALESCE(${notes ?? null}, notes),
          resolved_at = COALESCE(${resolved_at ?? null}, resolved_at),
          updated_at = NOW()
      WHERE id = ${mid} RETURNING *
    `);
    return rows.rows as Row[];
  }

  async listTasks(request_id: number | null, status: string | undefined, lim: number): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      SELECT t.*, COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS assigned_to_name
      FROM mes_maintenance_tasks t
      LEFT JOIN employees e ON e.id = t.assigned_to
      WHERE (${request_id}::int IS NULL OR t.request_id = ${request_id})
        AND (${status ?? null}::text IS NULL OR t.status = ${status ?? null})
      ORDER BY t.created_at DESC LIMIT ${lim}
    `);
    return rows.rows as Row[];
  }

  async updateTaskProgress(tid: number, progress: number, status: string, notes: string | undefined): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      UPDATE mes_maintenance_tasks
      SET status = ${status}, result = COALESCE(${notes ?? null}, result), updated_at = NOW()
      WHERE id = ${tid} RETURNING *
    `);
    return rows.rows as Row[];
  }

  async createSos(session_id: number | null, reason: string, work_center_id: number | null, userId: number | null): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      INSERT INTO mes_sos_events (session_id, employee_id, reason, work_center_id, created_at)
      VALUES (${session_id ?? null}, ${userId}, ${reason}, ${work_center_id ?? null}, NOW())
      RETURNING *
    `);
    return rows.rows as Row[];
  }

  async getSosHistory(lim: number): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      SELECT s.*, COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS employee_name, wc.name AS work_center_name
      FROM mes_sos_events s
      LEFT JOIN employees e ON e.id = s.employee_id
      LEFT JOIN work_centers wc ON wc.id = s.work_center_id
      ORDER BY s.created_at DESC LIMIT ${lim}
    `);
    return rows.rows as Row[];
  }

  async getDowntimeReasons(): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`SELECT * FROM mes_downtime_reasons ORDER BY name`);
    return rows.rows as Row[];
  }

  async createDowntimeEvent(session_id: number, reason_id: number | null, notes: string | null): Promise<Row[]> {
    // Wire to canonical downtime_events (live schema: session_id=INT, event_type/reason_code NOT NULL)
    const rows = await runQuery<Row>(sql`
      INSERT INTO downtime_events (session_id, event_type, reason_code, reason_code_id, notes, started_at, is_planned)
      VALUES (${session_id}, 'downtime', ${reason_id !== null ? String(reason_id) : 'unknown'}, ${reason_id ?? null}, ${notes ?? null}, NOW(), false)
      RETURNING *
    `);
    return rows.rows as Row[];
  }

  async getDowntimeEvents(sid: number | null, lim: number): Promise<Row[]> {
    // Wire to canonical downtime_events; session_id is INTEGER — no cast needed.
    // sid === null => list across all sessions (bounded by lim), matching the
    // GET /mes/downtime-events list endpoint's contract.
    const rows = await runQuery<Row>(sql`
      SELECT de.*
      FROM downtime_events de
      WHERE (${sid}::int IS NULL OR de.session_id = ${sid})
      ORDER BY de.started_at DESC LIMIT ${lim}
    `);
    return rows.rows as Row[];
  }

  /**
   * VISION 08-mes#37 (Avariya remont): an EMERGENCY/breakdown downtime auto-opens a
   * maintenance task for the technician ("texnikaga vazifa avto-ochiladi").
   *
   * Emergency marker (stated): the downtime's reason resolves, in the LIVE
   * mes_downtime_reasons catalog, to category = 'breakdown' (unplanned equipment
   * failure — e.g. DT-HYDR/DT-SENSOR, seeded is_planned=false). The legacy domain
   * code 'BREAK' ('Mashina nosozligi' in DOWNTIME_REASON_CODES) is also treated as
   * emergency. Any other category ('material'/'setup'/'quality'/'organizational') is
   * NOT an emergency and opens nothing.
   *
   * mes_maintenance_tasks has no machine/session column of its own — the ONLY
   * structured machine link a task has is request_id → mes_maintenance_requests.
   * equipment_id. So the machine link is carried by an auto-created maintenance
   * REQUEST (equipment_id = the down machine / work-center); the task is linked to it.
   *
   * Idempotent: if an OPEN task (status pending/in_progress) already exists against an
   * OPEN request for the same machine, no second task is opened.
   *
   * Technician auto-assignment (assigned_to) is intentionally left NULL — it needs the
   * on-call technician roster (owner master-data), deferred as Guruh-B.
   */
  async createFromDowntime(params: {
    sessionId: number;
    workCenterId: number | null;
    reasonCode: string;
    reasonText: string | null;
  }): Promise<Result<CreateFromDowntimeResult>> {
    try {
      const { sessionId, workCenterId, reasonCode, reasonText } = params;

      // 1) Emergency gate — resolve the reason category from the live catalog.
      const catRes = await runQuery<{ category: string | null }>(sql`
        SELECT category FROM mes_downtime_reasons WHERE code = ${reasonCode} LIMIT 1
      `);
      const catRows = Array.isArray(catRes.rows) ? catRes.rows : [];
      const category = catRows[0]?.category ?? null;
      const isEmergency = category === 'breakdown' || reasonCode === 'BREAK';
      if (!isEmergency) {
        return Ok({ created: false, taskId: null, outcome: 'not_emergency', requestId: null, equipmentId: null, description: null });
      }

      // 2) Resolve the machine (equipment) link: prefer the work-center from the
      //    downtime event, else the session's machine_id. No fabrication.
      let equipmentId: number | null =
        workCenterId != null && Number.isFinite(workCenterId) ? Number(workCenterId) : null;
      if (equipmentId === null && Number.isFinite(sessionId)) {
        const sesRes = await runQuery<{ machine_id: number | null }>(sql`
          SELECT machine_id FROM mes_production_sessions WHERE id = ${sessionId} LIMIT 1
        `);
        const sesRows = Array.isArray(sesRes.rows) ? sesRes.rows : [];
        const machineId = sesRows[0]?.machine_id ?? null;
        equipmentId = machineId != null ? Number(machineId) : null;
      }

      // 3) Idempotency — skip if this machine already has an open breakdown task.
      if (equipmentId !== null) {
        const dupRes = await runQuery<{ id: number }>(sql`
          SELECT t.id
          FROM mes_maintenance_tasks t
          JOIN mes_maintenance_requests r ON r.id = t.request_id
          WHERE r.equipment_id = ${equipmentId}
            AND r.status = 'open'
            AND t.status IN ('pending', 'in_progress')
          ORDER BY t.created_at DESC
          LIMIT 1
        `);
        const dupRows = Array.isArray(dupRes.rows) ? dupRes.rows : [];
        const existingId = dupRows[0]?.id ?? null;
        if (existingId != null) {
          return Ok({ created: false, taskId: Number(existingId), outcome: 'duplicate', requestId: null, equipmentId, description: null });
        }
      }

      // 4) Create the machine-carrier maintenance REQUEST (priority high, open).
      const title = equipmentId != null
        ? `Avariya remont — mashina #${equipmentId}`
        : `Avariya remont — sessiya #${sessionId}`;
      const description = reasonText && reasonText.trim().length > 0
        ? reasonText
        : `Avariya to'xtash sababi: ${reasonCode}`;

      const reqRes = await runQuery<{ id: number }>(sql`
        INSERT INTO mes_maintenance_requests
          (title, description, equipment_id, priority, status, created_at, updated_at)
        VALUES (${title}, ${description}, ${equipmentId}, 'high', 'open', NOW(), NOW())
        RETURNING id
      `);
      const reqRows = Array.isArray(reqRes.rows) ? reqRes.rows : [];
      const requestId = reqRows[0]?.id != null ? Number(reqRows[0].id) : null;

      // 5) Create the technician TASK (assigned_to NULL — see Guruh-B deferral).
      const taskRes = await runQuery<{ id: number }>(sql`
        INSERT INTO mes_maintenance_tasks
          (request_id, title, reason, status, created_at, updated_at)
        VALUES (${requestId}, ${title}, ${description}, 'pending', NOW(), NOW())
        RETURNING id
      `);
      const taskRows = Array.isArray(taskRes.rows) ? taskRes.rows : [];
      const taskId = taskRows[0]?.id != null ? Number(taskRows[0].id) : null;

      return Ok({ created: true, taskId, outcome: 'created', requestId, equipmentId, description });
    } catch (e) {
      return Err(`Avariya remont vazifasini ochishda xatolik: ${String(e)}`);
    }
  }
}
