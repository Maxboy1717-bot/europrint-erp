/**
 * @module discipline-escalation.helper
 * @description Shared cumulative-violation escalation-stage calculator for
 *   `discipline_records`. Vision (owner directive 2026-07-13, HR Nazorat 4-page fix):
 *   escalation follows verbal -> written -> fine -> dismissal, based on the employee's
 *   violation count within a rolling window — counted cumulatively (repeat violations
 *   are NOT reset when an old reprimand soft-archives, see discipline.cron.ts).
 *
 *   Every insert path into discipline_records (late-arrival.service.ts,
 *   record-attendance.handler.ts, hr-compat-a.repository.ts, discipline-records-compat
 *   .service.ts, late-arrival-fine.cron.ts) calls `computeDisciplineEscalation()` before
 *   writing, and stamps `escalationStage` / `violationCountThisCategory` /
 *   `isFirstWarning` / `isSecondWarning` / `isFinalWarning` on the new row via
 *   `escalationFlags()`. The latter four columns already existed in the schema
 *   (lib/db/src/schema/discipline.ts) but were dormant (never set by any application
 *   code, confirmed via grep) — this brings them to life instead of adding parallel
 *   new columns for the same concept (Q-46).
 *
 *   Thresholds are business_settings-driven (Q-40 — never hardcoded): defaults reuse the
 *   3/5/8 figures already live as DISCIPLINE_LATE_WARNING_THRESHOLD /
 *   DISCIPLINE_LATE_REPRIMAND_THRESHOLD / DISCIPLINE_LATE_DISCHARGE_THRESHOLD
 *   (business.constants.ts, flagged in project_magic_numbers_verify_2026_07_07.md),
 *   generalised here from "late arrivals per calendar month" to "any discipline_records
 *   violation within a rolling window" (default 12 months).
 */

import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { getBusinessSettingNumber } from '../../../shared/config/business-settings.reader';

export type DisciplineEscalationStage = 'verbal' | 'written' | 'fine' | 'dismissal';

export interface DisciplineEscalationResult {
  stage: DisciplineEscalationStage;
  /** Violations in the rolling window INCLUDING the one about to be inserted. */
  cumulativeCount: number;
  /** Most recent prior (non-soft-deleted) discipline_records.id for this employee, if any. */
  previousRecordId: number | null;
}

/**
 * Computes the escalation stage that applies to a NEW violation being recorded for
 * `employeeId` right now. Fails open (returns stage='verbal', cumulativeCount=1,
 * previousRecordId=null) on any DB error so a business_settings/DB hiccup never blocks
 * the underlying discipline-record insert (Q-39 — the insert itself must not regress).
 */
export async function computeDisciplineEscalation(
  employeeId: number,
): Promise<DisciplineEscalationResult> {
  const windowMonths = await getBusinessSettingNumber('hr.discipline_escalation_window_months', 12);
  const writtenAt = await getBusinessSettingNumber('hr.discipline_written_threshold', 3);
  const fineAt = await getBusinessSettingNumber('hr.discipline_fine_threshold', 5);
  const dismissalAt = await getBusinessSettingNumber('hr.discipline_dismissal_threshold', 8);

  let existingCount = 0;
  let previousRecordId: number | null = null;
  try {
    const countResult = await runQuery<{ cnt: string }>(sql`
      SELECT COUNT(*)::text AS cnt FROM discipline_records
      WHERE employee_id = ${employeeId}
        AND is_soft_deleted = false
        AND violation_date >= (CURRENT_DATE - (${windowMonths} * INTERVAL '1 month'))
    `);
    existingCount = parseInt(countResult.rows[0]?.cnt ?? '0', 10) || 0;

    const lastResult = await runQuery<{ id: number }>(sql`
      SELECT id FROM discipline_records
      WHERE employee_id = ${employeeId} AND is_soft_deleted = false
      ORDER BY created_at DESC LIMIT 1
    `);
    previousRecordId = lastResult.rows[0]?.id ?? null;
  } catch {
    // fail-open — see doc-comment above
    existingCount = 0;
    previousRecordId = null;
  }

  const cumulativeCount = existingCount + 1;
  let stage: DisciplineEscalationStage = 'verbal';
  if (cumulativeCount >= dismissalAt) stage = 'dismissal';
  else if (cumulativeCount >= fineAt) stage = 'fine';
  else if (cumulativeCount >= writtenAt) stage = 'written';

  return { stage, cumulativeCount, previousRecordId };
}

/** Maps an escalation stage onto the (previously dormant) warning-ladder booleans. */
export function escalationFlags(stage: DisciplineEscalationStage): {
  isFirstWarning: boolean;
  isSecondWarning: boolean;
  isFinalWarning: boolean;
} {
  return {
    isFirstWarning: stage === 'written' || stage === 'fine' || stage === 'dismissal',
    isSecondWarning: stage === 'fine' || stage === 'dismissal',
    isFinalWarning: stage === 'dismissal',
  };
}
