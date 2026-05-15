/**
 * @module employees-compat.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 * Core CRUD + org methods only. Sub-resource methods live in employees-compat-sub.service.ts.
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MAX_QUERY_LIMIT, MAX_LARGE_QUERY_LIMIT } from '@common/constants/app.constants';
import { db, rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result, AppError } from '@common/result';
import { adaptEmployeePayload, validateEmployeeFks } from './employees-payload.adapter';
import {
  parseOrgDepartmentIds,
  validateOrgDepartmentsExist,
  syncEmployeeOrgAssignments,
  ensureUserForEmployee,
} from './employees-org-assignment.helper';
import {
  type Row, si, resolveOrCreateUserForEmployee, insertEmployeeRow,
  updateEmployeeRow, syncOrgAssignmentsIfUserExists,
} from './employees-compat.helpers';

// Re-export Row so consumers importing from this module keep working
export type { Row } from './employees-compat.helpers';

@Injectable()
export class EmployeesCompatService {
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

  /** Returns all org_department IDs assigned to this employee (via users.employee_id). */
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

  /** Supports new multi-assignment (orgDepartmentIds[]) and legacy (departmentId/positionId). */
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
      if (Array.isArray(orgIdsRaw)) {
        return this.assignOrgDepartments(id, empId, body);
      }
      return this.assignLegacyDeptPosition(id, empId, body);
    });
  }

  private async assignOrgDepartments(
    id: string,
    empId: number,
    body: { orgDepartmentIds?: Array<number | string>; org_department_ids?: Array<number | string> },
  ): Promise<Row> {
    const orgIds = parseOrgDepartmentIds(body as Record<string, unknown>);
    await validateOrgDepartmentsExist(orgIds);

    return await db.transaction(async (tx) => {
      const empCheck = await tx.execute(sql`SELECT id FROM employees WHERE id = ${empId} LIMIT 1`);
      if (dbRows(empCheck).length === 0) throw new NotFoundException(`Employee ${id} not found`);

      const userId = await resolveOrCreateUserForEmployee(tx, empId);
      await syncEmployeeOrgAssignments(tx, userId, orgIds);

      return {
        id: String(empId),
        userId: String(userId),
        assignedOrgDepartmentIds: orgIds,
        count: orgIds.length,
      } as Row;
    });
  }

  private async assignLegacyDeptPosition(
    id: string,
    empId: number,
    body: { departmentId?: string | number; positionId?: string | number },
  ): Promise<Row> {
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
  }

  async createEmployee(body: Record<string, unknown>): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const a = adaptEmployeePayload(body);
      if (!a.firstName || !a.lastName) {
        throw new BadRequestException('first_name/fullName va last_name majburiy');
      }
      const orgIds = parseOrgDepartmentIds(body);
      await validateOrgDepartmentsExist(orgIds);
      await validateEmployeeFks(a);

      return await db.transaction(async (tx) => {
        const emp = await insertEmployeeRow(tx, a);
        const empNumId = Number(emp['num_id']);
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
        await syncEmployeeOrgAssignments(tx, userId, orgIds);
        delete emp['num_id'];
        return emp;
      });
    });
  }

  async updateEmployee(id: string, body: Record<string, unknown>): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const a = adaptEmployeePayload(body);
      await validateEmployeeFks(a, si(id));

      const orgIdsRaw = body['orgDepartmentIds'] ?? body['org_department_ids'];
      const willUpdateOrg = Array.isArray(orgIdsRaw);
      const orgIds = willUpdateOrg ? parseOrgDepartmentIds(body) : [];
      if (willUpdateOrg) {
        await validateOrgDepartmentsExist(orgIds);
      }

      return await db.transaction(async (tx) => {
        const found = await updateEmployeeRow(tx, id, a);
        if (willUpdateOrg) await syncOrgAssignmentsIfUserExists(tx, id, orgIds);
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
}
