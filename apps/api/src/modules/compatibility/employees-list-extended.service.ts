/**
 * EmployeesListExtendedService — frontend `Employees.tsx` uchun kengaytirilgan list.
 *
 * Maqsad: `Employees.tsx` /api/employees ga so'rov yuboradi va kutadi:
 *   id, fullName, employeeId, telegramChatId, birthDate, hireDate, address,
 *   attestationDate, orgDepartmentName, orgPositionName,
 *   orgDepartmentId, phone, coursesTotal, rating, bonusAmount,
 *   status, failedTests, disciplineCount, profileImageUrl
 *
 * Ushbu service `employees + employee_org_departments + org_departments + org_functions`
 * LATERAL JOIN qilib barcha kerakli maydonlarni alias bilan qaytaradi.
 *
 * Statistik maydonlar (coursesTotal, rating, ...) hozircha 0 — kelajakda LMS, KPI,
 * payroll modullari sub-query orqali qo'shadi.
 */
import { Injectable } from '@nestjs/common';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows, type DbRow } from '../hr/common/db-rows';
import { safeCall, Result, AppError } from '@common/result';
import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';

const DEFAULT_LIMIT = 50;
const DEFAULT_OFFSET = 0;

const safeInt = (v: unknown, fallback: number): number => {
  const n = parseInt(String(v ?? ''), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export interface EmployeeListRow extends DbRow {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  status: string;
  phone: string | null;
  hireDate: string | null;
  birthDate: string | null;
  address: string | null;
  telegramChatId: string | null;
  profileImageUrl: string | null;
  attestationDate: string | null;
  /** org_departments.id — used as filter key in frontend dept select */
  orgDepartmentId: string | null;
  orgDepartmentName: string | null;
  orgPositionName: string | null;
  coursesTotal: number;
  rating: number;
  bonusAmount: number;
  failedTests: number;
  disciplineCount: number;
}

@Injectable()
export class EmployeesListExtendedService {
  /**
   * Kengaytirilgan list — frontend `Employees.tsx` to'g'ridan ishlatadi.
   * Filter: status, departmentId, search.
   * Pagination: limit (max 100), offset.
   * Soft delete: deleted_at IS NULL ✅.
   */
  async listExtended(
    status?: string,
    departmentId?: string,
    search?: string,
    limit?: string,
    offset?: string,
  ): Promise<Result<EmployeeListRow[], AppError>> {
    return safeCall(async () => {
      const lim = Math.min(safeInt(limit, DEFAULT_LIMIT), MAX_QUERY_LIMIT);
      const off = safeInt(offset, DEFAULT_OFFSET);
      const statusFilter = status ? sql`AND e.status = ${status}` : sql``;
      // Filter by org_departments.id (new system), not legacy department_id
      const deptFilter = departmentId
        ? sql`AND primary_org.dept_id = ${String(safeInt(departmentId, 0))}`
        : sql``;
      const searchPattern = search ? `%${search}%` : null;
      const searchFilter = searchPattern
        ? sql`AND (
            e.first_name ILIKE ${searchPattern} OR
            e.last_name ILIKE ${searchPattern} OR
            e.employee_code ILIKE ${searchPattern} OR
            e.phone_number ILIKE ${searchPattern}
          )`
        : sql``;

      const rows = await rawSql(sql`
        SELECT
          e.id::text                                                     AS id,
          COALESCE(e.employee_code, '')                                  AS "employeeId",
          TRIM(COALESCE(e.first_name, '') || ' ' || COALESCE(e.last_name, '')) AS "fullName",
          COALESCE(e.email_work, e.email_personal, '')                   AS email,
          COALESCE(e.status, 'active')                                   AS status,
          e.phone_number                                                 AS phone,
          e.hire_date::text                                              AS "hireDate",
          e.birth_date::text                                             AS "birthDate",
          e.address_actual                                               AS address,
          e.telegram_chat_id                                             AS "telegramChatId",
          e.photo_url                                                    AS "profileImageUrl",
          NULL::text                                                     AS "attestationDate",
          primary_org.dept_id                                            AS "orgDepartmentId",
          primary_org.dept_name                                          AS "orgDepartmentName",
          primary_org.pos_name                                           AS "orgPositionName",
          0                                                              AS "coursesTotal",
          0                                                              AS "rating",
          0                                                              AS "bonusAmount",
          0                                                              AS "failedTests",
          0                                                              AS "disciplineCount"
        FROM employees e
        -- Resolve user_id for this employee (users.employee_id FK)
        LEFT JOIN users u ON u.employee_id = e.id AND u.deleted_at IS NULL
        -- Primary org department + position via junction table
        LEFT JOIN LATERAL (
          SELECT
            eod.org_department_id::text        AS dept_id,
            od.name_uz                         AS dept_name,
            COALESCE(of2.position_name, '')    AS pos_name
          FROM employee_org_departments eod
          JOIN org_departments od ON od.id = eod.org_department_id
          LEFT JOIN org_functions of2 ON of2.org_department_id = eod.org_department_id
          WHERE eod.user_id = u.id AND eod.is_primary = true
          ORDER BY eod.assigned_at DESC
          LIMIT 1
        ) primary_org ON true
        WHERE e.deleted_at IS NULL
          ${statusFilter}
          ${searchFilter}
          ${deptFilter}
        ORDER BY e.first_name ASC, e.last_name ASC
        LIMIT ${lim} OFFSET ${off}
      `);

      const raw = dbRows<EmployeeListRow>(rows);
      return Array.isArray(raw) ? raw : [];
    });
  }

  /**
   * Bitta xodim — frontend `EmployeeDialog.tsx` edit rejimi va `EmployeeProfile.tsx` uchun.
   * camelCase alias'lar bilan, `id::text` (frontend `id: string` kutadi).
   */
  async getById(id: string): Promise<Result<EmployeeListRow | null, AppError>> {
    return safeCall(async () => {
      const numericId = parseInt(id, 10);
      if (!Number.isFinite(numericId)) return null;
      const rows = await this.fetchEmployeeByIdRows(numericId);
      const data = dbRows<EmployeeListRow>(rows);
      const safe = Array.isArray(data) ? data : [];
      return safe[0] ?? null;
    });
  }

  private fetchEmployeeByIdRows(numericId: number) {
    return rawSql(sql`
      SELECT
        e.id::text                                                     AS id,
        COALESCE(e.employee_code, '')                                  AS "employeeId",
        TRIM(COALESCE(e.first_name, '') || ' ' || COALESCE(e.last_name, '')) AS "fullName",
        COALESCE(e.email_work, e.email_personal, '')                   AS email,
        COALESCE(e.status, 'active')                                   AS status,
        e.phone_number                                                 AS phone,
        e.hire_date::text                                              AS "hireDate",
        e.birth_date::text                                             AS "birthDate",
        e.address_actual                                               AS address,
        e.telegram_chat_id                                             AS "telegramChatId",
        e.photo_url                                                    AS "profileImageUrl",
        NULL::text                                                     AS "attestationDate",
        primary_org.dept_id                                            AS "orgDepartmentId",
        primary_org.dept_name                                          AS "orgDepartmentName",
        primary_org.pos_name                                           AS "orgPositionName",
        0 AS "coursesTotal", 0 AS "rating", 0 AS "bonusAmount",
        0 AS "failedTests", 0 AS "disciplineCount"
      FROM employees e
      LEFT JOIN users u ON u.employee_id = e.id AND u.deleted_at IS NULL
      LEFT JOIN LATERAL (
        SELECT
          eod.org_department_id::text        AS dept_id,
          od.name_uz                         AS dept_name,
          COALESCE(of2.position_name, '')    AS pos_name
        FROM employee_org_departments eod
        JOIN org_departments od ON od.id = eod.org_department_id
        LEFT JOIN org_functions of2 ON of2.org_department_id = eod.org_department_id
        WHERE eod.user_id = u.id AND eod.is_primary = true
        ORDER BY eod.assigned_at DESC
        LIMIT 1
      ) primary_org ON true
      WHERE e.id = ${numericId} AND e.deleted_at IS NULL
      LIMIT 1
    `);
  }

  /**
   * Total count — pagination uchun.
   * listExtended bilan birga chaqiriladi.
   */
  async countExtended(
    status?: string,
    departmentId?: string,
    search?: string,
  ): Promise<Result<number, AppError>> {
    return safeCall(async () => {
      const statusFilter = status ? sql`AND e.status = ${status}` : sql``;
      // Filter by org_departments.id via junction, not legacy department_id
      const deptFilter = departmentId
        ? sql`AND EXISTS (
            SELECT 1 FROM users u2
            JOIN employee_org_departments eod2 ON eod2.user_id = u2.id AND eod2.is_primary = true
            WHERE u2.employee_id = e.id AND u2.deleted_at IS NULL
              AND eod2.org_department_id = ${safeInt(departmentId, 0)}
          )`
        : sql``;
      const searchPattern = search ? `%${search}%` : null;
      const searchFilter = searchPattern
        ? sql`AND (
            e.first_name ILIKE ${searchPattern} OR
            e.last_name ILIKE ${searchPattern} OR
            e.employee_code ILIKE ${searchPattern} OR
            e.phone_number ILIKE ${searchPattern}
          )`
        : sql``;

      const rows = await rawSql(sql`
        SELECT COUNT(*)::int AS total
        FROM employees e
        WHERE e.deleted_at IS NULL ${statusFilter} ${deptFilter} ${searchFilter}
      `);
      const safeRows = Array.isArray(dbRows(rows)) ? dbRows(rows) : [];
      const first = safeRows[0] as { total?: number } | undefined;
      return Number(first?.total ?? 0);
    });
  }
}
