/**
 * @module telegram-bots/events.repo
 * @description Birthday / anniversary / probation / contract / emergency / boomerang queries.
 */

import { Injectable } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class TelegramBotsEventsRepo {
  async getBirthdayEmployeesToday(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT e.id, e.first_name, e.last_name, e.telegram_chat_id, primary_org.dept_name AS department_name
        FROM employees e
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
        WHERE e.status = 'active'
          AND e.telegram_chat_id IS NOT NULL
          AND EXTRACT(month FROM e.birth_date) = EXTRACT(month FROM CURRENT_DATE)
          AND EXTRACT(day FROM e.birth_date) = EXTRACT(day FROM CURRENT_DATE)
      `);
      return rows.rows as Row[];
    }, 'DB_ERROR');
  }

  async getBirthdayEmployeesYesterday(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT e.first_name, e.last_name, primary_org.dept_name AS department_name
        FROM employees e
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
        WHERE e.status = 'active'
          AND EXTRACT(month FROM e.birth_date) = EXTRACT(month FROM CURRENT_DATE - INTERVAL '1 day')
          AND EXTRACT(day FROM e.birth_date) = EXTRACT(day FROM CURRENT_DATE - INTERVAL '1 day')
      `);
      return rows.rows as Row[];
    }, 'DB_ERROR');
  }

  async getWorkAnniversaryEmployeesToday(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT e.id, e.first_name, e.last_name, e.telegram_chat_id,
               primary_org.dept_name AS department_name,
               EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.hire_date)) AS years_worked
        FROM employees e
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
        WHERE e.status = 'active'
          AND e.telegram_chat_id IS NOT NULL
          AND e.hire_date IS NOT NULL
          AND EXTRACT(month FROM e.hire_date) = EXTRACT(month FROM CURRENT_DATE)
          AND EXTRACT(day FROM e.hire_date) = EXTRACT(day FROM CURRENT_DATE)
          AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.hire_date)) >= 1
      `);
      return rows.rows as Row[];
    }, 'DB_ERROR');
  }

  async getExpiringProbations(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT e.id, e.first_name, e.last_name, e.telegram_chat_id,
               e.probation_end_date,
               (e.probation_end_date::date - CURRENT_DATE) AS days_left
        FROM employees e
        WHERE e.status = 'active'
          AND e.telegram_chat_id IS NOT NULL
          AND e.probation_end_date IS NOT NULL
          AND (e.probation_end_date::date - CURRENT_DATE) IN (7, 3, 1)
      `);
      return rows.rows as Row[];
    }, 'DB_ERROR');
  }

  async getExpiringContracts(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT e.id, e.first_name, e.last_name, e.telegram_chat_id,
               c.end_date AS contract_end_date,
               (c.end_date::date - CURRENT_DATE) AS days_left
        FROM employees e
        JOIN contracts c ON c.employee_id = e.id AND c.status = 'active'
        WHERE e.status = 'active'
          AND e.telegram_chat_id IS NOT NULL
          AND (c.end_date::date - CURRENT_DATE) BETWEEN 28 AND 32
      `);
      return rows.rows as Row[];
    }, 'DB_ERROR');
  }

  async getOffboardingDueEmployees(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT oc.employee_id, oc.id AS case_id,
               e.first_name || ' ' || e.last_name AS full_name,
               e.telegram_chat_id
        FROM offboarding_cases oc
        JOIN employees e ON e.id = oc.employee_id
        WHERE oc.status = 'active'
          AND oc.last_working_day IS NOT NULL
          AND oc.last_working_day::date <= CURRENT_DATE
          AND e.status NOT IN ('terminated', 'blocked')
      `);
      return rows.rows as Row[];
    }, 'DB_ERROR');
  }

  async getUnrecognizedByCameraToday(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT e.id, e.telegram_chat_id
        FROM employees e
        WHERE e.status = 'active'
          AND e.telegram_chat_id IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM attendance_logs al
            WHERE al.employee_id = e.id
              AND al.date = CURRENT_DATE
              AND al.source = 'camera'
          )
      `);
      return rows.rows as Row[];
    }, 'DB_ERROR');
  }

  async getCoursesDeadlineIn3Days(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT ec.employee_id, e.telegram_chat_id,
               e.first_name, e.last_name,
               c.title AS course_title, c.url AS course_url,
               ec.deadline, ec.progress,
               (ec.deadline::date - CURRENT_DATE) AS days_left
        FROM employee_courses ec
        JOIN employees e ON e.id = ec.employee_id
        JOIN courses c ON c.id = ec.course_id
        WHERE ec.status != 'completed'
          AND ec.deadline IS NOT NULL
          AND e.telegram_chat_id IS NOT NULL
          AND (ec.deadline::date - CURRENT_DATE) = 3
          AND ec.is_mandatory = true
      `);
      return rows.rows as Row[];
    }, 'DB_ERROR');
  }

  async getEmergencyRecipients(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT DISTINCT e.id, e.telegram_chat_id, e.phone
        FROM employees e
        LEFT JOIN app_users u ON u.employee_id = e.id
        WHERE e.status = 'active'
          AND (
            u.role IN ('admin', 'hr', 'director')
            OR e.is_department_head = true
          )
      `);
      return rows.rows as Row[];
    }, 'DB_ERROR');
  }

  async getBoomerangCandidates(since: string): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT c.id,
               c.name,
               c.phone,
               c.telegram_chat_id,
               COALESCE(c.desired_position, c.last_position, '') AS position_hint,
               COALESCE(c.department_name, '')                   AS department_hint,
               COALESCE(c.skills, '')                            AS skills_hint
        FROM candidates c
        WHERE c.is_archived = true
          AND c.updated_at >= ${since}
          AND (c.telegram_chat_id IS NOT NULL OR c.phone IS NOT NULL)
        LIMIT 500
      `);
      return rows.rows as Row[];
    }, 'DB_ERROR');
  }

  async getAbsentEmployees(consecutiveDays: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT e.id, e.first_name, e.last_name, e.telegram_chat_id,
               COUNT(al.id) AS absent_days
        FROM employees e
        JOIN attendance_logs al ON al.employee_id = e.id
          AND al.status IN ('absent', 'no_show')
          AND al.date >= CURRENT_DATE - (INTERVAL '1 day' * ${consecutiveDays})
        WHERE e.status = 'active'
          AND e.telegram_chat_id IS NOT NULL
        GROUP BY e.id, e.first_name, e.last_name, e.telegram_chat_id
        HAVING COUNT(al.id) = ${consecutiveDays}
      `);
      return rows.rows as Row[];
    }, 'DB_ERROR');
  }

  async archiveInactiveFunnels(): Promise<Result<number>> {
    return safeCall(async () => {
      const rows = await runQuery<{ id: number }>(sql`
        UPDATE hr_candidate_funnels
        SET is_archived = true, is_active = false, updated_at = NOW()
        WHERE NOT COALESCE(is_archived, false)
          AND funnel_stage = 'REJECTED'
          AND rejected_at IS NOT NULL
          AND rejected_at < NOW() - INTERVAL '6 months'
        RETURNING id
      `);
      return rows.rows.length;
    }, 'DB_ERROR');
  }

  async archiveInactiveCandidates(): Promise<Result<number>> {
    return safeCall(async () => {
      const rows = await runQuery<{ id: number }>(sql`
        UPDATE candidates
        SET is_archived = true, updated_at = NOW()
        WHERE is_archived = false
          AND NOT EXISTS (
            SELECT 1 FROM hr_candidate_funnels f
            WHERE f.candidate_id = candidates.id
              AND (f.is_active = true OR f.funnel_stage = 'HIRED')
          )
          AND updated_at < NOW() - INTERVAL '6 months'
        RETURNING id
      `);
      return rows.rows.length;
    }, 'DB_ERROR');
  }
}
