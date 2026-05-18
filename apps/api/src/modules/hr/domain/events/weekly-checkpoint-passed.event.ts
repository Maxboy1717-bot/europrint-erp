/**
 * @module weekly-checkpoint-passed.event
 * @description Emitted by OnboardingPlan when a weekly checkpoint (1..6)
 * is submitted with non-empty proof and marked as `passed`. Downstream
 * consumers (HR dashboard, mentor bot) react without recomputing state.
 */

import { DomainEvent } from '@shared/domain/domain-event';

export interface WeeklyCheckpointPassedEventProps {
  planId: number;
  employeeId: number;
  weekNumber: number;
  passedAt: Date;
}

export class WeeklyCheckpointPassedEvent extends DomainEvent {
  constructor(public readonly props: WeeklyCheckpointPassedEventProps) {
    super(String(props.planId), 'WeeklyCheckpointPassed');
  }
}
