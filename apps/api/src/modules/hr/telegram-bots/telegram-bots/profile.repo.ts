/**
 * @module telegram-bots/profile.repo
 * @description Employee profile, leaderboard, courses, certificates, evaluations, inventory, HR cron queries.
 */

import { Injectable } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class TelegramBotsProfileRepo {
  async getEmployeeCourses(employeeId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT c.id, c.title, ec.progress, ec.deadline, ec.status
        FROM employee_courses ec
        JOIN courses c ON c.id = ec.course_id
        WHERE ec.employee_id = ${employeeId}
        ORDER BY ec.deadline ASC NULLS LAST
        LIMIT 20
      `);
      return rows.rows as Row[];
    }, 'DB_ERROR');
  }

  async getEmployeeCertificates(employeeId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT cert.id, cert.name, cert.issued_at, cert.pdf_url
        FROM employee_certificates cert
        WHERE cert.employee_id = ${employeeId}
        ORDER BY cert.issued_at DESC
        LIMIT 20
      `);
      return rows.rows as Row[];
    }, 'DB_ERROR');
  }

  async getEmployeeProfileByChatId(chatId: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT e.id, e.first_name, e.last_name, e.middle_name,
               e.employee_code, e.phone_number, e.corporate_email,
               e.hire_date, e.status, e.is_department_head,
               primary_org.pos_name  AS position_name,
               primary_org.dept_name AS department_name,
               COALESCE(gt.total_points, 0)   AS total_points,
               COALESCE(gt.monthly_points, 0) AS monthly_points
        FROM employees e
        LEFT JOIN users u ON u.employee_id = e.id AND u.deleted_at IS NULL
        LEFT JOIN LATERAL (
          SELECT eod.org_department_id AS dept_id,
                 od.name AS dept_name,
                 COALESCE(of2.position_name, '') AS pos_name
          FROM employee_org_departments eod
          JOIN org_departments od ON od.id = eod.org_department_id
          LEFT JOIN org_functions of2 ON of2.org_department_id = eod.org_department_id
          WHERE eod.user_id = u.id AND eod.is_primary = true
          ORDER BY eod.assigned_at DESC
          LIMIT 1
        ) primary_org ON true
        LEFT JOIN gamification_totals gt ON gt.employee_id = e.id
        WHERE e.telegram_chat_id = ${String(chatId)}
          AND e.status = 'active'
        LIMIT 1
      `);
      return (rows.rows[0] ?? null) as Row | null;
    }, 'DB_ERROR');
  }

  async getLeaderboard(limit = 10): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT e.id, e.first_name, e.last_name, e.employee_code,
               primary_org.dept_name AS department_name,
               COALESCE(gt.monthly_points, 0) AS monthly_points,
               COALESCE(gt.total_points,   0) AS total_points,
               COALESCE(gt.badge_count,    0) AS badge_count
        FROM gamification_totals gt
        JOIN employees e ON e.id = gt.employee_id
        LEFT JOIN users u ON u.employee_id = e.id AND u.deleted_at IS NULL
        LEFT JOIN LATERAL (
          SELECT eod.org_department_id AS dept_id,
                 od.name AS dept_name,
                 COALESCE(of2.position_name, '') AS pos_name
          FROM employee_org_departments eod
          JOIN org_departments od ON od.id = eod.org_department_id
          LEFT JOIN org_functions of2 ON of2.org_department_id = eod.org_department_id
          WHERE eod.user_id = u.id AND eod.is_primary = true
          ORDER BY eod.assigned_at DESC
          LIMIT 1
        ) primary_org ON true
        WHERE e.status = 'active'
        ORDER BY gt.monthly_points DESC NULLS LAST
        LIMIT ${limit}
      `);
      return rows.rows as Row[];
    }, 'DB_ERROR');
  }

  async getEmployeeEvaluations(employeeId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT 'kpi' AS eval_type,
               ek.period_label AS period,
               ek.score        AS score,
               ek.grade        AS grade,
               ek.created_at   AS evaluated_at
        FROM employee_kpi ek
        WHERE ek.employee_id = ${employeeId}
        ORDER BY ek.created_at DESC
        LIMIT 5
      `);
      return rows.rows as Row[];
    }, 'DB_ERROR');
  }

  async getEmployeeInventory(employeeId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT ii.name AS item_name, ii.code AS item_code,
               pi.quantity, pi.unit, pi.assigned_at
        FROM pos_inventory_items pi
        JOIN inventory_items ii ON ii.id = pi.item_id
        WHERE pi.employee_id = ${employeeId}
          AND pi.quantity > 0
        ORDER BY pi.assigned_at DESC
        LIMIT 20
      `);
      return rows.rows as Row[];
    }, 'DB_ERROR');
  }

  async getRecruiterChatIds(): Promise<Result<string[]>> {
    return safeCall(async () => {
      const rows = await runQuery<{ telegram_chat_id: string }>(sql`
        SELECT DISTINCT e.telegram_chat_id
        FROM employees e
        LEFT JOIN app_users u ON u.employee_id = e.id
        WHERE e.status = 'active'
          AND e.telegram_chat_id IS NOT NULL
          AND (
            u.role IN ('hr_recruiter', 'hr', 'hr_manager')
            OR e.is_department_head = true
          )
        LIMIT 50
      `);
      return rows.rows.map(r => r.telegram_chat_id).filter(Boolean);
    }, 'DB_ERROR');
  }

  async getInterviewsPendingDecision(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT f.id, f.candidate_name, v.title AS vacancy_title,
               i.interview_date,
               (i.interview_date + INTERVAL '48 hours') AS deadline,
               rec.telegram_chat_id AS recruiter_chat_id
        FROM hr_candidate_funnels f
        JOIN vacancies v ON v.id = f.vacancy_id
        JOIN interviews i ON i.funnel_id = f.id AND i.status = 'completed'
        LEFT JOIN employees rec ON rec.id = v.responsible_recruiter_id
        WHERE f.funnel_stage = 'AI_STAGE_2'
          AND i.interview_date BETWEEN NOW() - INTERVAL '47 hours' AND NOW() - INTERVAL '46 hours'
          AND rec.telegram_chat_id IS NOT NULL
      `);
      return rows.rows as Row[];
    }, 'DB_ERROR');
  }

  async getAdaptationRisks(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT ac.employee_id, ac.risk_level, ac.adaptation_day, ac.risk_reason,
               e.first_name || ' ' || e.last_name AS employee_name,
               e.telegram_chat_id,
               m.telegram_chat_id AS manager_chat_id
        FROM hr_adaptation_cases ac
        JOIN employees e ON e.id = ac.employee_id
        LEFT JOIN employees m ON m.id = e.manager_id
        WHERE ac.status = 'active'
          AND ac.risk_level IN ('high', 'medium')
          AND ac.notified_at < NOW() - INTERVAL '1 day'
        LIMIT 50
      `);
      return rows.rows as Row[];
    }, 'DB_ERROR');
  }

  async getActivePipWithPendingGoals(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT pp.employee_id, pp.due_date,
               COUNT(pg.id) FILTER (WHERE pg.status = 'pending') AS pending_goals,
               e.telegram_chat_id
        FROM pip_plans pp
        JOIN employees e ON e.id = pp.employee_id
        LEFT JOIN pip_goals pg ON pg.pip_plan_id = pp.id
        WHERE pp.status = 'active' AND e.telegram_chat_id IS NOT NULL
        GROUP BY pp.employee_id, pp.due_date, e.telegram_chat_id
        HAVING COUNT(pg.id) FILTER (WHERE pg.status = 'pending') > 0
        LIMIT 100
      `);
      return rows.rows as Row[];
    }, 'DB_ERROR');
  }
}
