import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { MAX_QUERY_LIMIT, MAX_LARGE_QUERY_LIMIT } from '@common/constants/app.constants';
import { db, rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result, AppError } from '@common/result';
import { EmployeesCompatProfileService } from './employees-compat-profile.service';
import { EmployeesCompatFinancialsService } from './employees-compat-financials.service';
import { adaptEmployeePayload, validateEmployeeFks } from './employees-payload.adapter';
import {
  parseOrgDepartmentIds,
  validateOrgDepartmentsExist,
  syncEmployeeOrgAssignments,
  ensureUserForEmployee,
} from './employees-org-assignment.helper';

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

  /**
   * Xodim biriktirilgan barcha org_departments ID ro'yxati (edit dialog uchun).
   * `users.employee_id` orqali employee ↔ user, undan `employee_org_departments`.
   */
  async getEmployeeOrgDepartments(id: string): Promise<Result<{ orgDepartmentIds: string[] }, AppError>> {
    return safeCall(async () => {
      const empId = si(id);
      const r = await rawSql(sql`
        SELECT eod.org_department_id::text AS id
        FROM users u
        JOIN employee_org_departments eod ON eod.user_id = u.id
        WHERE u.employee_id = ${empId} AND u.deleted_at IS NULL
        ORDER BY eod.is_primary DESC, eod.org_department_id
      `);
      const ids = dbRows(r).map((row) => String(row['id']));
      return { orgDepartmentIds: Array.isArray(ids) ? ids : [] };
    });
  }

  async getEmployee(id: string): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT e.id::text AS id, e.first_name, e.last_name,
               COALESCE(e.email_work, e.email_personal, '') AS email,
               e.employee_code, e.status,
               e.phone_number AS phone, e.hire_date, e.photo_url,
               e.department_id, e.position_id,
               COALESCE(d.name_uz, d.name) AS department_name,
               COALESCE(p.name_uz, p.name) AS position_name
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

  /**
   * `POST /api/employees/:id/assign-org-functions`
   *
   * Frontend body: `{ orgDepartmentIds: number[] }` (yangi, multi-assignment).
   * Legacy: `{ departmentId, positionId }` ham qo'llab-quvvatlanadi (faqat employees update).
   */
  async assignOrgFunctions(
    id: string,
    body: {
      orgDepartmentIds?: Array<number | string>;
      org_department_ids?: Array<number | string>;
      departmentId?: string | number;
      positionId?: string | number;
    },
  ): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const empId = si(id);
      const orgIdsRaw = body.orgDepartmentIds ?? body.org_department_ids;
      const hasOrgIds = Array.isArray(orgIdsRaw);

      // Yangi multi-assignment yo'li (yangi orgDepartmentIds bo'lsa)
      if (hasOrgIds) {
        const orgIds = parseOrgDepartmentIds(body as Record<string, unknown>);
        await validateOrgDepartmentsExist(orgIds);

        return await db.transaction(async (tx) => {
          // Mavjud xodim'ni tekshirish
          const empCheck = await tx.execute(sql`SELECT id FROM employees WHERE id = ${empId} LIMIT 1`);
          if (dbRows(empCheck).length === 0) {
            throw new NotFoundException(`Employee ${id} not found`);
          }

          // user'ni topish/yaratish
          const userResult = await tx.execute(sql`
            SELECT id, first_name, last_name, email, phone, position_id, department_id, hire_date
            FROM users WHERE employee_id = ${empId} AND deleted_at IS NULL LIMIT 1
          `);
          let userId: number;
          const userRow = dbRows(userResult)[0];
          if (userRow) {
            userId = Number(userRow['id']);
          } else {
            // Yo'q bo'lsa — employees'dan ma'lumot olib yaratamiz
            const emp = await tx.execute(sql`
              SELECT first_name, last_name, email_personal, phone_number,
                     position_id, department_id, hire_date::text AS hire_date
              FROM employees WHERE id = ${empId}
            `);
            const e = dbRows(emp)[0] as Row;
            userId = await ensureUserForEmployee(tx, {
              employeeId: empId,
              firstName: String(e['first_name'] ?? ''),
              lastName: String(e['last_name'] ?? ''),
              email: (e['email_personal'] as string | null) ?? null,
              phone: (e['phone_number'] as string | null) ?? null,
              hireDate: (e['hire_date'] as string | null) ?? null,
              positionId: e['position_id'] ? Number(e['position_id']) : null,
              departmentId: e['department_id'] ? Number(e['department_id']) : null,
            });
          }

          await syncEmployeeOrgAssignments(tx, userId, orgIds);

          return {
            id: String(empId),
            userId: String(userId),
            assignedOrgDepartmentIds: orgIds,
            count: orgIds.length,
          } as Row;
        });
      }

      // Legacy yo'l: departmentId/positionId — faqat employees jadvali
      const r = await rawSql(sql`
        UPDATE employees
        SET department_id = COALESCE(${body.departmentId ?? null}, department_id),
            position_id   = COALESCE(${body.positionId ? si(body.positionId) : null}, position_id),
            updated_at    = NOW()
        WHERE id = ${empId}
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
      const a = adaptEmployeePayload(body);
      if (!a.firstName || !a.lastName) {
        throw new BadRequestException('first_name/fullName va last_name majburiy');
      }
      // Org-structure assignment majburiy — frontend `orgDepartmentIds: []` yuborishi shart
      const orgIds = parseOrgDepartmentIds(body);
      await validateOrgDepartmentsExist(orgIds);

      // FK + UNIQUE pre-check
      await validateEmployeeFks(a);

      // Atomic: employee + user + org assignments
      return await db.transaction(async (tx) => {
        // 1. Employee yaratish
        const empResult = await tx.execute(sql`
          INSERT INTO employees (
            first_name, last_name, email_personal, department_id, position_id,
            employee_code, status, hire_date, birth_date, phone_number,
            telegram_chat_id, address_actual
          )
          VALUES (
            ${a.firstName}, ${a.lastName}, ${a.email}, ${a.departmentId}, ${a.positionId},
            ${a.employeeCode}, ${a.status}, ${a.hireDate}, ${a.birthDate}, ${a.phoneNumber},
            ${a.telegramChatId}, ${a.address}
          )
          RETURNING id::text AS id, id AS num_id, first_name, last_name, employee_code, status
        `);
        const emp = dbRows(empResult)[0] as Row | undefined;
        if (!emp) throw new InternalServerErrorException('Employee creation failed');
        const empNumId = Number(emp['num_id']);

        // 2. User yaratish/topish (login + assignment uchun)
        const userId = await ensureUserForEmployee(tx, {
          employeeId: empNumId,
          firstName: a.firstName!,
          lastName: a.lastName!,
          email: a.email,
          phone: a.phoneNumber,
          hireDate: a.hireDate,
          positionId: a.positionId,
          departmentId: a.departmentId,
        });

        // 3. Org assignments
        await syncEmployeeOrgAssignments(tx, userId, orgIds);

        // num_id'ni response'dan o'chirish (frontend ko'rmasin)
        delete emp['num_id'];
        return emp;
      });
    });
  }

  async updateEmployee(id: string, body: Record<string, unknown>): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const a = adaptEmployeePayload(body);
      await validateEmployeeFks(a, si(id));

      // Agar orgDepartmentIds yuborilgan bo'lsa — validate qilamiz (PATCH ham assignment'ni o'zgartirsa bo'ladi)
      const orgIdsRaw = body['orgDepartmentIds'] ?? body['org_department_ids'];
      const willUpdateOrg = Array.isArray(orgIdsRaw);
      const orgIds = willUpdateOrg ? parseOrgDepartmentIds(body) : [];
      if (willUpdateOrg) {
        await validateOrgDepartmentsExist(orgIds);
      }

      return await db.transaction(async (tx) => {
        const r = await tx.execute(sql`
          UPDATE employees
          SET first_name        = COALESCE(${a.firstName}, first_name),
              last_name         = COALESCE(${a.lastName}, last_name),
              email_personal    = COALESCE(${a.email}, email_personal),
              department_id     = COALESCE(${a.departmentId}, department_id),
              position_id       = COALESCE(${a.positionId}, position_id),
              status            = COALESCE(${a.status}, status),
              hire_date         = COALESCE(${a.hireDate}, hire_date),
              birth_date        = COALESCE(${a.birthDate}, birth_date),
              phone_number      = COALESCE(${a.phoneNumber}, phone_number),
              telegram_chat_id  = COALESCE(${a.telegramChatId}, telegram_chat_id),
              address_actual    = COALESCE(${a.address}, address_actual),
              employee_code     = COALESCE(${a.employeeCode}, employee_code),
              updated_at        = NOW()
          WHERE id = ${si(id)}
          RETURNING id::text AS id, first_name, last_name, employee_code, status, updated_at
        `);
        const found = dbRows(r)[0] as Row | undefined;
        if (!found) throw new NotFoundException('Record not found');

        // Agar org assignments yangilanishi kerak bo'lsa — user'ni topib sync qilamiz
        if (willUpdateOrg) {
          const userResult = await tx.execute(sql`
            SELECT id FROM users WHERE employee_id = ${si(id)} AND deleted_at IS NULL LIMIT 1
          `);
          const userRow = dbRows(userResult)[0];
          if (userRow) {
            await syncEmployeeOrgAssignments(tx, Number(userRow['id']), orgIds);
          }
        }
        return found;
      });
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
