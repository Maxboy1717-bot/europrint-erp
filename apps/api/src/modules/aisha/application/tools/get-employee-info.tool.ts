/**
 * @module get-employee-info.tool
 */

// NOTE: (RULE4_EXCEPTION) AIsha tools intentionally use raw SQL. Each tool
// aggregates across cross-module tables (sales, production, HR, finance,
// security, IoT, kanban, calendar) that the AIsha module does not own.
// Importing every Drizzle schema would create tight coupling between
// AIsha and every other domain module. The read-only / single-INSERT
// raw SQL keeps AIsha a loose query-adapter layer over the ERP. Drizzle
// ORM is used elsewhere; see [[aisha-final-report]] for the
// architectural rationale.

import { Injectable } from '@nestjs/common';
import { Result, Ok, Err, AppErr } from '@common/result';
import { sql } from 'drizzle-orm';
import { db } from '@shared/db';
import { HR_ROLES } from '@common/constants/roles.constants';
import type { IAishaTool, ToolResult, AishaToolContext } from '../../domain/tool.interface';
import { provSource, provResult, rowsOf, hasAishaRole } from './_helpers';

export interface EmployeeInfo {
  employeeId: number; fullName: string; position: string;
  attendanceToday: string | null; location: string | null; kpiCurrent: number | null;
}

@Injectable()
export class GetEmployeeInfoTool implements IAishaTool {
  readonly definition = {
    name: 'get_employee_info',
    description: 'Xodim haqida: lavozim, bugungi davomat, joylashuv, KPI.',
    input_schema: {
      type: 'object' as const,
      properties: {
        employeeName: { type: 'string', description: 'Xodim FIO yoki IDsi' },
      },
      required: ['employeeName'],
    },
  };

  async execute(input: Record<string, unknown>, ctx?: AishaToolContext): Promise<Result<ToolResult<EmployeeInfo>>> {
    // Discovery sweep 2026-08-03 P0 fix ("Aisha chat tool'lari RBAC-cheklovisiz xodim/moliya
    // ma'lumotini qaytaradi"): any authenticated Aisha user could ask for ANY employee's
    // real-time location/attendance/KPI — PII with no role check, unlike the equivalent REST
    // endpoints (HR module is @Roles-gated). Same allow-list precedent as
    // org-structure.service.ts's canViewCompensation() / HR_ROLES (common/constants).
    if (!hasAishaRole(ctx?.role, HR_ROLES)) {
      return Err(AppErr('FORBIDDEN', "Xodim ma'lumotini faqat HR/rahbariyat so'rashi mumkin"));
    }
    const q = String(input['employeeName'] ?? '');
    if (!q) return Err(AppErr('VALIDATION', 'employeeName majburiy'));

    try {
      const start = Date.now();
      const emp = rowsOf<{ id: number; full_name: string; position: string }>(await db.execute(sql`
        -- Audit 2026-08-07: 'hr_employees' jadvali bazada YO'Q; kanonik xodim jadvali
        -- 'employees' (id / full_name / position ustunlari aynan mavjud).
        SELECT id, full_name, position FROM employees
        WHERE LOWER(full_name) LIKE LOWER('%' || ${q} || '%') OR id::text = ${q}
        LIMIT 1
      `))[0];
      if (!emp) return Err(AppErr('NOT_FOUND', `Xodim topilmadi: ${q}`));

      const att = rowsOf<{ status: string; location: string | null }>(await db.execute(sql`
        SELECT status, location FROM hr_attendance
        WHERE employee_id = ${emp.id} AND date = CURRENT_DATE LIMIT 1
      `))[0] ?? null;

      const kpi = rowsOf<{ score: number }>(await db.execute(sql`
        SELECT score FROM hr_kpi
        WHERE employee_id = ${emp.id} ORDER BY period_end DESC LIMIT 1
      `))[0]?.score ?? null;

      return Ok(provResult<EmployeeInfo>({
        data: {
          employeeId: emp.id, fullName: emp.full_name, position: emp.position,
          attendanceToday: att?.status ?? null, location: att?.location ?? null,
          kpiCurrent: kpi,
        },
        sources: [
          provSource({ type: 'database', identifier: 'hr.employees', startMs: start, rowCount: 1 }),
          provSource({ type: 'database', identifier: 'hr.attendance', startMs: start, rowCount: att ? 1 : 0 }),
          provSource({ type: 'database', identifier: 'hr.kpi', startMs: start, rowCount: kpi === null ? 0 : 1 }),
        ],
        citations: [{ label: emp.full_name, url: `/hr/employees/${emp.id}` }],
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return Err(AppErr('EXTERNAL_SERVICE', msg));
    }
  }
}
