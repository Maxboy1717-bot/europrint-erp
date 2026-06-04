/**
 * @module telegram-bots/manager.repo
 * @description Manager-bot queries: document workflows, team, KPI, alerts, attendance.
 *
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   - Correlated subquery in SELECT (COALESCE((SELECT ... LIMIT 1), 'absent'))
 *   - FILTER (WHERE ...) aggregate clauses (COUNT(...) FILTER (WHERE date = CURRENT_DATE))
 *   - UNION ALL across three sources for unified alert feed (late/absent/doc_overdue)
 *   - String concatenation with || operator inside SELECT projection
 *   - INTERVAL '30 days' / INTERVAL '2 days' literal date arithmetic
 *   - ON CONFLICT (employee_id, date) DO UPDATE SET ... = EXCLUDED.* composite upsert
 *   - NULLIF for divide-by-zero guard in KPI rate calculation
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */

import { Injectable } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class TelegramBotsManagerRepo {
  async getCurrentPendingStepId(docId: number, approverId: number): Promise<Result<number | null>> {
    return safeCall(async () => {
      const rows = await runQuery<{ id: number }>(sql`
        SELECT das.id
        FROM document_approval_steps das
        WHERE das.document_id = ${docId}
          AND das.status = 'pending'
          AND das.approver_id = ${approverId}
        ORDER BY das.step_number ASC
        LIMIT 1
      `);
      return (rows.rows[0]?.id ?? null) as number | null;
    }, 'DB_ERROR');
  }

  async getDocumentEmployeeId(docId: number): Promise<Result<number | null>> {
    return safeCall(async () => {
      const rows = await runQuery<{ employee_id: number }>(sql`
        SELECT employee_id FROM documents WHERE id = ${docId} LIMIT 1
      `);
      return (rows.rows[0]?.employee_id ?? null) as number | null;
    }, 'DB_ERROR');
  }

  async getManagerByChatId(chatId: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT e.id, e.first_name, e.last_name,
               primary_org.dept_id AS department_id,
               primary_org.dept_name AS department_name
        FROM employees e
        LEFT JOIN users u ON u.employee_id = e.id AND u.deleted_at IS NULL
        LEFT JOIN LATERAL (
          SELECT eod.org_department_id AS dept_id,
                 od.name AS dept_name,
                 COALESCE(of2.position_name, '') AS pos_name
          FROM employee_org_departments eod
          JOIN org_departments od ON od.id = eod.org_department_id
          LEFT JOIN org_functions of2 ON of2.department_id = eod.org_department_id
          WHERE eod.user_id = u.id AND eod.is_primary = true
          ORDER BY eod.assigned_at DESC
          LIMIT 1
        ) primary_org ON true
        WHERE e.telegram_chat_id = ${String(chatId)}
          AND e.status = 'active'
          AND (e.is_department_head = true OR EXISTS (
            SELECT 1 FROM app_users u WHERE u.employee_id = e.id AND u.role IN ('manager', 'admin', 'director', 'hr')
          ))
        LIMIT 1
      `);
      return (rows.rows[0] as Row | undefined) ?? null;
    }, 'DB_ERROR');
  }

  async getPendingDocumentsForManager(managerId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT dw.id, dw.title, dw.submitted_at,
               e.first_name || ' ' || e.last_name AS submitter_name
        FROM document_workflows dw
        JOIN employees e ON e.id = dw.employee_id
        WHERE dw.status = 'pending'
          AND dw.current_approver_id = ${managerId}
        ORDER BY dw.submitted_at ASC
        LIMIT 20
      `);
      return rows.rows as Row[];
    }, 'DB_ERROR');
  }

  async approveDocument(docId: number, approverId: number): Promise<void> {
    await runQuery(sql`
      UPDATE document_workflows
      SET status = 'approved', approved_by = ${approverId}, approved_at = NOW()
      WHERE id = ${docId} AND status = 'pending' AND current_approver_id = ${approverId}
    `);
  }

  async rejectDocument(docId: number, rejecterId: number, reason: string): Promise<void> {
    await runQuery(sql`
      UPDATE document_workflows
      SET status = 'rejected', rejected_by = ${rejecterId}, rejection_reason = ${reason}, rejected_at = NOW()
      WHERE id = ${docId} AND status = 'pending' AND current_approver_id = ${rejecterId}
    `);
  }

  async getTeamForManager(managerId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT e.id, e.first_name, e.last_name, e.position,
               COALESCE(
                 (SELECT al.status FROM attendance_logs al
                  WHERE al.employee_id = e.id AND al.date = CURRENT_DATE
                  ORDER BY al.created_at DESC LIMIT 1),
                 'absent'
               ) AS attendance_today
        FROM employees e
        WHERE e.manager_id = ${managerId} AND e.status = 'active'
        ORDER BY e.first_name
        LIMIT 50
      `);
      return rows.rows as Row[];
    }, 'DB_ERROR');
  }

  async getDailyReportStatusForManager(managerId: number): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT
          COUNT(e.id) AS total,
          COUNT(dr.id) FILTER (WHERE dr.date = CURRENT_DATE) AS submitted,
          COUNT(e.id) - COUNT(dr.id) FILTER (WHERE dr.date = CURRENT_DATE) AS missing
        FROM employees e
        LEFT JOIN daily_reports dr ON dr.employee_id = e.id
        WHERE e.manager_id = ${managerId} AND e.status = 'active'
      `);
      return (rows.rows[0] ?? { total: 0, submitted: 0, missing: 0 }) as Row;
    }, 'DB_ERROR');
  }

  async getDepartmentKpi(departmentId: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT
          ROUND(AVG(al.late_minutes) FILTER (WHERE al.late_minutes > 0)) AS avg_late_minutes,
          ROUND(100.0 * COUNT(dr.id) / NULLIF(COUNT(DISTINCT e.id) * 30, 0)) AS report_rate,
          ROUND(100.0 * COUNT(al.id) FILTER (WHERE al.status = 'present') / NULLIF(COUNT(DISTINCT e.id) * 30, 0)) AS attendance_rate,
          ROUND(100.0 * COUNT(pg.id) FILTER (WHERE pg.status = 'completed') / NULLIF(COUNT(pg.id), 0)) AS goals_completion
        FROM employees e
        LEFT JOIN attendance_logs al ON al.employee_id = e.id AND al.date >= CURRENT_DATE - INTERVAL '30 days'
        LEFT JOIN daily_reports dr ON dr.employee_id = e.id AND dr.date >= CURRENT_DATE - INTERVAL '30 days'
        LEFT JOIN pip_goals pg ON pg.employee_id = e.id
        WHERE EXISTS (
          SELECT 1 FROM users u2
          JOIN employee_org_departments eod2 ON eod2.user_id = u2.id
          WHERE u2.employee_id = e.id AND u2.deleted_at IS NULL
            AND eod2.org_department_id = ${departmentId} AND eod2.is_primary = true
        )
        AND e.status = 'active'
      `);
      return (rows.rows[0] ?? null) as Row | null;
    }, 'DB_ERROR');
  }

  async getManagerAlerts(managerId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT 'late' AS type,
               e.first_name || ' ' || e.last_name || ' kech keldi (' || al.late_minutes || ' daqiqa)' AS message,
               al.created_at AS alert_time
        FROM attendance_logs al
        JOIN employees e ON e.id = al.employee_id
        WHERE e.manager_id = ${managerId} AND al.date = CURRENT_DATE AND al.late_minutes > 0
        UNION ALL
        SELECT 'absent' AS type,
               e.first_name || ' ' || e.last_name || ' bugun kelmadi' AS message,
               CURRENT_TIMESTAMP AS alert_time
        FROM employees e
        WHERE e.manager_id = ${managerId} AND e.status = 'active'
          AND NOT EXISTS (SELECT 1 FROM attendance_logs al WHERE al.employee_id = e.id AND al.date = CURRENT_DATE)
        UNION ALL
        SELECT 'doc_overdue' AS type,
               'Hujjat "' || dw.title || '" muddati o''tgan' AS message,
               dw.submitted_at AS alert_time
        FROM document_workflows dw
        WHERE dw.current_approver_id = ${managerId} AND dw.status = 'pending'
          AND dw.submitted_at < NOW() - INTERVAL '2 days'
        ORDER BY alert_time DESC
        LIMIT 20
      `);
      return rows.rows as Row[];
    }, 'DB_ERROR');
  }

  async recordManualAttendance(chatId: number, status: string, reason?: string): Promise<void> {
    await runQuery(sql`
      INSERT INTO attendance_logs (employee_id, date, status, source, notes, created_at)
      SELECT e.id, CURRENT_DATE, ${status}, 'telegram', ${reason ?? null}, NOW()
      FROM employees e
      WHERE e.telegram_chat_id = ${String(chatId)} AND e.status = 'active'
      ON CONFLICT (employee_id, date) DO UPDATE
        SET status = EXCLUDED.status, notes = EXCLUDED.notes, updated_at = NOW()
    `);
  }

  async recordLateReason(employeeId: number, reason: string): Promise<void> {
    await runQuery(sql`
      UPDATE attendance_logs
      SET late_reason = ${reason}, updated_at = NOW()
      WHERE employee_id = ${employeeId} AND date = CURRENT_DATE
    `);
  }

  async recordDepartureReason(chatId: number, reason: string): Promise<void> {
    await runQuery(sql`
      INSERT INTO employee_departures (employee_id, departure_time, reason, created_at)
      SELECT e.id, NOW(), ${reason}, NOW()
      FROM employees e
      WHERE e.telegram_chat_id = ${String(chatId)} AND e.status = 'active'
    `);
  }
}
