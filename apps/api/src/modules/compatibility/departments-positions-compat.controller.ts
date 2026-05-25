/**
 * @module departments-positions-compat.controller
 * @description Compat endpoints — `/api/departments` va `/api/positions` legacy
 *   URL'larini org_departments va org_functions jadvallariga yo'naltiradi.
 *   2026-05-21 da DepartmentsController + PositionsController o'chirilgan,
 *   FE'da bir nechta sahifa hali ham eski URL ishlatadi.
 */

import { Controller, Get } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { db } from '@shared/db';

@Controller()
export class DepartmentsPositionsCompatController {
  @Get('departments')
  async getDepartments() {
    const result = await db.execute(sql`
      SELECT id, COALESCE(otdeleniye_code, 'D'||id::text) AS code,
             name AS name_uz, name_ru, parent_id, head_user_id AS manager_id,
             level, sort_order, is_active, description, created_at
        FROM org_departments
       WHERE COALESCE(node_type, 'department') IN ('department','sub_department')
         AND COALESCE(is_active, true) = true
       ORDER BY COALESCE(level, 0), COALESCE(sort_order, 0), name
    `);
    return { data: (result as { rows?: unknown[] }).rows ?? result };
  }

  @Get('positions')
  async getPositions() {
    const result = await db.execute(sql`
      SELECT id, 'P'||id::text AS code, position_name AS name_uz,
             position_name_ru AS name_ru, department_id, is_active,
             display_order, created_at
        FROM org_functions
       WHERE COALESCE(is_active, true) = true
       ORDER BY department_id, COALESCE(display_order, 0), position_name
    `);
    return { data: (result as { rows?: unknown[] }).rows ?? result };
  }
}
