/**
 * @module tech-three-checkpoint.event
 * @description Wave 4 round-4 (PA2-18): canonical CQRS event class for the
 *   `pp.tech.three_checkpoint_passed` topic (ERP_EVENTS.TECH_THREE_CHECKPOINT).
 *
 *   The `TechThreeCheckpointListener.handle` listener was previously listening
 *   via `@OnEvent(ERP_EVENTS.TECH_THREE_CHECKPOINT)`; it now subscribes to this
 *   class. EventBridge keeps re-emitting to the legacy string topic for any
 *   non-migrated consumers — see EVENT_NAME_MAP entry in
 *   event-bridge.service.ts.
 *
 *   No production code currently publishes this event on either bus —
 *   the listener was already a dead-letter prior to migration.
 *
 *   Trigger 6 — Tech 3-checkpoint to'liq tasdiqlandi → FI advance check.
 */

import { DomainEvent } from '@shared/domain/domain-event';

export interface TechThreeCheckpointEventProps {
  orderId: number;
  approvedBy?: number;
  approvedAt?: string;
}

export class TechThreeCheckpointEvent extends DomainEvent {
  constructor(public readonly props: TechThreeCheckpointEventProps) {
    super(String(props.orderId), 'TechThreeCheckpoint');
  }
}
