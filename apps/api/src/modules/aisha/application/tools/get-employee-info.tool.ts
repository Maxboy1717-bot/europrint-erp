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
import { Result, Err, AppErr, safeCall } from '@common/result';
import { sql } from 'drizzle-orm';
import { db } from '@shared/db';
import type { IAishaTool, ToolResult } from '../../domain/tool.interface';
import { provSource, provResult, rowsOf } from './_helpers';

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

  async execute(input: Record<string, unknown>): Promise<Result<ToolResult<EmployeeInfo>>> {
    const q = String(input['employeeName'] ?? '');
    if (!q) return Err(AppErr('VALIDATION', 'employeeName majburiy'));

    return safeCall<ToolResult<EmployeeInfo>>(async () => {
      const start = Date.now();
      const emp = rowsOf<{ id: number; full_name: string; position: string }>(await db.execute(sql`
        SELECT id, full_name, position FROM hr_employees
        WHERE LOWER(full_name) LIKE LOWER('%' || ${q} || '%') OR id::text = ${q}
        LIMIT 1
      `))[0];
      if (!emp) throw new Error(`Xodim topilmadi: ${q}`);

      const att = rowsOf<{ status: string; location: string | null }>(await db.execute(sql`
        SELECT status, location FROM hr_attendance
        WHERE employee_id = ${emp.id} AND date = CURRENT_DATE LIMIT 1
      `))[0] ?? null;

      const kpi = rowsOf<{ score: number }>(await db.execute(sql`
        SELECT score FROM hr_kpi
        WHERE employee_id = ${emp.id} ORDER BY period_end DESC LIMIT 1
      `))[0]?.score ?? null;

      return provResult<EmployeeInfo>({
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
      });
    });
  }
}
