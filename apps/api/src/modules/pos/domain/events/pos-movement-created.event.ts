/**
 * @module pos-movement-created.event
 * @description Wave 4 round-4 (PA2-18): canonical CQRS event class for the
 *   `pos.movement.data.created` topic.
 *
 *   Consumers previously listening via `@OnEvent('pos.movement.data.created')`:
 *     - PosWmsSyncService.onMovementCreated  (warehouse_transactions draft insert)
 *     - PosEventHandler.onMovementCreated    (broadcast + quarantine — still on legacy string topic, 10-decorator file untouched)
 *
 *   EventBridge re-emits to the legacy string topic for non-migrated consumers
 *   — see EVENT_NAME_MAP entry in event-bridge.service.ts.
 *
 *   Publisher: `pos-movement.service.ts:createMovement` currently emits the
 *   legacy string topic only. A typed publish will be wired in a follow-up
 *   migration; until then, the listener fires through the EventBridge string
 *   path (consumer is still attached to the bridge's bidirectional surface).
 */

import { DomainEvent } from '@shared/domain/domain-event';

export interface PosMovementCreatedEventProps {
  movementId: number;
  movementNumber: string;
  typeCode: string;
  createdById: number;
}

export class PosMovementCreatedEvent extends DomainEvent {
  constructor(public readonly props: PosMovementCreatedEventProps) {
    super(String(props.movementId), 'PosMovementCreated');
  }
}
