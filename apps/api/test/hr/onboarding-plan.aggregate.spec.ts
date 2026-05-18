/**
 * @module test/hr/onboarding-plan.aggregate.spec
 * @description Unit tests for the OnboardingPlan aggregate (HR Tier-2
 * task H.11). Covers the 6-week state machine, weekly checkpoint
 * invariants, the 30/60/90 probation rule, and the domain-event drain
 * semantics that mirror PayrollRecord / LeaveRequest.
 */

import {
  OnboardingPlan,
  OnboardingPlanProps,
  WeeklyCheckpoint,
} from '../../src/modules/hr/domain/aggregates/onboarding-plan.aggregate';
import { OnboardingStartedEvent } from '../../src/modules/hr/domain/events/onboarding-started.event';
import { WeeklyCheckpointPassedEvent } from '../../src/modules/hr/domain/events/weekly-checkpoint-passed.event';
import { WeeklyCheckpointFailedEvent } from '../../src/modules/hr/domain/events/weekly-checkpoint-failed.event';
import { OnboardingCompletedEvent } from '../../src/modules/hr/domain/events/onboarding-completed.event';
import { ProbationPeriodStartedEvent } from '../../src/modules/hr/domain/events/probation-period-started.event';

// ─── Helpers ────────────────────────────────────────────────────────────────
function unwrap<T>(r: { ok: true; data: T } | { ok: false; error: { message: string } }): T {
  if (!r.ok) throw new Error(`Expected Ok but got Err: ${r.error.message}`);
  return r.data;
}

function freshPlan(overrides: Partial<{ id: number; employeeId: number; startDate: Date }> = {}) {
  return unwrap(
    OnboardingPlan.create({
      id: overrides.id ?? 1,
      employeeId: overrides.employeeId ?? 100,
      startDate: overrides.startDate ?? new Date('2026-05-18T00:00:00Z'),
    }),
  );
}

/** Convenience: start + submit all 6 weeks as passed. */
function planAllPassed(): OnboardingPlan {
  const plan = freshPlan();
  expect(plan.start().ok).toBe(true);
  for (let w = 1; w <= 6; w++) {
    expect(plan.submitWeeklyCheckpoint(w, `proof-week-${w}`).ok).toBe(true);
  }
  return plan;
}

// ─── create() ──────────────────────────────────────────────────────────────
describe('OnboardingPlan.create', () => {
  it('starts in `planned` status with 6 pending weekly checkpoints', () => {
    const plan = freshPlan();
    expect(plan.status).toBe('planned');
    expect(plan.weeklyCheckpoints).toHaveLength(6);
    plan.weeklyCheckpoints.forEach((c: WeeklyCheckpoint, idx) => {
      expect(c.weekNumber).toBe(idx + 1);
      expect(c.result).toBe('pending');
      expect(c.proof).toBeNull();
      expect(c.reviewedAt).toBeNull();
    });
    expect(plan.probationCheckpoints).toHaveLength(0);
    expect(plan.getDomainEvents()).toHaveLength(0);
  });

  it('derives expectedEndDate = startDate + 6 weeks when not provided', () => {
    const start = new Date('2026-05-18T00:00:00Z');
    const plan = unwrap(
      OnboardingPlan.create({ id: 1, employeeId: 100, startDate: start }),
    );
    const SIX_WEEKS_MS = 6 * 7 * 24 * 60 * 60 * 1000;
    expect(plan.expectedEndDate.getTime() - plan.startDate.getTime()).toBe(SIX_WEEKS_MS);
  });

  it('rejects when expectedEndDate is on/before startDate', () => {
    const start = new Date('2026-05-18T00:00:00Z');
    const r = OnboardingPlan.create({
      id: 1,
      employeeId: 100,
      startDate: start,
      expectedEndDate: start,
    });
    expect(r.ok).toBe(false);
  });

  it('rejects when startDate is not a valid Date', () => {
    const r = OnboardingPlan.create({
      id: 1,
      employeeId: 100,
      startDate: new Date('not-a-date'),
    });
    expect(r.ok).toBe(false);
  });
});

// ─── start() ───────────────────────────────────────────────────────────────
describe('OnboardingPlan.start', () => {
  it('transitions planned → started and emits OnboardingStartedEvent', () => {
    const plan = freshPlan();
    const r = plan.start();
    expect(r.ok).toBe(true);
    expect(plan.status).toBe('started');
    const events = plan.getDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(OnboardingStartedEvent);
    expect((events[0] as OnboardingStartedEvent).props.planId).toBe(plan.id);
    expect((events[0] as OnboardingStartedEvent).props.employeeId).toBe(plan.employeeId);
  });

  it('rejects starting twice', () => {
    const plan = freshPlan();
    expect(plan.start().ok).toBe(true);
    const second = plan.start();
    expect(second.ok).toBe(false);
    // No new event added on the failed transition.
    expect(plan.getDomainEvents()).toHaveLength(1);
  });
});

// ─── submitWeeklyCheckpoint() ──────────────────────────────────────────────
describe('OnboardingPlan.submitWeeklyCheckpoint', () => {
  it('week 1 happy path emits WeeklyCheckpointPassedEvent and advances to in_progress', () => {
    const plan = freshPlan();
    expect(plan.start().ok).toBe(true);
    plan.clearDomainEvents();

    const r = plan.submitWeeklyCheckpoint(1, 'https://docs/proof-1.pdf', 42);
    expect(r.ok).toBe(true);
    expect(plan.status).toBe('in_progress');
    expect(plan.weeklyCheckpoints[0]?.result).toBe('passed');
    expect(plan.weeklyCheckpoints[0]?.reviewerId).toBe(42);

    const events = plan.getDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(WeeklyCheckpointPassedEvent);
    expect((events[0] as WeeklyCheckpointPassedEvent).props.weekNumber).toBe(1);
  });

  it('empty proof emits WeeklyCheckpointFailedEvent', () => {
    const plan = freshPlan();
    expect(plan.start().ok).toBe(true);
    plan.clearDomainEvents();

    const r = plan.submitWeeklyCheckpoint(2, '   ');
    expect(r.ok).toBe(true);
    expect(plan.weeklyCheckpoints[1]?.result).toBe('failed');

    const events = plan.getDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(WeeklyCheckpointFailedEvent);
    expect((events[0] as WeeklyCheckpointFailedEvent).props.weekNumber).toBe(2);
  });

  it('rejects week numbers out of the 1..6 range', () => {
    const plan = freshPlan();
    expect(plan.start().ok).toBe(true);
    expect(plan.submitWeeklyCheckpoint(0, 'p').ok).toBe(false);
    expect(plan.submitWeeklyCheckpoint(7, 'p').ok).toBe(false);
    expect(plan.submitWeeklyCheckpoint(-1, 'p').ok).toBe(false);
    expect(plan.submitWeeklyCheckpoint(1.5, 'p').ok).toBe(false);
  });

  it('rejects duplicate submission for the same week', () => {
    const plan = freshPlan();
    expect(plan.start().ok).toBe(true);
    expect(plan.submitWeeklyCheckpoint(3, 'p').ok).toBe(true);
    const second = plan.submitWeeklyCheckpoint(3, 'p2');
    expect(second.ok).toBe(false);
  });

  it('rejects when status is `planned` (must call start() first)', () => {
    const plan = freshPlan();
    const r = plan.submitWeeklyCheckpoint(1, 'p');
    expect(r.ok).toBe(false);
  });
});

// ─── completeOnboarding() ──────────────────────────────────────────────────
describe('OnboardingPlan.completeOnboarding', () => {
  it('rejects when not all 6 weeks are passed', () => {
    const plan = freshPlan();
    expect(plan.start().ok).toBe(true);
    expect(plan.submitWeeklyCheckpoint(1, 'p').ok).toBe(true);
    expect(plan.submitWeeklyCheckpoint(2, '').ok).toBe(true); // failed
    expect(plan.submitWeeklyCheckpoint(3, 'p').ok).toBe(true);
    // weeks 4..6 still pending
    const r = plan.completeOnboarding();
    expect(r.ok).toBe(false);
    expect(plan.status).toBe('in_progress');
  });

  it('happy path: all 6 weeks passed → completed, emits OnboardingCompletedEvent', () => {
    const plan = planAllPassed();
    plan.clearDomainEvents();
    const r = plan.completeOnboarding();
    expect(r.ok).toBe(true);
    expect(plan.status).toBe('completed');
    const events = plan.getDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(OnboardingCompletedEvent);
    expect((events[0] as OnboardingCompletedEvent).props.employeeId).toBe(plan.employeeId);
  });
});

// ─── probationCheckpoint() ─────────────────────────────────────────────────
describe('OnboardingPlan.probationCheckpoint', () => {
  it('rejects when status is not `completed`', () => {
    const plan = freshPlan();
    expect(plan.start().ok).toBe(true);
    const r = plan.probationCheckpoint(30, 'feedback', 'passed');
    expect(r.ok).toBe(false);
  });

  it('rejects invalid dayNumber (e.g. 45)', () => {
    const plan = planAllPassed();
    expect(plan.completeOnboarding().ok).toBe(true);
    // Cast to bypass TS literal-type narrowing — runtime guard is what we exercise.
    const r = plan.probationCheckpoint(45 as unknown as 30, 'fb', 'passed');
    expect(r.ok).toBe(false);
  });

  it('emits ProbationPeriodStartedEvent on the first checkpoint only', () => {
    const plan = planAllPassed();
    expect(plan.completeOnboarding().ok).toBe(true);
    plan.clearDomainEvents();

    const r30 = plan.probationCheckpoint(30, 'looking good', 'passed');
    expect(r30.ok).toBe(true);
    let events = plan.getDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(ProbationPeriodStartedEvent);
    expect((events[0] as ProbationPeriodStartedEvent).props.dayNumber).toBe(30);

    plan.clearDomainEvents();
    const r60 = plan.probationCheckpoint(60, 'still ok', 'passed');
    expect(r60.ok).toBe(true);
    // Subsequent checkpoint must NOT re-emit the "started" event.
    events = plan.getDomainEvents();
    expect(events).toHaveLength(0);
    expect(plan.probationCheckpoints).toHaveLength(2);
  });

  it('rejects duplicate dayNumber', () => {
    const plan = planAllPassed();
    expect(plan.completeOnboarding().ok).toBe(true);
    expect(plan.probationCheckpoint(30, 'fb', 'passed').ok).toBe(true);
    const dup = plan.probationCheckpoint(30, 'fb2', 'passed');
    expect(dup.ok).toBe(false);
  });
});

// ─── Event drain ───────────────────────────────────────────────────────────
describe('OnboardingPlan event drain', () => {
  it('clearDomainEvents empties the buffer', () => {
    const plan = freshPlan();
    expect(plan.start().ok).toBe(true);
    expect(plan.getDomainEvents()).toHaveLength(1);
    plan.clearDomainEvents();
    expect(plan.getDomainEvents()).toHaveLength(0);
  });
});

// ─── fromProps() ───────────────────────────────────────────────────────────
describe('OnboardingPlan.fromProps', () => {
  it('hydrates without emitting events', () => {
    const start = new Date('2026-05-18T00:00:00Z');
    const props: OnboardingPlanProps = {
      id: 7,
      employeeId: 99,
      startDate: start,
      expectedEndDate: new Date(start.getTime() + 6 * 7 * 24 * 60 * 60 * 1000),
      status: 'in_progress',
      weeklyCheckpoints: [
        { weekNumber: 1, result: 'passed', proof: 'p', reviewedAt: start, reviewerId: 1 },
        { weekNumber: 2, result: 'pending', proof: null, reviewedAt: null, reviewerId: null },
        { weekNumber: 3, result: 'pending', proof: null, reviewedAt: null, reviewerId: null },
        { weekNumber: 4, result: 'pending', proof: null, reviewedAt: null, reviewerId: null },
        { weekNumber: 5, result: 'pending', proof: null, reviewedAt: null, reviewerId: null },
        { weekNumber: 6, result: 'pending', proof: null, reviewedAt: null, reviewerId: null },
      ],
      probationCheckpoints: [],
      createdAt: start,
      updatedAt: start,
    };
    const plan = OnboardingPlan.fromProps(props);
    expect(plan.id).toBe(7);
    expect(plan.status).toBe('in_progress');
    expect(plan.weeklyCheckpoints[0]?.result).toBe('passed');
    expect(plan.getDomainEvents()).toHaveLength(0);
  });
});
