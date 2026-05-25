/**
 * @module onboarding-started.event
 * @description Emitted when an OnboardingPlan transitions from `planned`
 * to `started`. Marks the official kickoff of the 6-week onboarding window.
 */

import { DomainEvent } from '@shared/domain/domain-event';

export interface OnboardingStartedEventProps {
  planId: number;
  employeeId: number;
  startedAt: Date;
}

export class OnboardingStartedEvent extends DomainEvent {
  constructor(public readonly props: OnboardingStartedEventProps) {
    super(String(props.planId), 'OnboardingStarted');
  }
}
