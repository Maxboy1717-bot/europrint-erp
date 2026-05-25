/**
 * @module pos-movement-completed.event
 * @description Wave 4 round-4 (PA2-18): canonical CQRS event class for the
 *   `pos.movement.data.completed` topic.
 *
 *   Consumers previously listening via `@OnEvent('pos.movement.data.completed')`:
 *     - PosGlAutoService.onMovementCompleted   (auto-GL posting)
 *     - PosWmsSyncService.onMovementCompleted  (WMS stock sync)
 *     - PosEventHandler.onMovementCompleted    (broadcast + notification — still on legacy string topic, 10-decorator file untouched)
 *
 *   EventBridge re-emits to the legacy string topic for non-migrated consumers
 *   — see EVENT_NAME_MAP entry in event-bridge.service.ts.
 *
 *   No production code currently publishes this topic on either bus (no
 *   `eventEmitter.emit('pos.movement.data.completed', ...)` call exists in
 *   the codebase today). All three consumers were therefore already
 *   dead-letter prior to this migration — converting them to typed handlers
 *   does not change runtime behaviour.
 */

import { DomainEvent } from '@shared/domain/domain-event';
import type { MovementStatusChangedEvent as PosMovementStatusChangedPayload } from './pos.events.types';

export type PosMovementCompletedEventProps = PosMovementStatusChangedPayload;

export class PosMovementCompletedEvent extends DomainEvent {
  constructor(public readonly props: PosMovementCompletedEventProps) {
    super(String(props.movementId), 'PosMovementCompleted');
  }
}
