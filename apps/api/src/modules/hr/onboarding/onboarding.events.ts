/**
 * @module onboarding.events
 * @description Plain string-topic event(s) emitted by the REAL, wired onboarding
 * flow (`OnboardingService.completeProbation()` — the endpoint the app actually
 * calls: `PATCH /hr/onboarding/:id/complete-probation`).
 *
 * Context (Referral Tizimi completion, 2026-07-13, vizyon docs/vision/_parts/
 * 02-hr.md #12/#20/#21): the referral-bonus payroll wiring needs a real
 * "probation completed" signal to trigger on. There IS a `ProbationPeriodStartedEvent`
 * + a domain-event-class hierarchy on `OnboardingPlan` (domain/aggregates/
 * onboarding-plan.aggregate.ts + domain/events/*.event.ts) — but that aggregate is
 * only exercised by unit tests (apps/api/test/hr/onboarding-plan.aggregate.spec.ts);
 * its `getDomainEvents()` buffer is never drained/emitted onto EventEmitter2
 * anywhere in the actual request path. The REAL live code path is
 * `OnboardingService.completeProbation()`, which previously emitted no event at
 * all. Rather than build a second/parallel "probation completed" mechanism
 * (which would be the actual duplicate to avoid), this file adds the ONE plain
 * event the real flow is missing, following the same plain-string-topic
 * convention already used elsewhere in HR (e.g. recruitment-funnel.service.ts's
 * `CANDIDATE_STAGE_CHANGED_EVENT`, hr-v2-events.ts's `HrV2Events.*`).
 */

export const HR_PROBATION_COMPLETED_EVENT = 'hr.onboarding.probation-completed';

export interface ProbationCompletedPayload {
  onboardingId: number;
  /** employees.id — resolved via employees.user_id bridge (NOT users.id / onboarding.employeeId). */
  employeeId: number;
  probationScore?: number;
  completedAt: Date;
}
