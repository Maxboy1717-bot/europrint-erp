/**
 * @module onboarding-plan.aggregate
 * @description OnboardingPlan aggregate root — encapsulates the 6-week
 * onboarding state machine plus the 30/60/90-day probation checkpoints.
 *
 * Pattern: follows LeaveRequest / PayrollRecord (private `props` bag,
 * getters, state-transitions return `Result<void>`, internal
 * `events: DomainEvent[]` buffer drained via `getDomainEvents()` +
 * `clearDomainEvents()`). Closes the procedural-service finding from the
 * HR Tier-2 audit (task H.11).
 *
 * State machine:
 *   planned → started → in_progress → completed
 *                                  ↘ failed / abandoned (terminal)
 *
 * Invariants:
 *   - start() only valid from `planned`
 *   - submitWeeklyCheckpoint: status ∈ {started, in_progress}, week 1..6,
 *     no duplicate; advances started → in_progress on first submission
 *   - completeOnboarding requires all 6 weeklyCheckpoints `result === 'passed'`
 *   - probationCheckpoint requires status `completed`, dayNumber ∈ {30, 60, 90}
 */

import { Logger } from '@nestjs/common';
import { TashkentTimeService } from '@common/time';
import { Result, Ok, Err, AppErr } from '@common/types/result.type';
import { DomainEvent } from '@shared/domain/domain-event';
import { OnboardingStartedEvent } from '../events/onboarding-started.event';
import { WeeklyCheckpointPassedEvent } from '../events/weekly-checkpoint-passed.event';
import { WeeklyCheckpointFailedEvent } from '../events/weekly-checkpoint-failed.event';
import { OnboardingCompletedEvent } from '../events/onboarding-completed.event';
import { ProbationPeriodStartedEvent } from '../events/probation-period-started.event';

const _time = new TashkentTimeService();

const WEEKS_TOTAL = 6;
const SIX_WEEKS_MS = WEEKS_TOTAL * 7 * 24 * 60 * 60 * 1000;
const VALID_PROBATION_DAYS: ReadonlyArray<number> = [30, 60, 90];

export type OnboardingStatus =
  | 'planned' | 'started' | 'in_progress' | 'completed' | 'failed' | 'abandoned';

export type CheckpointResult = 'passed' | 'failed' | 'pending';

export interface WeeklyCheckpoint {
  weekNumber: number;
  result: CheckpointResult;
  proof: string | null;
  reviewedAt: Date | null;
  reviewerId: number | null;
}

export interface ProbationCheckpoint {
  dayNumber: number;
  feedback: string;
  result: CheckpointResult;
  recordedAt: Date;
}

export interface OnboardingPlanProps {
  id: number;
  employeeId: number;
  startDate: Date;
  expectedEndDate: Date;
  status: OnboardingStatus;
  weeklyCheckpoints: WeeklyCheckpoint[];
  probationCheckpoints: ProbationCheckpoint[];
  createdAt: Date;
  updatedAt: Date;
}

export class OnboardingPlan {
  private readonly logger = new Logger(OnboardingPlan.name);
  private events: DomainEvent[] = [];

  private constructor(private props: OnboardingPlanProps) {}

  /**
   * Build a brand-new OnboardingPlan in `planned` state. Auto-derives
   * `expectedEndDate = startDate + 6 weeks` and stubs all 6 weekly
   * checkpoints as `pending`. Rejects zero/negative duration inputs.
   */
  static create(args: {
    id?: number;
    employeeId: number;
    startDate: Date;
    expectedEndDate?: Date;
    createdAt?: Date;
  }): Result<OnboardingPlan> {
    if (!(args.startDate instanceof Date) || Number.isNaN(args.startDate.getTime())) {
      return Err(AppErr('VALIDATION', "Onboarding startDate noto'g'ri"));
    }
    const expectedEndDate =
      args.expectedEndDate ?? new Date(args.startDate.getTime() + SIX_WEEKS_MS);
    if (!(expectedEndDate instanceof Date) || Number.isNaN(expectedEndDate.getTime())) {
      return Err(AppErr('VALIDATION', "Onboarding expectedEndDate noto'g'ri"));
    }
    if (expectedEndDate.getTime() <= args.startDate.getTime()) {
      return Err(AppErr('VALIDATION', "startDate expectedEndDate'dan oldin bo'lishi kerak"));
    }

    const now = args.createdAt ?? _time.now();
    const weeklyCheckpoints: WeeklyCheckpoint[] = [];
    for (let w = 1; w <= WEEKS_TOTAL; w++) {
      weeklyCheckpoints.push({
        weekNumber: w, result: 'pending', proof: null, reviewedAt: null, reviewerId: null,
      });
    }
    return Ok(new OnboardingPlan({
      id: args.id ?? 0,
      employeeId: args.employeeId,
      startDate: args.startDate,
      expectedEndDate,
      status: 'planned',
      weeklyCheckpoints,
      probationCheckpoints: [],
      createdAt: now,
      updatedAt: now,
    }));
  }

  /** Hydrate from a persisted row. No event emission. */
  static fromProps(props: OnboardingPlanProps): OnboardingPlan {
    return new OnboardingPlan({
      ...props,
      weeklyCheckpoints: [...props.weeklyCheckpoints],
      probationCheckpoints: [...props.probationCheckpoints],
    });
  }

  // ─── Getters ────────────────────────────────────────────────────────────
  get id(): number { return this.props.id; }
  get employeeId(): number { return this.props.employeeId; }
  get startDate(): Date { return this.props.startDate; }
  get expectedEndDate(): Date { return this.props.expectedEndDate; }
  get status(): OnboardingStatus { return this.props.status; }
  get weeklyCheckpoints(): ReadonlyArray<WeeklyCheckpoint> { return this.props.weeklyCheckpoints; }
  get probationCheckpoints(): ReadonlyArray<ProbationCheckpoint> { return this.props.probationCheckpoints; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // ─── State transitions ──────────────────────────────────────────────────

  /** Kick off the onboarding window. `planned` → `started`. */
  start(): Result<void> {
    if (this.props.status !== 'planned') {
      return Err(AppErr('INVALID_TRANSITION',
        `Onboarding faqat 'planned' holatdan boshlanadi (joriy: ${this.props.status})`));
    }
    const now = _time.now();
    this.props.status = 'started';
    this.props.updatedAt = now;
    this.events.push(new OnboardingStartedEvent({
      planId: this.props.id, employeeId: this.props.employeeId, startedAt: now,
    }));
    return Ok();
  }

  /**
   * Record the weekly checkpoint for week `weekNumber` (1..6). Non-empty
   * (trimmed) `proof` ⇒ `passed`; empty ⇒ `failed`. Auto-advances
   * `started` → `in_progress` on first submission. Rejects duplicates.
   */
  submitWeeklyCheckpoint(weekNumber: number, proof: string, reviewerId?: number): Result<void> {
    if (this.props.status !== 'started' && this.props.status !== 'in_progress') {
      return Err(AppErr('INVALID_TRANSITION',
        `Haftalik checkpoint faqat 'started'/'in_progress' holatda yuboriladi (joriy: ${this.props.status})`));
    }
    if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > WEEKS_TOTAL) {
      return Err(AppErr('VALIDATION',
        `weekNumber 1..${WEEKS_TOTAL} oralig'ida bo'lishi kerak (kelgan: ${weekNumber})`));
    }
    const idx = this.props.weeklyCheckpoints.findIndex((c) => c.weekNumber === weekNumber);
    if (idx < 0) {
      return Err(AppErr('INTERNAL', `Hafta ${weekNumber} checkpoint topilmadi`));
    }
    const existing = this.props.weeklyCheckpoints[idx];
    if (existing && existing.result !== 'pending') {
      return Err(AppErr('BUSINESS_RULE_VIOLATION',
        `Hafta ${weekNumber} uchun checkpoint allaqachon yuborilgan`));
    }

    const now = _time.now();
    const trimmed = (proof ?? '').trim();
    const passed = trimmed.length > 0;
    this.props.weeklyCheckpoints[idx] = {
      weekNumber,
      result: passed ? 'passed' : 'failed',
      proof: passed ? trimmed : null,
      reviewedAt: now,
      reviewerId: reviewerId ?? null,
    };
    if (this.props.status === 'started') this.props.status = 'in_progress';
    this.props.updatedAt = now;

    if (passed) {
      this.events.push(new WeeklyCheckpointPassedEvent({
        planId: this.props.id, employeeId: this.props.employeeId, weekNumber, passedAt: now,
      }));
    } else {
      this.events.push(new WeeklyCheckpointFailedEvent({
        planId: this.props.id, employeeId: this.props.employeeId, weekNumber,
        reason: "Proof bo'sh — checkpoint passed deb belgilanmadi", failedAt: now,
      }));
    }
    return Ok();
  }

  /**
   * Close the onboarding. Requires all 6 weekly checkpoints
   * `result === 'passed'`. `in_progress` → `completed`. Idempotent on
   * `completed`.
   */
  completeOnboarding(): Result<void> {
    if (this.props.status === 'completed') return Ok();
    if (this.props.status !== 'in_progress' && this.props.status !== 'started') {
      return Err(AppErr('INVALID_TRANSITION',
        `Onboarding faqat 'in_progress' holatdan yopiladi (joriy: ${this.props.status})`));
    }
    const allPassed =
      this.props.weeklyCheckpoints.length === WEEKS_TOTAL &&
      this.props.weeklyCheckpoints.every((c) => c.result === 'passed');
    if (!allPassed) {
      return Err(AppErr('BUSINESS_RULE_VIOLATION',
        `Barcha ${WEEKS_TOTAL} haftalik checkpoint 'passed' bo'lishi kerak`));
    }
    const now = _time.now();
    this.props.status = 'completed';
    this.props.updatedAt = now;
    this.events.push(new OnboardingCompletedEvent({
      planId: this.props.id, employeeId: this.props.employeeId, completedAt: now,
    }));
    return Ok();
  }

  /**
   * Record a probation checkpoint at day 30 / 60 / 90 after completion.
   * Emits ProbationPeriodStartedEvent on the first call only.
   */
  probationCheckpoint(dayNumber: 30 | 60 | 90, feedback: string, result: CheckpointResult): Result<void> {
    if (this.props.status !== 'completed') {
      return Err(AppErr('INVALID_TRANSITION',
        `Probation checkpoint faqat 'completed' holatda qabul qilinadi (joriy: ${this.props.status})`));
    }
    if (!VALID_PROBATION_DAYS.includes(dayNumber)) {
      return Err(AppErr('VALIDATION',
        `dayNumber {30, 60, 90} dan bo'lishi kerak (kelgan: ${dayNumber})`));
    }
    if (this.props.probationCheckpoints.some((p) => p.dayNumber === dayNumber)) {
      return Err(AppErr('BUSINESS_RULE_VIOLATION',
        `Probation kuni ${dayNumber} uchun checkpoint allaqachon yozilgan`));
    }
    const now = _time.now();
    const isFirst = this.props.probationCheckpoints.length === 0;
    this.props.probationCheckpoints.push({ dayNumber, feedback, result, recordedAt: now });
    this.props.updatedAt = now;
    if (isFirst) {
      this.events.push(new ProbationPeriodStartedEvent({
        planId: this.props.id, employeeId: this.props.employeeId, dayNumber, startedAt: now,
      }));
    }
    return Ok();
  }

  // ─── Event buffer ───────────────────────────────────────────────────────
  getDomainEvents(): DomainEvent[] { return this.events; }
  clearDomainEvents(): void { this.events = []; }
}
