/**
 * @module hr-dashboard.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (HR)
 */

import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db , runQuery } from '@shared/db';
import { eq, sql } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';
import {
  hrEmployees,
  discipline_records, pip_plans, enps_surveys, shiftSchedules,
  hr_daily_reports,
} from '@shared/db';
import type { IHrDashboardRepo, DailyReportsStatsRow } from '../../domain/repositories/i-hr-dashboard.repo';

type Row = Record<string, unknown>;

export type { DailyReportsStatsRow };

@Injectable()
export class HrDashboardRepository implements IHrDashboardRepo {
  async getBirthdaysToday(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT e.id,
               COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS full_name,
               e.birth_date,
               primary_org.pos_name AS position, primary_org.dept_name AS department
        FROM employees e
        LEFT JOIN users u ON u.employee_id = e.id AND u.deleted_at IS NULL
        LEFT JOIN LATERAL (
          SELECT od.name_uz AS dept_name, COALESCE(of2.position_name, '') AS pos_name
          FROM employee_org_departments eod
          JOIN org_departments od ON od.id = eod.org_department_id
          LEFT JOIN org_functions of2 ON of2.org_department_id = eod.org_department_id
          WHERE eod.user_id = u.id AND eod.is_primary = true
          ORDER BY eod.assigned_at DESC LIMIT 1
        ) primary_org ON true
        WHERE e.status = 'active'
          AND e.birth_date IS NOT NULL
          AND EXTRACT(MONTH FROM e.birth_date) = EXTRACT(MONTH FROM NOW())
          AND EXTRACT(DAY FROM e.birth_date) = EXTRACT(DAY FROM NOW())
        ORDER BY e.last_name
        LIMIT 50
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async getBirthdaysUpcoming(d: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT e.id,
               COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS full_name,
               primary_org.pos_name AS position, primary_org.dept_name AS department,
               e.birth_date,
               EXTRACT(MONTH FROM e.birth_date)::int AS birth_month,
               EXTRACT(DAY FROM e.birth_date)::int AS birth_day
        FROM employees e
        LEFT JOIN users u ON u.employee_id = e.id AND u.deleted_at IS NULL
        LEFT JOIN LATERAL (
          SELECT od.name_uz AS dept_name, COALESCE(of2.position_name, '') AS pos_name
          FROM employee_org_departments eod
          JOIN org_departments od ON od.id = eod.org_department_id
          LEFT JOIN org_functions of2 ON of2.org_department_id = eod.org_department_id
          WHERE eod.user_id = u.id AND eod.is_primary = true
          ORDER BY eod.assigned_at DESC LIMIT 1
        ) primary_org ON true
        WHERE e.status = 'active'
          AND e.birth_date IS NOT NULL
          AND MAKE_DATE(EXTRACT(YEAR FROM NOW())::int, EXTRACT(MONTH FROM e.birth_date)::int, EXTRACT(DAY FROM e.birth_date)::int)
              BETWEEN NOW()::date AND (NOW() + (${d}||' days')::interval)::date
        ORDER BY birth_month, birth_day
        LIMIT 50
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async getMilestonesUpcoming(d: number): Promise<Result<unknown[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT e.id,
               COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS employee_name,
               primary_org.pos_name AS position, primary_org.dept_name AS department, e.hire_date,
               (EXTRACT(YEAR FROM AGE(NOW(), e.hire_date))::int + 1) * 12 AS milestone_months,
               MAKE_DATE(EXTRACT(YEAR FROM NOW())::int, EXTRACT(MONTH FROM e.hire_date)::int, EXTRACT(DAY FROM e.hire_date)::int) AS due_date
        FROM employees e
        LEFT JOIN users u ON u.employee_id = e.id AND u.deleted_at IS NULL
        LEFT JOIN LATERAL (
          SELECT od.name_uz AS dept_name, COALESCE(of2.position_name, '') AS pos_name
          FROM employee_org_departments eod
          JOIN org_departments od ON od.id = eod.org_department_id
          LEFT JOIN org_functions of2 ON of2.org_department_id = eod.org_department_id
          WHERE eod.user_id = u.id AND eod.is_primary = true
          ORDER BY eod.assigned_at DESC LIMIT 1
        ) primary_org ON true
        WHERE e.status = 'active'
          AND EXTRACT(YEAR FROM AGE(NOW(), e.hire_date)) IN (0,1,2,4,9,14,19,24)
          AND MAKE_DATE(EXTRACT(YEAR FROM NOW())::int, EXTRACT(MONTH FROM e.hire_date)::int, EXTRACT(DAY FROM e.hire_date)::int)
              BETWEEN NOW()::date AND (NOW() + (${d} || ' days')::interval)::date
        ORDER BY due_date
        LIMIT 30
      `);
      return rows.rows as Record<string, unknown>[];
      }, 'DB_ERROR');
  }

  async getMonthlyTrend(): Promise<Result<unknown[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT TO_CHAR(hire_date, 'YYYY-MM') AS month,
               COUNT(*) AS "newHires",
               COUNT(*) FILTER (WHERE status = 'terminated') AS resignations
        FROM employees
        WHERE hire_date >= NOW() - INTERVAL '12 months'
        GROUP BY TO_CHAR(hire_date, 'YYYY-MM')
        ORDER BY month
      `);
      return rows.rows as Record<string, unknown>[];
      }, 'DB_ERROR');
  }

  async getAbcAnalysis(): Promise<Result<unknown[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT e.id,
               COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS full_name,
               primary_org.pos_name AS position, primary_org.dept_name AS department,
               COALESCE(e.vysotskiy_category, 'B') AS category,
               CASE COALESCE(e.vysotskiy_category, 'B')
                    WHEN 'A' THEN 90
                    WHEN 'B' THEN 65
                    ELSE 40 END AS performance_score
        FROM employees e
        LEFT JOIN users u ON u.employee_id = e.id AND u.deleted_at IS NULL
        LEFT JOIN LATERAL (
          SELECT od.name_uz AS dept_name, COALESCE(of2.position_name, '') AS pos_name
          FROM employee_org_departments eod
          JOIN org_departments od ON od.id = eod.org_department_id
          LEFT JOIN org_functions of2 ON of2.org_department_id = eod.org_department_id
          WHERE eod.user_id = u.id AND eod.is_primary = true
          ORDER BY eod.assigned_at DESC LIMIT 1
        ) primary_org ON true
        WHERE e.status = 'active'
        ORDER BY category ASC, e.last_name
        LIMIT 100
      `);
      return rows.rows as Record<string, unknown>[];
      }, 'DB_ERROR');
  }

  async getAlerts(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT e.id,
               COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS full_name,
               primary_org.dept_name AS department, e.hire_date
        FROM employees e
        LEFT JOIN users u ON u.employee_id = e.id AND u.deleted_at IS NULL
        LEFT JOIN LATERAL (
          SELECT od.name_uz AS dept_name, COALESCE(of2.position_name, '') AS pos_name
          FROM employee_org_departments eod
          JOIN org_departments od ON od.id = eod.org_department_id
          LEFT JOIN org_functions of2 ON of2.org_department_id = eod.org_department_id
          WHERE eod.user_id = u.id AND eod.is_primary = true
          ORDER BY eod.assigned_at DESC LIMIT 1
        ) primary_org ON true
        WHERE e.status = 'active' AND e.hire_date <= NOW() - INTERVAL '5 years'
        ORDER BY e.hire_date ASC
        LIMIT 20
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async getDisciplineRecords(): Promise<Result<unknown[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT dr.*, e.first_name || ' ' || e.last_name AS employee_name
        FROM discipline_records dr
        LEFT JOIN employees e ON e.id = dr.employee_id
        ORDER BY dr.created_at DESC
        LIMIT 50
      `);
      return rows.rows as Record<string, unknown>[];
      }, 'DB_ERROR');
  }

  async getPip(): Promise<Result<unknown[]>> {
    return safeCall(async () => {
      const rows = await db.select()
        .from(pip_plans)
        .where(sql`${pip_plans.status} = 'active'`)
        .orderBy(sql`${pip_plans.createdAt} DESC`)
        .limit(50);
      return castTo<unknown[]>(rows);
      }, 'DB_ERROR');
  }

  async getEnpsSurveys(): Promise<Result<unknown[]>> {
    return safeCall(async () => {
      const rows = await db.select()
        .from(enps_surveys)
        .where(sql`${enps_surveys.status} = 'active'`)
        .orderBy(sql`${enps_surveys.createdAt} DESC`)
        .limit(20);
      return castTo<unknown[]>(rows);
      }, 'DB_ERROR');
  }

  async getAiInterviewSessions(): Promise<Result<unknown[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT * FROM ai_interview_sessions ORDER BY created_at DESC LIMIT 20
      `);
      return rows.rows as Record<string, unknown>[];
      }, 'DB_ERROR');
  }

  async getDailyReportsStats(): Promise<Result<DailyReportsStatsRow>> {
    return safeCall(async () => {
      const r = await db.select({
        total:    sql<number>`COUNT(*)`,
        approved: sql<number>`COUNT(*) FILTER (WHERE ${hr_daily_reports.status} = 'approved')`,
        pending:  sql<number>`COUNT(*) FILTER (WHERE ${hr_daily_reports.status} = 'pending')`,
        today:    sql<number>`COUNT(*) FILTER (WHERE ${hr_daily_reports.createdAt}::date = CURRENT_DATE)`,
      })
        .from(hr_daily_reports)
        .where(sql`${hr_daily_reports.createdAt} >= NOW() - INTERVAL '30 days'`);
      return r[0] ?? { total: 0, approved: 0, pending: 0, today: 0 };
      }, 'DB_ERROR');
  }

  async getAdaptationAtRisk(): Promise<Result<unknown[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT e.id,
               COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS full_name,
               primary_org.dept_name AS department, e.hire_date,
               EXTRACT(DAY FROM NOW() - e.hire_date)::int AS days_employed
        FROM employees e
        LEFT JOIN users u ON u.employee_id = e.id AND u.deleted_at IS NULL
        LEFT JOIN LATERAL (
          SELECT od.name_uz AS dept_name, COALESCE(of2.position_name, '') AS pos_name
          FROM employee_org_departments eod
          JOIN org_departments od ON od.id = eod.org_department_id
          LEFT JOIN org_functions of2 ON of2.org_department_id = eod.org_department_id
          WHERE eod.user_id = u.id AND eod.is_primary = true
          ORDER BY eod.assigned_at DESC LIMIT 1
        ) primary_org ON true
        WHERE e.status = 'active' AND e.hire_date >= NOW() - INTERVAL '90 days'
        ORDER BY e.hire_date DESC
        LIMIT 20
      `);
      return rows.rows as Record<string, unknown>[];
      }, 'DB_ERROR');
  }

  async getShiftsToday(today: string): Promise<Result<unknown[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT ss.id, ss.employee_id, ss.shift_date, ss.shift_type, ss.start_time, ss.end_time, ss.status,
               COALESCE(e.first_name || ' ' || e.last_name, '') AS employee_name
        FROM shift_schedules ss
        LEFT JOIN employees e ON e.id = ss.employee_id
        WHERE ss.shift_date = ${today}
        ORDER BY ss.start_time ASC
        LIMIT 100
      `);
      return rows.rows as Record<string, unknown>[];
      }, 'DB_ERROR');
  }

  async getAlumni(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT
          e.id,
          COALESCE(e.first_name, '') || ' ' || COALESCE(e.last_name, '') AS "fullName",
          COALESCE(primary_org.pos_name, '—')                            AS "lastPosition",
          COALESCE(primary_org.dept_name, '—')                          AS department,
          COALESCE(oc.last_working_day::text, e.updated_at::text, '')    AS "exitDate",
          COALESCE(oc.dismissal_type, e.employment_status, '—')          AS "exitReason",
          COALESCE(oc.dismissal_type, 'resignation')                     AS "exitType",
          CASE WHEN e.hire_date IS NOT NULL
               THEN ROUND(EXTRACT(DAY FROM COALESCE(oc.last_working_day, NOW()) - e.hire_date) / 365.0, 1)::float
               ELSE 0 END                                                AS "yearsOfService",
          false                                                          AS "hasBoomerang",
          'unknown'                                                      AS "networkStatus",
          NULL                                                           AS "lastContactDate"
        FROM employees e
        LEFT JOIN users u ON u.employee_id = e.id AND u.deleted_at IS NULL
        LEFT JOIN LATERAL (
          SELECT od.name_uz AS dept_name, COALESCE(of2.position_name, '') AS pos_name
          FROM employee_org_departments eod
          JOIN org_departments od ON od.id = eod.org_department_id
          LEFT JOIN org_functions of2 ON of2.org_department_id = eod.org_department_id
          WHERE eod.user_id = u.id AND eod.is_primary = true
          ORDER BY eod.assigned_at DESC LIMIT 1
        ) primary_org ON true
        LEFT JOIN offboarding_cases oc ON oc.employee_id = e.id
        WHERE e.is_active = false
           OR e.status NOT IN ('active', 'on_leave', 'probation')
        ORDER BY COALESCE(oc.last_working_day, e.updated_at) DESC NULLS LAST
        LIMIT 200
      `);
      return rows.rows as Row[];
    }, 'DB_ERROR');
  }

  async createDailyReport(dto: {
    user_id:         number;
    report_date:     string;
    tasks_completed?: string;
  }): Promise<Result<Row>> {
    return safeCall(async () => {
      // Resolve employee_id from user_id (fallback to user_id when no employee record exists)
      const empRows = await db
        .select({ id: hrEmployees.id })
        .from(hrEmployees)
        .where(eq(hrEmployees.user_id, dto.user_id))
        .limit(1);
      const employee_id = empRows[0]?.id ?? dto.user_id;

      const rows = await db
        .insert(hr_daily_reports)
        .values({
          employeeId:      employee_id,
          reportDate:      dto.report_date,
          tasksCompleted:  dto.tasks_completed ?? null,
          status:          'submitted',
          submittedAt:     sql`NOW()`,
        })
        .returning();
      return castTo<Row>(rows[0] ?? {});
    }, 'DB_ERROR');
  }
}
