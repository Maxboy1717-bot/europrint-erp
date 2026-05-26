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

export async function getCompatDepartments(): Promise<unknown[]> {
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
    return ((result as { rows?: unknown[] }).rows ?? result) as unknown[];
  } catch (err) {
    throw new Error(`getCompatDepartments failed: ${String(err)}`);
  }
}

export async function getCompatPositions(): Promise<unknown[]> {
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
    return ((result as { rows?: unknown[] }).rows ?? result) as unknown[];
  } catch (err) {
    throw new Error(`getCompatPositions failed: ${String(err)}`);
  }
}
