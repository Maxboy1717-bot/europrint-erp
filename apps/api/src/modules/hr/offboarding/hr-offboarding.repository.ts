import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { offboarding_cases, offboarding_checklist_items } from '@shared/db';
import { eq, and } from 'drizzle-orm';
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
}
