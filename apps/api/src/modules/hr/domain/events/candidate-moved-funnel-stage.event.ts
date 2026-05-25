/**
 * @module candidate-moved-funnel-stage.event
 * @description Emitted when a Funnel aggregate transitions between two valid
 * stages (not REJECTED, not HIRED — those have dedicated terminal events).
 * Carries both the from- and to-stage so consumers (Kanban gateway, audit
 * log, analytics) can render the move without re-reading state.
 */

import { DomainEvent } from '@shared/domain/domain-event';

export interface CandidateMovedFunnelStageEventProps {
  funnelId: number;
  candidateId: number;
  fromStage: string;
  toStage: string;
  movedAt: Date;
}

export class CandidateMovedFunnelStageEvent extends DomainEvent {
  constructor(public readonly props: CandidateMovedFunnelStageEventProps) {
    super(String(props.funnelId), 'CandidateMovedFunnelStage');
  }
}
