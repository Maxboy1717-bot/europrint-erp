import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { offboarding_cases, offboarding_checklist_items } from '@shared/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import type { OffboardingChecklistItem } from './offboarding-workflow.service';

type Row = Record<string, unknown>;

@Injectable()
export class HrOffboardingRepository {
  async createCase(input: {
    employeeId: number;
    dismissalType?: string;
    lastWorkingDay?: string;
    totalItems: number;
  }): Promise<Result<Row>> {
    try {
      const rows = await db
        .insert(offboarding_cases)
        .values({
          employee_id:       input.employeeId,
          dismissal_type:    input.dismissalType ?? null,
          last_working_day:  input.lastWorkingDay ?? null,
          status:            'active',
          total_items:       input.totalItems,
          completed_items:   0,
        })
        .returning();
      if (!Array.isArray(rows) || !rows[0]) return Err('CASE_CREATE_FAILED');
      return Ok(rows[0] as Row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async insertChecklistItems(
    caseId: number,
    items: ReadonlyArray<OffboardingChecklistItem>,
  ): Promise<Result<Row[]>> {
    try {
      if (!Array.isArray(items) || items.length === 0) return Ok([] as Row[]);
      const values = items.map((it) => ({
        case_id:   caseId,
        item_key:  it.item_key,
        label:     it.label,
        done:      false,
        order_num: it.order_num,
      }));
      const rows = await db
        .insert(offboarding_checklist_items)
        .values(values)
        .returning();
      return Ok((Array.isArray(rows) ? rows : []) as Row[]);
    } catch (e) {
      return Err(String(e));
    }
  }

  async listChecklistItems(caseId: number): Promise<Result<Row[]>> {
    try {
      const rows = await db
        .select()
        .from(offboarding_checklist_items)
        .where(eq(offboarding_checklist_items.case_id, caseId))
        .orderBy(offboarding_checklist_items.order_num);
      return Ok((Array.isArray(rows) ? rows : []) as Row[]);
    } catch (e) {
      return Err(String(e));
    }
  }

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

      // Recompute completed_items count and persist on the case row.
      const doneRows = await db
        .select({ id: offboarding_checklist_items.id })
        .from(offboarding_checklist_items)
        .where(
          and(
            eq(offboarding_checklist_items.case_id, caseId),
            eq(offboarding_checklist_items.done, true),
          ),
        );
      const completed = Array.isArray(doneRows) ? doneRows.length : 0;
      await db
        .update(offboarding_cases)
        .set({ completed_items: completed, updated_at: _time.now() })
        .where(eq(offboarding_cases.id, caseId));

      return Ok((rows[0] ?? {}) as Row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async updateStatus(caseId: number, status: string): Promise<Result<Row>> {
    try {
      const rows = await db
        .update(offboarding_cases)
        .set({ status, updated_at: _time.now() })
        .where(eq(offboarding_cases.id, caseId))
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
      const rows = await db
        .select()
        .from(offboarding_cases)
        .where(eq(offboarding_cases.id, id))
        .limit(1);
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      return Ok((rows[0] ?? null) as Row | null);
    } catch (e) {
      return Err(String(e));
    }
  }

  async listCases(filters: { status?: string; employeeId?: number } = {}): Promise<Result<Row[]>> {
    try {
      const conditions = [];
      if (filters.status)     conditions.push(eq(offboarding_cases.status, filters.status));
      if (filters.employeeId) conditions.push(eq(offboarding_cases.employee_id, filters.employeeId));
      const wh = conditions.length > 0 ? and(...conditions) : undefined;
      const rows = wh
        ? await db.select().from(offboarding_cases).where(wh).orderBy(desc(offboarding_cases.created_at))
        : await db.select().from(offboarding_cases).orderBy(desc(offboarding_cases.created_at));
      return Ok((Array.isArray(rows) ? rows : []) as Row[]);
    } catch (e) {
      return Err(String(e));
    }
  }

  async stats(): Promise<Result<{ active: number; completed: number; cancelled: number }>> {
    try {
      const rows = await db
        .select({
          status: offboarding_cases.status,
          count:  sql<number>`COUNT(*)::int`,
        })
        .from(offboarding_cases)
        .groupBy(offboarding_cases.status);
      const out = { active: 0, completed: 0, cancelled: 0 };
      const arr = Array.isArray(rows) ? rows : [];
      for (const r of arr) {
        const status = String(r['status'] ?? '');
        const count  = Number(r['count'] ?? 0);
        if (status === 'active' || status === 'exit_interviewed') out.active += count;
        else if (status === 'completed') out.completed += count;
        else if (status === 'cancelled') out.cancelled += count;
      }
      return Ok(out);
    } catch (e) {
      return Err(String(e));
    }
  }
}
