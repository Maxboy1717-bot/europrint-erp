/**
 * EmployeesListExtendedService — frontend `Employees.tsx` uchun kengaytirilgan list.
 *
 * Maqsad: `Employees.tsx` /api/employees ga so'rov yuboradi va kutadi:
 *   id, fullName, employeeId, telegramChatId, birthDate, hireDate, address,
 *   attestationDate, orgDepartmentName, departmentName, orgPositionName,
 *   positionName, departmentId, phone, coursesTotal, rating, bonusAmount,
 *   status, failedTests, disciplineCount, profileImageUrl
 *
 * Ushbu service `employees + departments + positions + org_departments + org_functions`
 * JOIN qilib barcha kerakli maydonlarni alias bilan qaytaradi.
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
  departmentId: string | null;
  positionId: string | null;
  departmentName: string | null;
  positionName: string | null;
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
      const deptFilter = departmentId ? sql`AND e.department_id = ${safeInt(departmentId, 0)}` : sql``;
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
          e.department_id::text                                          AS "departmentId",
          e.position_id::text                                            AS "positionId",
          d.name_uz                                                      AS "departmentName",
          COALESCE(p.name_uz, '')                                        AS "positionName",
          NULL::text                                                     AS "orgDepartmentName",
          NULL::text                                                     AS "orgPositionName",
          0                                                              AS "coursesTotal",
          0                                                              AS "rating",
          0                                                              AS "bonusAmount",
          0                                                              AS "failedTests",
          0                                                              AS "disciplineCount"
        FROM employees e
        LEFT JOIN departments d ON d.id = e.department_id
        LEFT JOIN positions p   ON p.id = e.position_id
        WHERE e.deleted_at IS NULL
          ${statusFilter}
          ${deptFilter}
          ${searchFilter}
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
        e.department_id::text                                          AS "departmentId",
        e.position_id::text                                            AS "positionId",
        COALESCE(d.name_uz, d.name)                                    AS "departmentName",
        COALESCE(p.name_uz, p.name, '')                                AS "positionName",
        NULL::text                                                     AS "orgDepartmentName",
        NULL::text                                                     AS "orgPositionName",
        0 AS "coursesTotal", 0 AS "rating", 0 AS "bonusAmount",
        0 AS "failedTests", 0 AS "disciplineCount"
      FROM employees e
      LEFT JOIN departments d ON d.id = e.department_id
      LEFT JOIN positions p   ON p.id = e.position_id
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
      const deptFilter = departmentId ? sql`AND e.department_id = ${safeInt(departmentId, 0)}` : sql``;
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
