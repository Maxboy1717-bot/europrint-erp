/**
 * @module employees-compat-profile.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { rawSql, db } from '@shared/db';
import {
  employee_daily_reports,
  employee_contracts,
  hr_leave_requests,
  employee_inventory_ledger,
  employee_files,
} from '@shared/db';
import { sql, eq, and, or, desc } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result, AppError } from '@common/result';

type Row = Record<string, unknown>;
const si = (v: unknown, d = 0) => parseInt(String(v ?? ''), 10) || d;

@Injectable()
export class EmployeesCompatProfileService {
  // ─── Complex queries (JOINs / aggregates) — kept as raw SQL ─────────────

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
        INSERT INTO employee_skills (employee_id, skill_id, level)
        VALUES (${si(employeeId)}, ${body['skill_id'] ?? body['skillId'] ?? null}, ${body['level'] ?? 'beginner'})
        ON CONFLICT (employee_id, skill_id) DO UPDATE SET level = EXCLUDED.level
        RETURNING id, employee_id, skill_id, level, created_at
      `);
      const item = dbRows(r)[0] as Row | undefined;
      if (!item) throw new InternalServerErrorException('Skill creation failed');
      return item;
    });
  }

  async createEmergencyContact(employeeId: string, body: Row): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        INSERT INTO employee_emergency_contacts (employee_id, contact_name, relationship, phone)
        VALUES (${si(employeeId)}, ${body['contact_name'] ?? body['contactName'] ?? body['name'] ?? ''}, ${body['relationship'] ?? null}, ${body['phone'] ?? null})
        RETURNING id, employee_id, contact_name, relationship, phone, created_at
      `);
      const item = dbRows(r)[0] as Row | undefined;
      if (!item) throw new InternalServerErrorException('Emergency contact creation failed');
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

  async createSalaryHistory(employeeId: string, body: Row): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        INSERT INTO salary_history (employee_id, salary_period_start, salary_period_end, base_salary, salary_earned, total_bonuses, other_bonuses)
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

  // ─── Simple queries converted to Drizzle ORM ────────────────────────────

  async getMonthlyReport(id: string): Promise<Result<Row | null, AppError>> {
    return safeCall(async () => {
      const rows = await db.select()
        .from(employee_daily_reports)
        .where(eq(employee_daily_reports.employee_id, si(id)))
        .orderBy(desc(employee_daily_reports.report_date))
        .limit(1);
      return (rows[0] as Row | undefined) ?? null;
    });
  }

  async getContracts(id: string): Promise<Result<Row[], AppError>> {
    return safeCall(async () => {
      const rows = await db.select()
        .from(employee_contracts)
        .where(eq(employee_contracts.employee_id, si(id)))
        .orderBy(desc(employee_contracts.created_at))
        .limit(20);
      return rows as Row[];
    });
  }

  async getLeaveRequests(id: string): Promise<Result<Row[], AppError>> {
    return safeCall(async () => {
      const rows = await db.select()
        .from(hr_leave_requests)
        .where(eq(hr_leave_requests.employee_id, si(id)))
        .orderBy(desc(hr_leave_requests.requested_at))
        .limit(50);
      return rows as Row[];
    });
  }

  async getCorporateInventory(id: string): Promise<Result<Row[], AppError>> {
    return safeCall(async () => {
      const rows = await db.select()
        .from(employee_inventory_ledger)
        .where(eq(employee_inventory_ledger.employee_id, si(id)))
        .orderBy(desc(employee_inventory_ledger.created_at))
        .limit(50);
      return rows as Row[];
    });
  }

  async getFiles(id: string): Promise<Result<Row[], AppError>> {
    return safeCall(async () => {
      const rows = await db.select()
        .from(employee_files)
        .where(eq(employee_files.employee_id, si(id)))
        .orderBy(desc(employee_files.created_at))
        .limit(50);
      return rows as Row[];
    });
  }

  async createContract(employeeId: string, body: Row): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const [item] = await db.insert(employee_contracts)
        .values({
          employee_id:     si(employeeId),
          contract_number: String(body['contract_number'] ?? body['contractNumber'] ?? `EC-${Date.now()}`),
          contract_type:   String(body['contract_type'] ?? body['contractType'] ?? 'standard'),
          start_date:      (body['start_date'] ?? body['startDate'] ?? null) as string | null,
          end_date:        (body['end_date'] ?? body['endDate'] ?? null) as string | null,
          status:          String(body['status'] ?? 'active'),
        })
        .returning();
      if (!item) throw new InternalServerErrorException('Contract creation failed');
      return item as Row;
    });
  }

  async createCorporateInventory(employeeId: string, body: Row): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const [item] = await db.insert(employee_inventory_ledger)
        .values({
          employee_id: si(employeeId),
          item_id:     (body['item_id'] ?? body['itemId'] ?? null) as number | null,
          quantity:    Number(body['quantity'] ?? 1),
          type:        String(body['type'] ?? 'issue'),
        })
        .returning();
      if (!item) throw new InternalServerErrorException('Corporate inventory creation failed');
      return item as Row;
    });
  }

  async patchCorporateInventoryReturn(employeeId: string, itemId: string): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const rows = await db.update(employee_inventory_ledger)
        .set({ type: 'return' })
        .where(and(
          eq(employee_inventory_ledger.id, si(itemId)),
          eq(employee_inventory_ledger.employee_id, si(employeeId)),
        ))
        .returning();
      return (rows[0] as Row | undefined) ?? { id: itemId, type: 'return' };
    });
  }

  async patchCorporateInventorySign(employeeId: string, itemId: string): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const rows = await db.update(employee_inventory_ledger)
        .set({ type: 'signed' })
        .where(and(
          eq(employee_inventory_ledger.id, si(itemId)),
          eq(employee_inventory_ledger.employee_id, si(employeeId)),
        ))
        .returning();
      return (rows[0] as Row | undefined) ?? { id: itemId, type: 'signed' };
    });
  }

  async createLeaveRequest(employeeId: string, body: Row): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const [item] = await db.insert(hr_leave_requests)
        .values({
          employee_id:  si(employeeId),
          start_date:   (body['start_date'] ?? body['startDate'] ?? null) as string | null,
          end_date:     (body['end_date'] ?? body['endDate'] ?? null) as string | null,
          reason:       (body['reason'] ?? null) as string | null,
          status:       String(body['status'] ?? 'pending'),
          requested_at: new Date(),
        })
        .returning();
      if (!item) throw new InternalServerErrorException('Leave request creation failed');
      return item as Row;
    });
  }

  async createSickLeave(employeeId: string, body: Row): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const [item] = await db.insert(hr_leave_requests)
        .values({
          employee_id:  si(employeeId),
          start_date:   (body['start_date'] ?? body['startDate'] ?? null) as string | null,
          end_date:     (body['end_date'] ?? body['endDate'] ?? null) as string | null,
          reason:       String(body['reason'] ?? 'sick'),
          status:       String(body['status'] ?? 'pending'),
          requested_at: new Date(),
        })
        .returning();
      if (!item) throw new InternalServerErrorException('Sick leave creation failed');
      return item as Row;
    });
  }
}
