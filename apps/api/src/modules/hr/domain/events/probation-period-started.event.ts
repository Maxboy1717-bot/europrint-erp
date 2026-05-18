/**
 * @module probation-period-started.event
 * @description Emitted on the first probation checkpoint recorded after
 * onboarding completion (day 30 / 60 / 90 milestone). Subsequent checkpoints
 * within the same probation window do NOT re-emit this event.
 */

import { DomainEvent } from '@shared/domain/domain-event';

export interface ProbationPeriodStartedEventProps {
  planId: number;
  employeeId: number;
  dayNumber: number;
  startedAt: Date;
}

export class ProbationPeriodStartedEvent extends DomainEvent {
  constructor(public readonly props: ProbationPeriodStartedEventProps) {
    super(String(props.planId), 'ProbationPeriodStarted');
  }
}
