/**
 * @module candidate-hired.event
 * @description Emitted when a Funnel aggregate transitions into the terminal
 * HIRED stage via `hire`. Carries the resulting Employee id so HR onboarding
 * can pick up the new hire without re-querying.
 */

import { DomainEvent } from '@shared/domain/domain-event';

export interface CandidateHiredEventProps {
  funnelId: number;
  candidateId: number;
  employeeId: number;
  hiredAt: Date;
}

export class CandidateHiredEvent extends DomainEvent {
  constructor(public readonly props: CandidateHiredEventProps) {
    super(String(props.funnelId), 'CandidateHired');
  }
}
