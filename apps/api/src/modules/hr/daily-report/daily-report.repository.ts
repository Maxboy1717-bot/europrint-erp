/**
 * @module daily-report.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db , runQuery } from '@shared/db';
import { sql, eq } from 'drizzle-orm';
import { hr_daily_reports, hr_daily_report_audit, hrEmployees } from '@shared/db';
import { execDailyReportMarkAbsent } from '@common/database/queries-remaining';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class DailyReportRepository {
  async upsertReport(dto: { employeeId: number; reportDate: string; tasksCompleted: string; metrics?: string | null; tomorrowPlan?: string | null }): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        INSERT INTO hr_daily_reports (employee_id, report_date, tasks_completed, metrics, tomorrow_plan, status, submitted_at)
        VALUES (${dto.employeeId}, ${dto.reportDate}, ${dto.tasksCompleted}, ${dto.metrics ?? null}, ${dto.tomorrowPlan ?? null}, 'submitted', NOW())
        ON CONFLICT (employee_id, report_date) DO UPDATE
          SET tasks_completed = EXCLUDED.tasks_completed,
              metrics         = EXCLUDED.metrics,
              tomorrow_plan   = EXCLUDED.tomorrow_plan,
              status          = 'submitted',
              submitted_at    = NOW()
        RETURNING *
      `);
      return (rows.rows[0] ?? {}) as Row;
      }, 'DB_ERROR');
  }

  async getReportStatus(reportId: number): Promise<Result<string>> {
    return safeCall(async () => {
      const r = await db.select({ status: hr_daily_reports.status })
        .from(hr_daily_reports)
        .where(eq(hr_daily_reports.id, reportId))
        .limit(1);
      return String(r[0]?.status ?? 'unknown');
      }, 'DB_ERROR');
  }

  async updateReportStatus(reportId: number, newStatus: string): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.update(hr_daily_reports)
        .set({ status: newStatus, updatedAt: _time.now() })
        .where(eq(hr_daily_reports.id, reportId))
        .returning();
      return castTo<Row | null>((rows[0] ?? null));
      }, 'DB_ERROR');
  }

  async insertAudit(reportId: number, hrUserId: number, previousStatus: string, newStatus: string, reason: string): Promise<void> {
    await db.insert(hr_daily_report_audit).values({
      reportId:       reportId,
      hrUserId:       hrUserId,
      previousStatus: previousStatus,
      newStatus:      newStatus,
      reason:         reason,
    });
  }

  async getStats(reportDate: string): Promise<Result<Row>> {
    return safeCall(async () => {
      const r = await db.select({
        submitted_count:        sql<number>`COUNT(*) FILTER (WHERE dr.status = 'submitted')`,
        absent_count:           sql<number>`COUNT(*) FILTER (WHERE dr.is_auto_absent = true)`,
        total_active_employees: sql<number>`COUNT(${hrEmployees.id})`,
      })
        .from(hrEmployees)
        .leftJoin(hr_daily_reports, sql`dr.employee_id = ${hrEmployees.id} AND dr.report_date::date = ${reportDate}::date`)
        .where(sql`${hrEmployees.status} = 'active'`);
      return (r[0] ?? {}) as Row;
      }, 'DB_ERROR');
  }

  async getByEmployee(employeeId: number, limit: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.select()
        .from(hr_daily_reports)
        .where(eq(hr_daily_reports.employeeId, employeeId))
        .orderBy(sql`${hr_daily_reports.reportDate} DESC`)
        .limit(limit);
      return castTo<Row[]>(rows);
      }, 'DB_ERROR');
  }

  async getByDate(date: string, type: 'all' | 'operator' | 'office' = 'all', limit = 100): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT dr.*,
               e.first_name,
               e.last_name,
               e.employee_code,
               COALESCE(e.is_machine_operator, false) AS is_machine_operator,
               COALESCE(dr.is_machine_operator_report, false) AS is_machine_operator_report,
               primary_org.dept_name AS department_name
        FROM hr_daily_reports dr
        JOIN employees e ON e.id = dr.employee_id
        LEFT JOIN users u ON u.employee_id = e.id AND u.deleted_at IS NULL
        LEFT JOIN LATERAL (
          SELECT eod.org_department_id AS dept_id,
                 od.name_uz AS dept_name,
                 COALESCE(of2.position_name, '') AS pos_name
          FROM employee_org_departments eod
          JOIN org_departments od ON od.id = eod.org_department_id
          LEFT JOIN org_functions of2 ON of2.org_department_id = eod.org_department_id
          WHERE eod.user_id = u.id AND eod.is_primary = true
          ORDER BY eod.assigned_at DESC
          LIMIT 1
        ) primary_org ON true
        WHERE dr.report_date::date = ${date}::date
          AND (
            ${type}::text = 'all'
            OR (${type}::text = 'operator' AND COALESCE(e.is_machine_operator, false) = true)
            OR (${type}::text = 'office'   AND COALESCE(e.is_machine_operator, false) = false)
          )
        ORDER BY e.last_name
        LIMIT ${limit}
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  /**
   * Department snapshot: submitted vs. missing employees for a given date.
   * Returns shape consumed by `DailyReportPage.tsx` admin tab:
   *   { submitted: DailyReportEmployee[], missing: DailyReportEmployee[] }
   */
  async getByDepartment(departmentId: number, date: string): Promise<Result<{ submitted: Row[]; missing: Row[] }>> {
    return safeCall(async () => {
      const submitted = await runQuery<Row>(sql`
        SELECT dr.id,
               e.id AS employee_id,
               e.first_name,
               e.last_name,
               e.employee_code,
               COALESCE(e.is_machine_operator, false) AS is_machine_operator,
               dr.submitted_at,
               dr.status,
               dr.is_auto_absent,
               dr.tasks_completed
        FROM employees e
        JOIN hr_daily_reports dr
          ON dr.employee_id = e.id
         AND dr.report_date::date = ${date}::date
        WHERE EXISTS (
          SELECT 1 FROM users u2
          JOIN employee_org_departments eod2 ON eod2.user_id = u2.id
          WHERE u2.employee_id = e.id AND u2.deleted_at IS NULL
            AND eod2.org_department_id = ${departmentId} AND eod2.is_primary = true
        )
        AND e.status = 'active'
        ORDER BY e.last_name
      `);

      const missing = await runQuery<Row>(sql`
        SELECT e.id,
               e.first_name,
               e.last_name,
               e.employee_code,
               COALESCE(e.is_machine_operator, false) AS is_machine_operator
        FROM employees e
        WHERE EXISTS (
          SELECT 1 FROM users u2
          JOIN employee_org_departments eod2 ON eod2.user_id = u2.id
          WHERE u2.employee_id = e.id AND u2.deleted_at IS NULL
            AND eod2.org_department_id = ${departmentId} AND eod2.is_primary = true
        )
        AND e.status = 'active'
          AND NOT EXISTS (
            SELECT 1 FROM hr_daily_reports dr
            WHERE dr.employee_id = e.id
              AND dr.report_date::date = ${date}::date
          )
        ORDER BY e.last_name
      `);

      return { submitted: submitted.rows as Row[], missing: missing.rows as Row[] };
      }, 'DB_ERROR');
  }

  async findEmployeesWithoutReport(today: string, batchSize: number, offset: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT e.id
        FROM employees e
        LEFT JOIN users u_pos ON u_pos.employee_id = e.id AND u_pos.deleted_at IS NULL
        LEFT JOIN LATERAL (
          SELECT COALESCE(of2.position_name, '') AS pos_name
          FROM employee_org_departments eod
          LEFT JOIN org_functions of2 ON of2.org_department_id = eod.org_department_id
          WHERE eod.user_id = u_pos.id AND eod.is_primary = true
          ORDER BY eod.assigned_at DESC
          LIMIT 1
        ) pname ON true
        WHERE e.status = 'active'
          AND COALESCE(pname.pos_name, '') NOT ILIKE '%mashina operator%'
          AND COALESCE(pname.pos_name, '') NOT ILIKE '%mashin operator%'
          AND COALESCE(pname.pos_name, '') NOT ILIKE '%machine operator%'
          AND NOT EXISTS (SELECT 1 FROM hr_daily_reports dr WHERE dr.employee_id = e.id AND dr.report_date::date = ${today}::date)
        ORDER BY e.id
        LIMIT ${batchSize} OFFSET ${offset}
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async markAbsentForDate(today: string): Promise<void> {
    await execDailyReportMarkAbsent(today);
  }

  async findByIdWithEmployee(reportId: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT
          dr.*,
          e.first_name, e.last_name,
          e.first_name || ' ' || e.last_name AS employee_name,
          primary_org.pos_name AS position_name,
          primary_org.dept_name AS department_name
        FROM hr_daily_reports dr
        JOIN employees e ON e.id = dr.employee_id
        LEFT JOIN users u ON u.employee_id = e.id AND u.deleted_at IS NULL
        LEFT JOIN LATERAL (
          SELECT eod.org_department_id AS dept_id,
                 od.name_uz AS dept_name,
                 COALESCE(of2.position_name, '') AS pos_name
          FROM employee_org_departments eod
          JOIN org_departments od ON od.id = eod.org_department_id
          LEFT JOIN org_functions of2 ON of2.org_department_id = eod.org_department_id
          WHERE eod.user_id = u.id AND eod.is_primary = true
          ORDER BY eod.assigned_at DESC
          LIMIT 1
        ) primary_org ON true
        WHERE dr.id = ${reportId}
        LIMIT 1
      `);
      return (rows.rows[0] ?? null) as Row | null;
    }, 'DB_ERROR');
  }
}
