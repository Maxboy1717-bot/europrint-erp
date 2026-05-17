import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { offboarding_cases, offboarding_checklist_items } from '@shared/db';
import { eq, and, sql } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class HrOffboardingRepository {
  async updateChecklistItem(caseId: number, itemId: number, done: boolean): Promise<Result<Row>> {
    try {
      const rows = await db
        .update(offboarding_checklist_items)
        .set({ done })
        .where(
          and(
            eq(offboarding_checklist_items.id, itemId),
            eq(offboarding_checklist_items.case_id, caseId),
          ),
        )
        .returning();
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      return Ok((rows[0] ?? {}) as Row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async recordExitInterview(caseId: number, notes: string): Promise<Result<Row>> {
    try {
      const rows = await db
        .update(offboarding_cases)
        .set({ status: 'exit_interviewed', updated_at: _time.now() })
        .where(eq(offboarding_cases.id, caseId))
        .returning();
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      return Ok({ ...(rows[0] ?? {}), exit_interview_notes: notes } as Row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async finalizeCase(caseId: number): Promise<Result<Row>> {
    try {
      const rows = await db
        .update(offboarding_cases)
        .set({ status: 'completed', updated_at: _time.now() })
        .where(eq(offboarding_cases.id, caseId))
        .returning();
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      return Ok((rows[0] ?? {}) as Row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async findCaseById(id: number): Promise<Result<Row | null>> {
    try {
      const rows = await runQuery<Row>(sql`
        SELECT oc.*,
               e.first_name,
               e.last_name,
               e.employee_code,
               d.name AS department_name
        FROM offboarding_cases oc
        LEFT JOIN employees e ON e.id = oc.employee_id
        LEFT JOIN departments d ON d.id = e.department_id
        WHERE oc.id = ${id}
        LIMIT 1
      `);
      const r0 = rows.rows[0] ?? null;
      if (!r0) return Ok(null);

      // Attach checklist items.
      const items = await db
        .select()
        .from(offboarding_checklist_items)
        .where(eq(offboarding_checklist_items.case_id, id))
        .orderBy(offboarding_checklist_items.order_num);
      return Ok({ ...(r0 as Row), checklist_items: Array.isArray(items) ? items : [] });
    } catch (e) {
      return Err(String(e));
    }
  }

  /**
   * Filtered case list. Supports:
   *   - status: empty string / 'all' / specific status
   *   - search: substring on first/last name / employee_code
   */
  async findCases(filters: { status?: string; search?: string; limit?: number }): Promise<Result<Row[]>> {
    try {
      const status = (filters.status ?? '').trim();
      const search = (filters.search ?? '').trim();
      const limit = Math.min(Math.max(filters.limit ?? 100, 1), 500);

      const statusFilter = status && status !== 'all'
        ? sql`AND oc.status = ${status}`
        : sql``;
      const searchFilter = search
        ? sql`AND (
            e.first_name ILIKE ${'%' + search + '%'} OR
            e.last_name  ILIKE ${'%' + search + '%'} OR
            e.employee_code ILIKE ${'%' + search + '%'}
          )`
        : sql``;

      const rows = await runQuery<Row>(sql`
        SELECT oc.id,
               oc.employee_id,
               oc.dismissal_type,
               oc.last_working_day,
               oc.status,
               oc.completed_items,
               oc.total_items,
               oc.created_at,
               oc.updated_at,
               e.first_name,
               e.last_name,
               e.employee_code,
               d.name AS department_name
        FROM offboarding_cases oc
        LEFT JOIN employees e ON e.id = oc.employee_id
        LEFT JOIN departments d ON d.id = e.department_id
        WHERE 1=1
        ${statusFilter}
        ${searchFilter}
        ORDER BY oc.created_at DESC
        LIMIT ${limit}
      `);
      return Ok(rows.rows as Row[]);
    } catch (e) {
      return Err(String(e));
    }
  }

  /** Counts per status for the offboarding-stats card. */
  async getCaseStats(): Promise<Result<Row>> {
    try {
      const rows = await runQuery<Row>(sql`
        SELECT
          COUNT(*) FILTER (WHERE status = 'active')           AS active,
          COUNT(*) FILTER (WHERE status = 'exit_interviewed') AS exit_interviewed,
          COUNT(*) FILTER (WHERE status = 'completed')        AS completed,
          COUNT(*) FILTER (WHERE status = 'cancelled')        AS cancelled,
          COUNT(*)                                            AS total
        FROM offboarding_cases
      `);
      return Ok((rows.rows[0] ?? {}) as Row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async createCase(dto: {
    employeeId: number;
    initiatedBy?: number;
    dismissalType?: string;
    lastWorkingDay?: string;
    totalItems?: number;
  }): Promise<Result<Row>> {
    try {
      const rows = await db
        .insert(offboarding_cases)
        .values({
          employee_id: dto.employeeId,
          dismissal_type: dto.dismissalType ?? 'resignation',
          last_working_day: dto.lastWorkingDay,
          status: 'active',
          total_items: dto.totalItems ?? 8,
          completed_items: 0,
          created_at: _time.now(),
          updated_at: _time.now(),
        })
        .returning();
      if (!Array.isArray(rows) || rows.length === 0) return Err('CREATE_FAILED');
      return Ok(rows[0] as Row);
    } catch (e) {
      return Err(String(e));
    }
  }
}
