import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db, runQuery } from '@shared/db';
import { offboarding_cases, offboarding_checklist_items } from '@shared/db';
import { eq, and, sql } from 'drizzle-orm';
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
    initiatedBy?: number;
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
          initiated_by:      input.initiatedBy ?? null,
        })
        .returning();
      if (!Array.isArray(rows) || !rows[0]) return Err('CASE_CREATE_FAILED');
      return Ok(rows[0] as Row);
    } catch (e) {
      return Err(String(e));
    }
  }

  /** Guards against two concurrent active offboarding cases for the same employee. */
  async findActiveCaseByEmployee(employeeId: number): Promise<Result<Row | null>> {
    try {
      const rows = await db
        .select()
        .from(offboarding_cases)
        .where(
          and(
            eq(offboarding_cases.employee_id, employeeId),
            sql`${offboarding_cases.status} IN ('active', 'exit_interviewed')`,
          ),
        )
        .limit(1);
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      return Ok((rows[0] ?? null) as Row | null);
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
      // BUG FIX (2026-07-13, found via live DB-proof): the live
      // `offboarding_checklist_items.created_at` column is NOT NULL with NO
      // database-level default (confirmed via information_schema —
      // column_default is null) even though the Drizzle schema declares
      // `.defaultNow()`. Neither this method nor the DB itself was actually
      // populating it, so every checklist seed (i.e. every "start
      // offboarding" case creation) threw a NOT NULL constraint violation —
      // the very first step of the whole feature was crashing. Setting it
      // explicitly here is the fix.
      const values = items.map((it) => ({
        case_id:    caseId,
        item_key:   it.item_key,
        label:      it.label,
        done:       false,
        order_num:  it.order_num,
        created_at: _time.now(),
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

  async updateChecklistItem(
    caseId: number,
    itemId: number,
    done: boolean,
    opts: { notes?: string; returnStatus?: string; doneBy?: number } = {},
  ): Promise<Result<Row>> {
    try {
      const patch: Record<string, unknown> = { done, done_at: done ? _time.now() : null };
      if (opts.notes !== undefined) patch.notes = opts.notes;
      if (opts.returnStatus !== undefined) patch.return_status = opts.returnStatus;
      if (done && opts.doneBy !== undefined) patch.done_by = opts.doneBy;

      const rows = await db
        .update(offboarding_checklist_items)
        .set(patch as never)
        .where(
          and(
            eq(offboarding_checklist_items.id, itemId),
            eq(offboarding_checklist_items.case_id, caseId),
          ),
        )
        .returning();
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');

      await this.syncCaseProgress(caseId);

      return Ok((rows[0] ?? {}) as Row);
    } catch (e) {
      return Err(String(e));
    }
  }

  /** Locate a checklist item by its business key (e.g. 'exit_interview') within a case. */
  async findChecklistItemByKey(caseId: number, itemKey: string): Promise<Result<Row | null>> {
    try {
      const rows = await db
        .select()
        .from(offboarding_checklist_items)
        .where(
          and(
            eq(offboarding_checklist_items.case_id, caseId),
            eq(offboarding_checklist_items.item_key, itemKey),
          ),
        )
        .limit(1);
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      return Ok((rows[0] ?? null) as Row | null);
    } catch (e) {
      return Err(String(e));
    }
  }

  /**
   * Recomputes `completed_items` AND the case-level status badges
   * (equipment_returned / access_revoked / settlement_done) the frontend
   * (HROffboardingDialogs "Tafsilotlar" expand + employee-profile OffboardingTab)
   * renders — these physically exist on the live table (migrations-drift.ts)
   * but were never written to before this fix, so they always showed "not done".
   */
  private async syncCaseProgress(caseId: number): Promise<void> {
    const itemRows = await db
      .select({ item_key: offboarding_checklist_items.item_key, done: offboarding_checklist_items.done })
      .from(offboarding_checklist_items)
      .where(eq(offboarding_checklist_items.case_id, caseId));
    const items = Array.isArray(itemRows) ? itemRows : [];
    const isDone = (key: string) => items.some((i) => i.item_key === key && i.done === true);

    const completed = items.filter((i) => i.done === true).length;
    const equipmentReturned = isDone('return_laptop') && isDone('return_badge') && isDone('return_keys');
    const accessRevoked = isDone('revoke_access');
    const settlementDone = isDone('final_payroll');

    await db
      .update(offboarding_cases)
      .set({
        completed_items:    completed,
        equipment_returned: equipmentReturned,
        access_revoked:     accessRevoked,
        settlement_done:    settlementDone,
        updated_at:         _time.now(),
      })
      .where(eq(offboarding_cases.id, caseId));
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

  /**
   * Persists the exit interview (or an explicit skip). Previously this only
   * flipped `status` and threw the notes JSON away (return-value only, never
   * written to a column) — a confirmed fake-success (Q-40). Now writes the
   * real `exit_interview_notes`/`reason`/`blocks_settlement`/`exit_interview_done`
   * columns that already exist on the live table (migrations-drift.ts healer)
   * and are what HROffboardingDialogs/OffboardingTab actually render.
   */
  async recordExitInterview(
    caseId: number,
    input: { notes: string; reason: string; blocksSettlement: boolean },
  ): Promise<Result<Row>> {
    try {
      const rows = await db
        .update(offboarding_cases)
        .set({
          status:               'exit_interviewed',
          exit_interview_notes: input.notes,
          exit_interview_done:  true,
          blocks_settlement:    input.blocksSettlement,
          reason:               input.reason,
          updated_at:           _time.now(),
        })
        .where(eq(offboarding_cases.id, caseId))
        .returning();
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      return Ok((rows[0] ?? {}) as Row);
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

  /**
   * Same as `findCaseById` but joined to `employees` for `full_name` /
   * `position` / `department` — the fields HROffboardingSteps.tsx /
   * OffboardingTab.tsx render in the case-detail header. Previously
   * `getCaseDetail` returned the bare `offboarding_cases` row (no employee
   * fields at all), so the checklist dialog always showed a blank name.
   */
  async findCaseDetailById(id: number): Promise<Result<Row | null>> {
    try {
      const rows = await runQuery<Row>(sql`
        SELECT
          oc.*,
          COALESCE(e.first_name || ' ' || e.last_name, '')     AS full_name,
          COALESCE(p.name, '')                                  AS position,
          COALESCE(d.name, '')                                  AS department
        FROM offboarding_cases oc
        LEFT JOIN employees e   ON e.id = oc.employee_id
        LEFT JOIN positions p   ON p.id = e.position_id
        LEFT JOIN departments d ON d.id = e.department_id
        WHERE oc.id = ${id}
        LIMIT 1
      `);
      const row = Array.isArray(rows.rows) ? rows.rows[0] : undefined;
      return Ok((row ?? null) as Row | null);
    } catch (e) {
      return Err(String(e));
    }
  }

  async listCases(
    filters: { status?: string; employeeId?: number; search?: string } = {},
  ): Promise<Result<Row[]>> {
    try {
      const conditions = [sql`1=1`];
      if (filters.status)     conditions.push(sql`oc.status = ${filters.status}`);
      if (filters.employeeId) conditions.push(sql`oc.employee_id = ${filters.employeeId}`);
      if (filters.search)     conditions.push(sql`(e.first_name || ' ' || e.last_name) ILIKE ${'%' + filters.search + '%'}`);
      const rows = await runQuery<Row>(sql`
        SELECT
          oc.*,
          COALESCE(e.first_name || ' ' || e.last_name, '')     AS full_name,
          COALESCE(p.name, '')                                  AS position,
          COALESCE(d.name, '')                                  AS department
        FROM offboarding_cases oc
        LEFT JOIN employees e   ON e.id = oc.employee_id
        LEFT JOIN positions p   ON p.id = e.position_id
        LEFT JOIN departments d ON d.id = e.department_id
        WHERE ${sql.join(conditions, sql` AND `)}
        ORDER BY oc.created_at DESC
        LIMIT 200
      `);
      return Ok((Array.isArray(rows.rows) ? rows.rows : []) as Row[]);
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
