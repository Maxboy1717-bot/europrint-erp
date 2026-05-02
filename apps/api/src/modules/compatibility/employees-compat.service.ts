import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { MAX_QUERY_LIMIT, MAX_LARGE_QUERY_LIMIT } from '@common/constants/app.constants';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result, AppError } from '@common/result';
import { EmployeesCompatProfileService } from './employees-compat-profile.service';
import { EmployeesCompatFinancialsService } from './employees-compat-financials.service';

type Row = Record<string, unknown>;
const si = (v: unknown, d = 0) => parseInt(String(v ?? ''), 10) || d;

@Injectable()
export class EmployeesCompatService {
  constructor(
    private readonly profile: EmployeesCompatProfileService,
    private readonly financials: EmployeesCompatFinancialsService,
  ) {}

  async listEmployees(status?: string, departmentId?: string, search?: string, limit = '50', offset = '0'): Promise<Result<Row[], AppError>> {
    return safeCall(async () => {
      const lim = Math.min(si(limit, 50), MAX_QUERY_LIMIT);
      const off = si(offset, 0);
      const statusF = status ? sql`AND e.status = ${status}` : sql``;
      const deptF = departmentId ? sql`AND e.department_id = ${si(departmentId)}` : sql``;
      const searchF = search ? sql`AND (e.first_name ILIKE ${`%${search}%`} OR e.last_name ILIKE ${`%${search}%`} OR e.employee_code ILIKE ${`%${search}%`})` : sql``;
      const r = await rawSql(sql`
        SELECT e.id, e.first_name, e.last_name,
               COALESCE(e.email_work, e.email_personal, '') AS email,
               e.employee_code, e.status,
               e.phone_number AS phone, e.hire_date, e.photo_url,
               e.department_id, e.position_id,
               d.name AS department_name, COALESCE(p.name, p.name_uz) AS position_name
        FROM employees e
        LEFT JOIN departments d ON d.id = e.department_id
        LEFT JOIN positions p ON p.id = e.position_id
        WHERE e.status != 'terminated' ${statusF} ${deptF} ${searchF}
        ORDER BY e.first_name LIMIT ${lim} OFFSET ${off}
      `);
      return dbRows(r) as Row[];
    });
  }

  async getEmployee(id: string): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT e.id, e.first_name, e.last_name,
               COALESCE(e.email_work, e.email_personal, '') AS email,
               e.employee_code, e.status,
               e.phone_number AS phone, e.hire_date, e.photo_url,
               e.department_id, e.position_id,
               d.name AS department_name, COALESCE(p.name, p.name_uz) AS position_name
        FROM employees e
        LEFT JOIN departments d ON d.id = e.department_id
        LEFT JOIN positions p ON p.id = e.position_id
        WHERE e.id = ${si(id)}
      `);
      const item = dbRows(r)[0] as Row | undefined;
      if (!item) throw new NotFoundException(`Employee ${id} not found`);
      return item;
    });
  }

  async updateProfileImage(id: string, url: string | null | undefined, userId: number | undefined): Promise<Result<Row & { updatedBy: number | undefined }, AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        UPDATE employees SET photo_url = ${url ?? null}, updated_at = NOW()
        WHERE id = ${si(id)}
        RETURNING id, photo_url, updated_at
      `);
      const item = dbRows(r)[0] as Row | undefined;
      if (!item) throw new NotFoundException(`Employee ${id} not found`);
      return { ...item, updatedBy: userId };
    });
  }

  async assignOrgFunctions(id: string, body: { departmentId?: string | number; positionId?: string | number }): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        UPDATE employees
        SET department_id = COALESCE(${body.departmentId ?? null}, department_id),
            position_id   = COALESCE(${body.positionId ? si(body.positionId) : null}, position_id),
            updated_at    = NOW()
        WHERE id = ${si(id)}
        RETURNING id, department_id, position_id, updated_at
      `);
      const item = dbRows(r)[0] as Row | undefined;
      if (!item) throw new NotFoundException(`Employee ${id} not found`);
      return item;
    });
  }

  async importEmployees(employees: Record<string, unknown>[]): Promise<Result<{ imported: number; total: number; errors: string[] }, AppError>> {
    return safeCall(async () => {
      let imported = 0;
      const errors: string[] = [];
      for (const emp of employees) {
        try {
          await rawSql(sql`
            INSERT INTO employees (first_name, last_name, email, department_id, position_id, employee_code, status)
            VALUES (${emp['first_name'] ?? ''}, ${emp['last_name'] ?? ''}, ${emp['email'] ?? null},
                    ${emp['department_id'] ?? null}, ${emp['position_id'] ?? null},
                    ${emp['employee_code'] ?? `IMP-${Date.now()}-${imported}`}, 'active')
            ON CONFLICT (email) DO NOTHING
          `);
          imported++;
        } catch (e: unknown) {
          errors.push(`${emp['email'] ?? '?'}: ${(e as Error).message}`);
        }
      }
      return { imported, total: employees.length, errors };
    });
  }

  async getAssets(id: string): Promise<Result<Row[], AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT ea.id, ea.employee_id, ea.asset_type, ea.asset_name, ea.asset_code,
               ea.assigned_date, ea.return_date, ea.status, ea.notes, ea.created_at
        FROM employee_assets ea
        WHERE ea.employee_id = ${si(id)} AND ea.deleted_at IS NULL
        ORDER BY ea.assigned_date DESC
      `);
      return dbRows(r) as Row[];
    });
  }

  async assignAsset(id: string, body: Record<string, unknown>): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        INSERT INTO employee_assets (employee_id, asset_type, asset_name, asset_code, assigned_date, notes, status)
        VALUES (${si(id)}, ${body['asset_type'] ?? 'equipment'}, ${body['asset_name'] ?? ''},
                ${body['asset_code'] ?? null}, ${body['assigned_date'] ?? null}, ${body['notes'] ?? null}, 'assigned')
        RETURNING id, asset_name, status, created_at
      `);
      const item = dbRows(r)[0] as Row | undefined;
      if (!item) throw new InternalServerErrorException('Asset assignment failed');
      return item;
    });
  }

  async returnAsset(id: string, assetId: string): Promise<Result<void, AppError>> {
    return safeCall(async () => {
      await rawSql(sql`
        UPDATE employee_assets SET status = 'returned', return_date = NOW()::date, deleted_at = NOW()
        WHERE id = ${si(assetId)} AND employee_id = ${si(id)}
      `);
    });
  }

  async getSwapRequests(employeeId: string, status?: string): Promise<Result<Row[], AppError>> {
    return safeCall(async () => {
      const statusF = status ? sql`AND ss.status = ${status}` : sql``;
      const r = await rawSql(sql`
        SELECT ss.id, ss.employee_id, ss.shift_date, ss.shift_type, ss.start_time,
               ss.end_time, ss.status, ss.created_at,
               e.first_name || ' ' || e.last_name AS employee_name
        FROM shift_schedules ss
        JOIN employees e ON e.id = ss.employee_id
        WHERE ss.employee_id = ${si(employeeId)} ${statusF}
        ORDER BY ss.shift_date DESC LIMIT 50
      `);
      return dbRows(r) as Row[];
    });
  }

  async getComplaints(employeeId: string): Promise<Result<Row[], AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT cr.id, cr.party1, cr.party2, cr.description, cr.severity, cr.status, cr.created_at
        FROM hr_conflict_reports cr
        WHERE cr.party1::text = ${employeeId} OR cr.party2::text = ${employeeId}
        ORDER BY cr.created_at DESC LIMIT 50
      `);
      return dbRows(r) as Row[];
    });
  }

  async createComplaint(employeeId: string, body: Record<string, unknown>): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        INSERT INTO hr_conflict_reports (party1, party2, description, severity, status)
        VALUES (${employeeId}, ${body['party2'] ?? ''}, ${body['description'] ?? null}, ${body['severity'] ?? 'low'}, 'open')
        RETURNING id, severity, status, created_at
      `);
      const item = dbRows(r)[0] as Row | undefined;
      if (!item) throw new InternalServerErrorException('Complaint creation failed');
      return item;
    });
  }

  async getAssessmentSkips(employeeId: string): Promise<Result<Row[], AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT a.id, a.employee_id, a.assessment_period, a.assessment_year, a.status, a.created_at
        FROM employee_360_assessments a
        WHERE a.employee_id = ${si(employeeId)} AND a.status = 'skipped'
        ORDER BY a.created_at DESC LIMIT 50
      `);
      return dbRows(r) as Row[];
    });
  }

  async createEmployee(body: Record<string, unknown>): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const { first_name, last_name, email, department_id, position_id, employee_code } = body;
      if (!first_name || !last_name) throw new BadRequestException('first_name va last_name majburiy');
      const r = await rawSql(sql`
        INSERT INTO employees (first_name, last_name, email, department_id, position_id, employee_code, status, hire_date)
        VALUES (${first_name ?? ''}, ${last_name ?? ''}, ${email ?? null},
                ${department_id ? si(department_id) : null}, ${position_id ? si(position_id) : null}, ${employee_code ?? null}, 'active', NOW())
        RETURNING id, first_name, last_name, email, status
      `);
      const item = dbRows(r)[0] as Row | undefined;
      if (!item) throw new InternalServerErrorException('Employee creation failed');
      return item;
    });
  }

  async updateEmployee(id: string, body: Record<string, unknown>): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const { first_name, last_name, email, department_id, position_id, status } = body;
      const r = await rawSql(sql`
        UPDATE employees
        SET first_name = COALESCE(${first_name ?? null}, first_name),
            last_name = COALESCE(${last_name ?? null}, last_name),
            email = COALESCE(${email ?? null}, email),
            department_id = COALESCE(${si(department_id) || null}, department_id),
            position_id = COALESCE(${si(position_id) || null}, position_id),
            status = COALESCE(${status ?? null}, status),
            updated_at = NOW()
        WHERE id = ${si(id)}
        RETURNING id, first_name, last_name, email, status, updated_at
      `);
      const found = dbRows(r)[0] as Row | undefined;
      if (!found) throw new NotFoundException('Record not found');
      return found;
    });
  }

  async deleteEmployee(id: string): Promise<Result<void, AppError>> {
    return safeCall(async () => {
      await rawSql(sql`UPDATE employees SET status = 'terminated', updated_at = NOW() WHERE id = ${si(id)}`);
    });
  }

  async getEmployeesForFace(): Promise<Result<Row[], AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT id, first_name, last_name, photo_url, employee_code
        FROM employees WHERE status = 'active' ORDER BY first_name LIMIT ${MAX_LARGE_QUERY_LIMIT}
      `);
      return dbRows(r) as Row[];
    });
  }

  getCareer(id: string) { return this.profile.getCareer(id); }
  getCapitalProfile(id: string) { return this.profile.getCapitalProfile(id); }
  getMonthlyReport(id: string) { return this.profile.getMonthlyReport(id); }
  getOrgStructure(id: string) { return this.profile.getOrgStructure(id); }
  getSalaryHistory(id: string) { return this.profile.getSalaryHistory(id); }
  getContracts(id: string) { return this.profile.getContracts(id); }
  getLeaveRequests(id: string) { return this.profile.getLeaveRequests(id); }
  getSickLeaves(id: string) { return this.profile.getSickLeaves(id); }
  getCorporateInventory(id: string) { return this.profile.getCorporateInventory(id); }
  getEmergencyContacts(id: string) { return this.profile.getEmergencyContacts(id); }
  getFiles(id: string) { return this.profile.getFiles(id); }
  deleteEmployeeFile(employeeId: string, fileId: string) { return this.financials.deleteEmployeeFile(employeeId, fileId); }
  getFines(id: string) { return this.financials.getFines(id); }
  getCashAdvances(id: string) { return this.financials.getCashAdvances(id); }
  getBankAccounts(id: string) { return this.financials.getBankAccounts(id); }
  getBonuses(id: string) { return this.financials.getBonuses(id); }
  getBusinessTrips(id: string) { return this.financials.getBusinessTrips(id); }
  getOvertime(id: string) { return this.financials.getOvertime(id); }
  getAllAssessments(id: string) { return this.financials.getAllAssessments(id); }
  setPassword(id: string, body: Record<string, unknown>) { return this.financials.setPassword(id, body); }
}
