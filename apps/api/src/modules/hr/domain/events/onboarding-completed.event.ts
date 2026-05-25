/**
 * @module onboarding-completed.event
 * @description Emitted when all 6 weekly checkpoints pass and the
 * OnboardingPlan transitions to `completed`. Signals the start of the
 * probation period (30/60/90-day milestones).
 */

import { DomainEvent } from '@shared/domain/domain-event';

export interface OnboardingCompletedEventProps {
  planId: number;
  employeeId: number;
  completedAt: Date;
}

export class OnboardingCompletedEvent extends DomainEvent {
  constructor(public readonly props: OnboardingCompletedEventProps) {
    super(String(props.planId), 'OnboardingCompleted');
  }
}
