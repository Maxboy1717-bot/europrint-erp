/**
 * @module candidate-rejected.event
 * @description Emitted when a Funnel aggregate transitions into the terminal
 * REJECTED stage. The reason is mandatory at the aggregate level so the
 * payload is non-null here.
 */

import { DomainEvent } from '@shared/domain/domain-event';

export interface CandidateRejectedEventProps {
  funnelId: number;
  candidateId: number;
  reason: string;
  rejectedAt: Date;
}

export class CandidateRejectedEvent extends DomainEvent {
  constructor(public readonly props: CandidateRejectedEventProps) {
    super(String(props.funnelId), 'CandidateRejected');
  }
}
