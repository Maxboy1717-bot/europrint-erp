/**
 * @module org-compat.repository
 * @description Raw SQL query helpers for org_departments / org_functions compat endpoints.
 *   Controller delegates here; direct db.execute in controllers is forbidden (PA2-14).
 *   NOTE: RULE4_EXCEPTION — org_departments Drizzle schema lacks otdeleniye_code;
 *   org_functions has no Drizzle schema at all. Computed aliases ('D'||id::text)
 *   cannot be expressed via Drizzle query builder.
 */

import { sql } from 'drizzle-orm';
import { db } from '@shared/db';
import { Result, Ok, Err, AppErr } from '@common/result';

export async function getCompatDepartments(): Promise<Result<unknown[]>> {
  // NOTE: RULE4_EXCEPTION — computed alias `'D'||id::text` + COALESCE(otdeleniye_code)
  // not expressible via Drizzle ORM builders.
  try {
    const result = await db.execute(sql`
      SELECT id, COALESCE(otdeleniye_code, 'D'||id::text) AS code,
             name AS name_uz, name_ru, parent_id, head_user_id AS manager_id,
             level, sort_order, is_active, description, created_at
        FROM org_departments
       WHERE COALESCE(node_type, 'department') IN ('department','sub_department')
         AND COALESCE(is_active, true) = true
       ORDER BY COALESCE(level, 0), COALESCE(sort_order, 0), name
    `);
    return Ok(((result as { rows?: unknown[] }).rows ?? result) as unknown[]);
  } catch (err) {
    return Err(`getCompatDepartments failed: ${String(err)}`);
  }
}

export async function getCompatPositions(): Promise<Result<unknown[]>> {
  // NOTE: RULE4_EXCEPTION — org_functions has no Drizzle schema;
  // computed alias `'P'||id::text` not expressible via Drizzle query builder.
  try {
    const result = await db.execute(sql`
      SELECT id, 'P'||id::text AS code, position_name AS name_uz,
             position_name_ru AS name_ru, department_id, is_active,
             display_order, created_at
        FROM org_functions
       WHERE COALESCE(is_active, true) = true
       ORDER BY department_id, COALESCE(display_order, 0), position_name
    `);
    return Ok(((result as { rows?: unknown[] }).rows ?? result) as unknown[]);
  } catch (err) {
    return Err(`getCompatPositions failed: ${String(err)}`);
  }
}

// ---------------------------------------------------------------------------
// /api/core/departments — OrgDepartmentsPage.tsx (LIVE sahifa) GET/POST/DELETE.
// 2026-05-21 da DepartmentsController o'chirilgan; bu sahifa yangi `/api/core/*`
// URL ishlatadi. Manba jadval = org_departments (getOrgDepartments bilan bir xil),
// shu sabab POST yaratgan bo'lim GET ro'yxatida darhol ko'rinadi.
// NOTE: RULE4_EXCEPTION — otdeleniye_code + computed alias org_departments Drizzle
// schema'sida yo'q; raw PARAMETRLANGAN SQL ishlatiladi (Qoida B: sql.raw YO'Q).
// ---------------------------------------------------------------------------

/** FE `Department` shape: { id, name, code, parentId, isActive, head, employeeCount }. */
export async function getCoreDepartments(): Promise<Result<unknown[]>> {
  try {
    const result = await db.execute(sql`
      SELECT
        od.id::text                                     AS id,
        COALESCE(od.name, '')                           AS name,
        COALESCE(od.otdeleniye_code, 'D'||od.id::text)  AS code,
        od.parent_id::text                              AS "parentId",
        COALESCE(od.is_active, true)                    AS "isActive",
        NULLIF(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), '') AS head,
        (SELECT COUNT(*)::int
           FROM employee_org_departments eod
          WHERE eod.org_department_id = od.id)          AS "employeeCount"
      FROM org_departments od
      LEFT JOIN users u ON u.id = od.head_user_id
      WHERE COALESCE(od.node_type, 'department') IN ('department', 'sub_department')
        AND COALESCE(od.is_active, true) = true
      ORDER BY COALESCE(od.level, 0), COALESCE(od.sort_order, 0), od.name
    `);
    return Ok(((result as { rows?: unknown[] }).rows ?? result) as unknown[]);
  } catch (err) {
    return Err(`getCoreDepartments failed: ${String(err)}`);
  }
}

/** POST — yangi bo'lim. FE faqat { name, code } yuboradi; bo'sh code → NULL (GET COALESCE fallback). */
export async function createCoreDepartment(name: string, code?: string): Promise<Result<unknown>> {
  const trimmedName = String(name ?? '').trim();
  if (!trimmedName) return Err(AppErr('VALIDATION', 'Bo\'lim nomi majburiy'));
  const normalizedCode = code && code.trim() ? code.trim() : null;
  try {
    const result = await db.execute(sql`
      INSERT INTO org_departments (name, otdeleniye_code, node_type, is_active)
      VALUES (${trimmedName}, ${normalizedCode}, 'department', true)
      RETURNING
        id::text                                    AS id,
        name                                        AS name,
        COALESCE(otdeleniye_code, 'D'||id::text)    AS code,
        parent_id::text                             AS "parentId",
        is_active                                   AS "isActive"
    `);
    const rows = ((result as { rows?: unknown[] }).rows ?? result) as unknown[];
    return Ok(rows[0] ?? null);
  } catch (err) {
    return Err(`createCoreDepartment failed: ${String(err)}`);
  }
}

/**
 * DELETE — soft delete (is_active=false). FK-xavfsiz: employee_org_departments
 * org_departments.id ga bog'langan; hard DELETE FK buzishi mumkin. GET is_active=true
 * filtrlaydi → soft-deleted bo'lim ro'yxatdan yo'qoladi (deletePosition bilan bir xil ruh).
 */
export async function softDeleteCoreDepartment(id: string): Promise<Result<unknown>> {
  const numericId = Number.parseInt(String(id), 10);
  if (!Number.isFinite(numericId) || numericId <= 0) {
    return Err(AppErr('VALIDATION', `Noto'g'ri bo'lim id: ${id}`));
  }
  try {
    const result = await db.execute(sql`
      UPDATE org_departments
         SET is_active = false
       WHERE id = ${numericId}
       RETURNING id::text AS id
    `);
    const rows = ((result as { rows?: unknown[] }).rows ?? result) as unknown[];
    if (!rows[0]) return Err(AppErr('NOT_FOUND', `Bo'lim topilmadi: ${id}`));
    return Ok({ id: String(numericId), deleted: true });
  } catch (err) {
    return Err(`softDeleteCoreDepartment failed: ${String(err)}`);
  }
}
