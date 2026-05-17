/**
 * PipWorkflowService — pure domain logic for Performance Improvement Plan.
 *
 * Responsibilities:
 *   - Validate PIP creation inputs (duration, dates, goals)
 *   - Validate progress-update status transitions
 *   - Compute outcome (PASSED / FAILED / EXTENDED) from progress history
 *   - Determine whether a PIP is overdue (active && end_date < today)
 *
 * No DB / HTTP dependencies — fully unit-testable.
 */
import { Injectable } from '@nestjs/common';
import { Result, Ok, Err, AppErr } from '@common/result';
import { MS_PER_DAY } from '@common/constants/app.constants';

export type PipStatus = 'active' | 'completed' | 'failed' | 'cancelled';
export type PipProgressStatus = 'on_track' | 'at_risk' | 'off_track' | 'completed' | 'failed';

export interface PipCreateInput {
  employeeId: number;
  createdBy: number;
  durationDays?: number;
  startDate?: string;
  endDate?: string;
  goals?: string;
  successCriteria?: string;
  supervisorId?: number;
}

export interface PipCreatePlan {
  employeeId: number;
  createdBy: number;
  supervisorId?: number;
  durationDays: number;
  startDate: string;
  endDate: string;
  goals: string;
  successCriteria?: string;
}

const VALID_TRANSITIONS: Record<PipStatus, PipStatus[]> = {
  active:    ['completed', 'failed', 'cancelled'],
  completed: [],
  failed:    [],
  cancelled: [],
};

const VALID_PROGRESS_STATUSES: readonly PipProgressStatus[] = [
  'on_track', 'at_risk', 'off_track', 'completed', 'failed',
];

const MIN_DURATION_DAYS = 7;
const MAX_DURATION_DAYS = 180;
const DEFAULT_DURATION_DAYS = 30;

@Injectable()
export class PipWorkflowService {
  /**
   * Build a normalized create-plan from raw input.
   * - Default duration: 30 days
   * - Default startDate: today (ISO yyyy-mm-dd)
   * - Default endDate: startDate + durationDays
   * - duration must be in [7..180]
   * - endDate must be > startDate
   */
  buildPlan(input: PipCreateInput, today: Date = new Date()): Result<PipCreatePlan> {
    const duration = input.durationDays ?? DEFAULT_DURATION_DAYS;
    if (!Number.isFinite(duration) || duration < MIN_DURATION_DAYS || duration > MAX_DURATION_DAYS) {
      return Err(AppErr('VALIDATION', `PIP duration ${MIN_DURATION_DAYS}..${MAX_DURATION_DAYS} kun oraligida bo'lishi kerak`));
    }

    const startIso = input.startDate || this.toIsoDate(today);
    const startTs  = this.parseIsoDate(startIso);
    if (startTs === null) return Err(AppErr('VALIDATION', `start_date noto'g'ri: ${input.startDate}`));

    let endIso: string;
    if (input.endDate) {
      const endTs = this.parseIsoDate(input.endDate);
      if (endTs === null) return Err(AppErr('VALIDATION', `end_date noto'g'ri: ${input.endDate}`));
      if (endTs <= startTs) return Err(AppErr('VALIDATION', "end_date start_date dan keyin bo'lishi kerak"));
      endIso = input.endDate;
    } else {
      endIso = this.toIsoDate(new Date(startTs + duration * MS_PER_DAY));
    }

    return Ok({
      employeeId: input.employeeId,
      createdBy: input.createdBy,
      supervisorId: input.supervisorId,
      durationDays: duration,
      startDate: startIso,
      endDate: endIso,
      goals: input.goals ?? '',
      successCriteria: input.successCriteria,
    });
  }

  /** Validate that a progress status value is allowed. */
  validateProgressStatus(status: string | undefined): Result<PipProgressStatus> {
    const s = (status ?? 'on_track') as PipProgressStatus;
    if (!VALID_PROGRESS_STATUSES.includes(s)) {
      return Err(AppErr('VALIDATION', `Progress status noto'g'ri: ${status}`));
    }
    return Ok(s);
  }

  /** Allowed PIP-status transitions. */
  canTransition(from: PipStatus, to: PipStatus): boolean {
    const allowed = VALID_TRANSITIONS[from] ?? [];
    return Array.isArray(allowed) && allowed.includes(to);
  }

  assertTransition(from: PipStatus, to: PipStatus): Result<{ from: PipStatus; to: PipStatus }> {
    if (!this.canTransition(from, to)) {
      return Err(AppErr('INVALID_TRANSITION', `PIP holatini ${from} dan ${to} ga o'zgartirib bo'lmaydi`));
    }
    return Ok({ from, to });
  }

  /**
   * Decide outcome from a progress update status:
   *   - 'completed' → mark plan as completed (PASSED outcome)
   *   - 'failed'    → mark plan as failed   (FAILED outcome)
   *   - others      → keep active
   */
  outcomeFromProgress(progressStatus: PipProgressStatus): { newStatus: PipStatus; outcome: 'PASSED' | 'FAILED' | null } {
    if (progressStatus === 'completed') return { newStatus: 'completed', outcome: 'PASSED' };
    if (progressStatus === 'failed')    return { newStatus: 'failed',    outcome: 'FAILED' };
    return { newStatus: 'active', outcome: null };
  }

  /** Check whether a PIP is overdue given today's date (YYYY-MM-DD strings). */
  isOverdue(plan: { status: PipStatus; endDate: string }, today: string): boolean {
    if (plan.status !== 'active') return false;
    const end = this.parseIsoDate(plan.endDate);
    const now = this.parseIsoDate(today);
    if (end === null || now === null) return false;
    return end < now;
  }

  /** Compute progress percentage based on elapsed days within the plan window. */
  computeElapsedPercent(plan: { startDate: string; endDate: string }, today: string): number {
    const start = this.parseIsoDate(plan.startDate);
    const end   = this.parseIsoDate(plan.endDate);
    const now   = this.parseIsoDate(today);
    if (start === null || end === null || now === null) return 0;
    const total = end - start;
    if (total <= 0) return 0;
    const elapsed = Math.max(0, Math.min(total, now - start));
    return Math.round((elapsed / total) * 100);
  }

  // ─── helpers ────────────────────────────────────────────────────────────
  private toIsoDate(d: Date): string {
    return d.toISOString().split('T')[0]!;
  }

  private parseIsoDate(iso: string): number | null {
    if (typeof iso !== 'string') return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    if (!m) return null;
    const y = Number(m[1]); const mo = Number(m[2]) - 1; const d = Number(m[3]);
    const ts = Date.UTC(y, mo, d);
    return Number.isFinite(ts) ? ts : null;
  }
}
