/**
 * @module hr-offboarding-completed.listener
 * @description Owner-audit fix (2026-07-13, HR Offboarding page completion):
 *   `HrOffboardingService.finalizeCase` has emitted `HrV2Events.OFFBOARDING_COMPLETED`
 *   since it was written, but NOTHING ever subscribed to it — confirmed via grep
 *   (only the emitter + the event-name constant existed). Practical effect: finalizing
 *   an offboarding case never touched `employees`/`users`, and `hr_alumni` (the
 *   "departed employees" table) never received a row from the real app flow — only
 *   from a one-off seed script. `HRAlumni.tsx` happens to work anyway because its
 *   backend (`HrDashboardService.getAlumni` → `hr-dashboard.repository.ts`) computes
 *   alumni LIVE from `employees.status NOT IN (active,on_leave,probation)`, but that
 *   query only finds anyone if something actually flips the employee's status — which
 *   this listener now does.
 *
 *   On OFFBOARDING_COMPLETED:
 *     1. employees.status → 'terminated', employment_status → 'inactive',
 *        block_erp_access → true (soft state change, NOT a delete — the employee
 *        master record and its full history are kept, per HR/audit requirements).
 *     2. users.is_active → false for the linked login (if any) — revokes ERP access;
 *        soft (no deleted_at), reversible if the case is later found to be wrong.
 *     3. INSERT INTO hr_alumni — new row, not a rewrite of any existing record.
 *
 *   Failures are logged, never thrown back to the event bus — an alumni-ledger
 *   hiccup must not undo (or appear to undo) a completed offboarding case.
 */

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { HrV2Events } from '../events/hr-v2-events';

interface OffboardingCompletedPayload {
  caseId: number;
  employeeId: number;
}

interface EmployeeAlumniRow {
  user_id: number | null;
  full_name: string;
  last_position: string | null;
  department_name: string | null;
  hire_date: string | null;
}

interface OffboardingCaseRow {
  dismissal_type: string | null;
  reason: string | null;
  last_working_day: string | null;
}

@Injectable()
export class HrOffboardingCompletedListener {
  private readonly logger = new Logger(HrOffboardingCompletedListener.name);

  @OnEvent(HrV2Events.OFFBOARDING_COMPLETED)
  async onOffboardingCompleted(payload: OffboardingCompletedPayload): Promise<void> {
    try {
      await this._handle(payload);
    } catch (error: unknown) {
      this.logger.error(
        { caseId: payload?.caseId, employeeId: payload?.employeeId, error: (error as Error)?.message ?? String(error) },
        'HrOffboardingCompletedListener: post-completion sync failed (non-fatal — offboarding case stays completed)',
      );
    }
  }

  private async _handle(payload: OffboardingCompletedPayload): Promise<void> {
    const employeeId = Number(payload?.employeeId ?? 0);
    if (employeeId <= 0) {
      this.logger.warn({ caseId: payload?.caseId }, 'HrOffboardingCompletedListener: no employeeId on payload — skipped');
      return;
    }

    const empResult = await db.execute(sql`
      SELECT
        e.user_id,
        COALESCE(e.first_name || ' ' || e.last_name, '') AS full_name,
        p.name AS last_position,
        d.name AS department_name,
        e.hire_date::text AS hire_date
      FROM employees e
      LEFT JOIN positions p   ON p.id = e.position_id
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE e.id = ${employeeId}
      LIMIT 1
    `);
    const empRows = (empResult as unknown as { rows: EmployeeAlumniRow[] }).rows;
    const emp = Array.isArray(empRows) ? empRows[0] : undefined;
    if (!emp) {
      this.logger.warn({ employeeId }, 'HrOffboardingCompletedListener: employee not found — skipped');
      return;
    }

    const caseResult = await db.execute(sql`
      SELECT dismissal_type, reason, last_working_day::text AS last_working_day
      FROM offboarding_cases
      WHERE id = ${payload.caseId}
      LIMIT 1
    `);
    const caseRows = (caseResult as unknown as { rows: OffboardingCaseRow[] }).rows;
    const oCase = Array.isArray(caseRows) ? caseRows[0] : undefined;

    // 1. Employee record: soft status change, never a delete.
    await db.execute(sql`
      UPDATE employees
      SET status = 'terminated', employment_status = 'inactive', block_erp_access = true, updated_at = NOW()
      WHERE id = ${employeeId} AND status <> 'terminated'
    `);

    // 2. Linked login: soft-deactivate (no deleted_at — reversible).
    if (emp.user_id != null) {
      await db.execute(sql`
        UPDATE users SET is_active = false WHERE id = ${emp.user_id}
      `);
    }

    // 3. hr_alumni: new row (Q-40 — real INSERT, not a fabricated response).
    const exitType = oCase?.dismissal_type || oCase?.reason || 'resignation';
    await db.execute(sql`
      INSERT INTO hr_alumni (user_id, full_name, last_position, department_name, exit_date, exit_type, is_returned, created_at)
      VALUES (
        ${emp.user_id ?? null},
        ${emp.full_name || `Xodim #${employeeId}`},
        ${emp.last_position ?? null},
        ${emp.department_name ?? null},
        ${oCase?.last_working_day ?? sql`CURRENT_DATE::text`},
        ${exitType},
        false,
        NOW()
      )
    `);

    this.logger.log(
      { caseId: payload.caseId, employeeId },
      'HrOffboardingCompletedListener: employee terminated, login deactivated, hr_alumni row created',
    );
  }
}
