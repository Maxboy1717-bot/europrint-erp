/**
 * @module hr-candidate-added.event
 * @description Wave 4 round-3 (PA2-18): canonical CQRS event class for the
 *   `hr.candidate.added` topic. The AI automation listener was previously
 *   listening via `@OnEvent('hr.candidate.added')`; it now subscribes to this
 *   class.
 *
 *   No production code currently publishes this event on the CQRS bus or the
 *   EventEmitter2 namespace — the listener was already a dead-letter prior
 *   to migration.
 */

import { DomainEvent } from '@shared/domain/domain-event';

export interface HrCandidateAddedEventProps {
  candidateId: number;
  funnelId: number;
  userId: number;
}

export class HrCandidateAddedEvent extends DomainEvent {
  constructor(public readonly props: HrCandidateAddedEventProps) {
    super(String(props.candidateId), 'HrCandidateAdded');
  }
}
