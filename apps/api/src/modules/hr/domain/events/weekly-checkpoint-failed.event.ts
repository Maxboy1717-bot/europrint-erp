/**
 * @module weekly-checkpoint-failed.event
 * @description Emitted by OnboardingPlan when a weekly checkpoint (1..6)
 * is submitted without proof or explicitly marked as failed. Carries the
 * reason so HR can trigger remediation flows.
 */

import { DomainEvent } from '@shared/domain/domain-event';

export interface WeeklyCheckpointFailedEventProps {
  planId: number;
  employeeId: number;
  weekNumber: number;
  reason: string;
  failedAt: Date;
}

export class WeeklyCheckpointFailedEvent extends DomainEvent {
  constructor(public readonly props: WeeklyCheckpointFailedEventProps) {
    super(String(props.planId), 'WeeklyCheckpointFailed');
  }
}
