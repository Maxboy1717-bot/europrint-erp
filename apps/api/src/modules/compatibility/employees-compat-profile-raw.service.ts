/**
 * @deprecated 2026-05-27
 * This file is a compatibility shim. Do NOT add new features here.
 * Canonical replacement: `apps/api/src/modules/hr/application/hr-employees-ext.service.ts`
 * Existing consumers continue to work. New code must import from the canonical file.
 * See: docs/modules/hr-employees.md
 */
/**
 * @module employees-compat-profile-raw.service
 * @description Raw-SQL part of `EmployeesCompatProfileService` — career, capital,
 *   org-structure, salary history, sick leaves, emergency contacts, passport.
 *   Kept separate so the parent service file stays under 300 lines (Rule 16).
 *   Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result, AppError } from '@common/result';

type Row = Record<string, unknown>;
const si = (v: unknown, d = 0) => parseInt(String(v ?? ''), 10) || d;

@Injectable()
export class EmployeesCompatProfileRawService {

  async getCareer(id: string): Promise<Result<{ history: Row[]; goals: Row[] }, AppError>> {
    return safeCall(async () => {
      const [histR, goalsR] = await Promise.all([
        rawSql(sql`
          SELECT cp.id, cp.employee_id, cp.current_position_id, cp.target_position_id,
                 cp.estimated_months, cp.progress_percent, cp.status, cp.created_at,
                 COALESCE(p1.name, p1.name_uz) AS current_position_name,
                 COALESCE(p2.name, p2.name_uz) AS target_position_name
          FROM career_paths cp
          LEFT JOIN positions p1 ON p1.id = cp.current_position_id
          LEFT JOIN positions p2 ON p2.id = cp.target_position_id
          WHERE cp.employee_id = ${si(id)}
          ORDER BY cp.created_at DESC LIMIT 20
        `),
        rawSql(sql`
          SELECT rg.id, rg.employee_id, rg.title, rg.description, rg.status,
                 rg.due_date, rg.progress, rg.created_at
          FROM employee_rating_goals rg
          WHERE rg.employee_id = ${si(id)}
          ORDER BY rg.created_at DESC LIMIT 20
        `),
      ]);
      return { history: dbRows(histR) as Row[], goals: dbRows(goalsR) as Row[] };
    });
  }

  async getCapitalProfile(id: string): Promise<Result<Row | null, AppError>> {
    return safeCall(async () => {
      const [ratR, sklR] = await Promise.all([
        rawSql(sql`
          SELECT AVG(er.score)::numeric(5,2) AS avg_score,
                 COUNT(*) AS total_ratings, MAX(er.created_at) AS last_rated
          FROM employee_ratings er
          WHERE er.employee_id = ${si(id)}
        `),
        rawSql(sql`
          SELECT es.id, es.employee_id, es.skill_name,
                 es.proficiency_level AS level, es.proficiency_score,
                 es.skill_category AS category, es.created_at
          FROM employee_skills es
          WHERE es.employee_id = ${si(id)}
          ORDER BY es.skill_category, es.skill_name LIMIT 50
        `),
      ]);
      const ratingRow = dbRows(ratR)[0] ?? {};
      const skills = dbRows(sklR) as Row[];
      return {
        avgScore:    ratingRow['avg_score'] ?? null,
        totalRatings: Number(ratingRow['total_ratings'] ?? 0),
        lastRated:   ratingRow['last_rated'] ?? null,
        skills,
      };
    });
  }

  async getOrgStructure(id: string): Promise<Result<{ manager: Row | null; subordinates: Row[]; peers: Row[] }, AppError>> {
    return safeCall(async () => {
      // Find the primary org department of this employee via their user record
      const orgDeptR = await rawSql(sql`
        SELECT eod.org_department_id
        FROM users u
        JOIN employee_org_departments eod ON eod.user_id = u.id AND eod.is_primary = true
        WHERE u.employee_id = ${si(id)} AND u.deleted_at IS NULL
        ORDER BY eod.assigned_at DESC
        LIMIT 1
      `);
      const orgDeptRow = dbRows(orgDeptR)[0] as Row | undefined;
      const orgDeptId = orgDeptRow?.['org_department_id'];

      const peersR = orgDeptId
        ? await rawSql(sql`
            SELECT e.id, e.first_name, e.last_name, e.employee_code,
                   COALESCE(of2.position_name, '') AS position_name
            FROM employees e
            JOIN users u ON u.employee_id = e.id AND u.deleted_at IS NULL
            JOIN employee_org_departments eod ON eod.user_id = u.id AND eod.is_primary = true
            LEFT JOIN org_functions of2 ON of2.department_id = eod.org_department_id
            WHERE eod.org_department_id = ${orgDeptId} AND e.id != ${si(id)} AND e.status = 'active'
            ORDER BY e.first_name LIMIT 20
          `)
        : null;

      return {
        manager:      null,
        subordinates: [],
        peers:        peersR ? (dbRows(peersR) as Row[]) : [],
      };
    });
  }

  async getSalaryHistory(id: string): Promise<Result<Row[], AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT sh.id, sh.employee_id, sh.salary_period_start, sh.salary_period_end,
               sh.base_salary, sh.salary_earned, sh.total_bonuses, sh.other_bonuses, sh.created_at
        FROM payroll_period_record sh
        WHERE sh.employee_id = ${si(id)}
        ORDER BY sh.salary_period_start DESC LIMIT 50
      `);
      return dbRows(r) as Row[];
    });
  }

  async getSickLeaves(id: string): Promise<Result<Row[], AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT lr.id, lr.employee_id, lr.start_date, lr.end_date,
               lr.reason, lr.status, lr.requested_at, lr.notes
        FROM hr_leave_requests lr
        WHERE lr.employee_id = ${si(id)}
          AND (lr.reason ILIKE '%sick%' OR lr.reason ILIKE '%kasal%' OR lr.reason ILIKE '%ill%')
        ORDER BY lr.requested_at DESC LIMIT 50
      `);
      return dbRows(r) as Row[];
    });
  }

  async createCareer(employeeId: string, body: Row): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        INSERT INTO career_paths (employee_id, current_position_id, target_position_id, estimated_months, progress_percent, status)
        VALUES (${si(employeeId)}, ${body['current_position_id'] ?? body['currentPositionId'] ?? null}, ${body['target_position_id'] ?? body['targetPositionId'] ?? null}, ${body['estimated_months'] ?? body['estimatedMonths'] ?? null}, ${body['progress_percent'] ?? body['progressPercent'] ?? 0}, ${body['status'] ?? 'active'})
        RETURNING id, employee_id, current_position_id, target_position_id, estimated_months, progress_percent, status, created_at
      `);
      const item = dbRows(r)[0] as Row | undefined;
      if (!item) throw new InternalServerErrorException('Career path creation failed');
      return item;
    });
  }

  async createCapitalProfile(employeeId: string, body: Row): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        INSERT INTO employee_skills (employee_id, skill_name, skill_category, proficiency_level)
        VALUES (${si(employeeId)}, ${body['skill_name'] ?? body['skillName'] ?? null}, ${body['skill_category'] ?? body['category'] ?? 'general'}, ${body['level'] ?? body['proficiencyLevel'] ?? 'beginner'})
        RETURNING id, employee_id, skill_name, skill_category, proficiency_level, created_at
      `);
      const item = dbRows(r)[0] as Row | undefined;
      if (!item) throw new InternalServerErrorException('Skill creation failed');
      return item;
    });
  }

  async createEmergencyContact(employeeId: string, body: Row): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      // FIX (iter-77 drift catalog #19): the INSERT wrote nonexistent column `phone` (real col is
      // phone_number) → 42703, and omitted NOT-NULL user_id + phone_number → 23502. Also the FE
      // (EmergencyContactCard) sends camelCase phoneNumber/contactName, not `phone`. user_id is the
      // canonical NOT-NULL FK (users table) — resolve it from the employee via INSERT..SELECT.
      const contactName = body['contactName'] ?? body['contact_name'] ?? body['name'] ?? '';
      const relationship = body['relationship'] ?? '';
      const phoneNumber = body['phoneNumber'] ?? body['phone_number'] ?? body['phone'] ?? '';
      const altPhone    = body['alternativePhone'] ?? body['alternative_phone'] ?? null;
      const r = await rawSql(sql`
        INSERT INTO employee_emergency_contacts (user_id, employee_id, contact_name, relationship, phone_number, alternative_phone)
        SELECT u.id, ${si(employeeId)}, ${contactName}, ${relationship}, ${phoneNumber}, ${altPhone}
        FROM users u WHERE u.employee_id = ${si(employeeId)} LIMIT 1
        RETURNING id, user_id, employee_id, contact_name, relationship, phone_number, created_at
      `);
      const item = dbRows(r)[0] as Row | undefined;
      if (!item) throw new InternalServerErrorException('Emergency contact creation failed (no user for employee)');
      return item;
    });
  }

  async createPassport(employeeId: string, body: Row): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        UPDATE employees SET passport_series = COALESCE(${body['passport_series'] ?? body['passportSeries'] ?? null}, passport_series),
          passport_number = COALESCE(${body['passport_number'] ?? body['passportNumber'] ?? null}, passport_number),
          updated_at = NOW()
        WHERE id = ${si(employeeId)}
        RETURNING id, passport_series, passport_number, updated_at
      `);
      return (dbRows(r)[0] as Row | undefined) ?? { id: employeeId, updated: true };
    });
  }

  /**
   * Payroll summary — payroll_period_record dan agregat (so'nggi 12 oy).
   * Frontend payroll-summary'ni xodim profilida ko'rsatadi.
   */
  async getPayrollSummary(id: string): Promise<Result<Row | null, AppError>> {
    return safeCall(async () => {
      const [aggR, lastR] = await Promise.all([
        this.fetchPayrollAggregate(id),
        this.fetchLatestSalaryHistory(id),
      ]);
      const agg = dbRows(aggR)[0] as Row | undefined;
      if (!agg || Number(agg['total_periods'] ?? 0) === 0) return null;
      return {
        totalPeriods:  Number(agg['total_periods'] ?? 0),
        totalBase:     agg['total_base'] ?? '0',
        totalEarned:   agg['total_earned'] ?? '0',
        totalBonuses:  agg['total_bonuses'] ?? '0',
        avgEarned:     agg['avg_earned'] ?? '0',
        firstPeriod:   agg['first_period'] ?? null,
        lastPeriod:    agg['last_period'] ?? null,
        latest:        dbRows(lastR)[0] ?? null,
      };
    });
  }

  private fetchPayrollAggregate(id: string) {
    return rawSql(sql`
      SELECT
        COUNT(*)::int                                AS total_periods,
        COALESCE(SUM(base_salary), 0)::numeric(15,2) AS total_base,
        COALESCE(SUM(salary_earned), 0)::numeric(15,2) AS total_earned,
        COALESCE(SUM(total_bonuses), 0)::numeric(15,2) AS total_bonuses,
        COALESCE(AVG(salary_earned), 0)::numeric(15,2) AS avg_earned,
        MIN(salary_period_start)                     AS first_period,
        MAX(salary_period_end)                       AS last_period
      FROM payroll_period_record
      WHERE employee_id = ${si(id)}
        AND salary_period_start >= NOW() - INTERVAL '12 months'
    `);
  }

  private fetchLatestSalaryHistory(id: string) {
    return rawSql(sql`
      SELECT id, employee_id, salary_period_start, salary_period_end,
             base_salary, salary_earned, total_bonuses, other_bonuses
      FROM payroll_period_record
      WHERE employee_id = ${si(id)}
      ORDER BY salary_period_start DESC NULLS LAST, created_at DESC
      LIMIT 1
    `);
  }

  async createSalaryHistory(employeeId: string, body: Row): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        INSERT INTO payroll_period_record (employee_id, salary_period_start, salary_period_end, base_salary, salary_earned, total_bonuses, other_bonuses)
        VALUES (${si(employeeId)}, ${body['salary_period_start'] ?? body['salaryPeriodStart'] ?? body['period'] ?? new Date().toISOString().slice(0,7) + '-01'}, ${body['salary_period_end'] ?? body['salaryPeriodEnd'] ?? null}, ${body['base_salary'] ?? body['baseSalary'] ?? 0}, ${body['salary_earned'] ?? body['salaryEarned'] ?? 0}, ${body['total_bonuses'] ?? body['totalBonuses'] ?? 0}, ${body['other_bonuses'] ?? body['otherBonuses'] ?? 0})
        RETURNING id, employee_id, salary_period_start, salary_period_end, base_salary, salary_earned, created_at
      `);
      const item = dbRows(r)[0] as Row | undefined;
      if (!item) throw new InternalServerErrorException('Salary history creation failed');
      return item;
    });
  }

  async getEmergencyContacts(id: string): Promise<Result<Row[], AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT id, employee_id, contact_name, relationship, phone, created_at
        FROM employee_emergency_contacts
        WHERE employee_id = ${si(id)}
        ORDER BY created_at DESC LIMIT 10
      `);
      return dbRows(r) as Row[];
    });
  }
}
