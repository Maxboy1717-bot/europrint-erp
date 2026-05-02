import { Injectable } from '@nestjs/common';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result, AppError } from '@common/result';

type Row = Record<string, unknown>;
const si = (v: unknown, d = 0) => parseInt(String(v ?? ''), 10) || d;

@Injectable()
export class EmployeesCompatProfileService {
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
          SELECT es.id, es.employee_id, es.skill_id, es.level, es.created_at,
                 sc.name AS skill_name, sc.category
          FROM employee_skills es
          LEFT JOIN skill_catalog sc ON sc.id = es.skill_id
          WHERE es.employee_id = ${si(id)}
          ORDER BY sc.category, sc.name LIMIT 50
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

  async getMonthlyReport(id: string): Promise<Result<Row | null, AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT edr.id, edr.employee_id, edr.report_date, edr.data, edr.created_at
        FROM employee_daily_reports edr
        WHERE edr.employee_id = ${si(id)}
        ORDER BY edr.report_date DESC LIMIT 1
      `);
      const row = dbRows(r)[0] as Row | undefined;
      return row ?? null;
    });
  }

  async getOrgStructure(id: string): Promise<Result<{ manager: Row | null; subordinates: Row[]; peers: Row[] }, AppError>> {
    return safeCall(async () => {
      const empR = await rawSql(sql`
        SELECT e.department_id FROM employees e WHERE e.id = ${si(id)} LIMIT 1
      `);
      const emp = dbRows(empR)[0] as Row | undefined;
      const deptId = emp?.['department_id'];
      const peersR = deptId
        ? await rawSql(sql`
            SELECT e.id, e.first_name, e.last_name, e.employee_code,
                   COALESCE(p.name, p.name_uz) AS position_name
            FROM employees e
            LEFT JOIN positions p ON p.id = e.position_id
            WHERE e.department_id = ${deptId} AND e.id != ${si(id)} AND e.status = 'active'
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
        FROM salary_history sh
        WHERE sh.employee_id = ${si(id)}
        ORDER BY sh.salary_period_start DESC LIMIT 50
      `);
      return dbRows(r) as Row[];
    });
  }

  async getContracts(id: string): Promise<Result<Row[], AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT ec.id, ec.employee_id, ec.contract_number, ec.contract_type,
               ec.start_date, ec.end_date, ec.status, ec.created_at
        FROM employee_contracts ec
        WHERE ec.employee_id = ${si(id)}
        ORDER BY ec.created_at DESC LIMIT 20
      `);
      return dbRows(r) as Row[];
    });
  }

  async getLeaveRequests(id: string): Promise<Result<Row[], AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT lr.id, lr.employee_id, lr.start_date, lr.end_date,
               lr.reason, lr.status, lr.requested_at, lr.notes
        FROM hr_leave_requests lr
        WHERE lr.employee_id = ${si(id)}
        ORDER BY lr.requested_at DESC LIMIT 50
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

  async getCorporateInventory(id: string): Promise<Result<Row[], AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT eil.id, eil.employee_id, eil.item_id, eil.quantity, eil.type, eil.created_at
        FROM employee_inventory_ledger eil
        WHERE eil.employee_id = ${si(id)}
        ORDER BY eil.created_at DESC LIMIT 50
      `);
      return dbRows(r) as Row[];
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

  async getFiles(id: string): Promise<Result<Row[], AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT ef.id, ef.employee_id, ef.file_type, ef.file_name, ef.file_url, ef.created_at
        FROM employee_files ef
        WHERE ef.employee_id = ${si(id)}
        ORDER BY ef.created_at DESC LIMIT 50
      `);
      return dbRows(r) as Row[];
    });
  }
}
