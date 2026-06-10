/**
 * @module mes-maintenance.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

type Row = Record<string, unknown>;

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

  async getDowntimeEvents(sid: number): Promise<Row[]> {
    // Wire to canonical downtime_events; session_id is INTEGER — no cast needed
    const rows = await runQuery<Row>(sql`
      SELECT de.*
      FROM downtime_events de
      WHERE de.session_id = ${sid} ORDER BY de.started_at DESC
    `);
    return rows.rows as Row[];
  }
}
