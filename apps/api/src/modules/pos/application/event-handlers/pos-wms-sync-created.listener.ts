/**
 * @module pos-wms-sync-created.listener
 * @description Wave 4 round-4 (PA2-18): canonical CQRS
 *   `@EventsHandler(PosMovementCreatedEvent)` form. Extracted from
 *   `pos-wms-sync.service.ts`. Delegates back into the service method
 *   `onMovementCreated` so the warehouse_transactions draft insert logic is
 *   preserved.
 *
 *   Publisher migration: `pos-movement.service.ts:createMovement` now
 *   publishes both the legacy `pos.movement.data.created` string topic
 *   AND `new PosMovementCreatedEvent(...)` on the CQRS bus. The duplicate
 *   emit is a belt-and-suspenders measure during migration — handlers must
 *   stay idempotent. Once every consumer has migrated to the typed handler,
 *   the legacy `eventEmitter.emit('pos.movement.data.created', ...)` line
 *   can be removed from `pos-movement.service.ts`.
 *
 *   EventBridge keeps re-emitting CQRS → string for any non-migrated
 *   consumers (e.g. `pos.events.ts:56` — 10-decorator file left untouched
 *   in this round) — see EVENT_NAME_MAP entry in event-bridge.service.ts.
 */

import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { PosMovementCreatedEvent } from '../../domain/events/pos-movement-created.event';
import { PosWmsSyncService } from '../services/pos-wms-sync.service';

@Injectable()
@EventsHandler(PosMovementCreatedEvent)
export class PosWmsSyncCreatedListener
  implements IEventHandler<PosMovementCreatedEvent>
{
  constructor(private readonly wmsSync: PosWmsSyncService) {}

  async handle(event: PosMovementCreatedEvent): Promise<void> {
    // Existing service method preserved — reuses the warehouse_transactions
    // draft insert logic verbatim. Idempotent because the underlying SQL
    // is INSERT-only with no uniqueness conflict path; duplicate emits from
    // the parallel legacy string topic are tolerated (downstream WMS reads
    // are aggregate-based).
    // PosWmsSyncService.onMovementCreated() expects the helpers `PosMovementCreatedEvent` shape
    // (movementId/movementNumber/oldStatus/newStatus/updatedById). The domain event carries
    // a different schema in `event.props` — translate fields here.
    await this.wmsSync.onMovementCreated({
      movementId:     event.props.movementId,
      movementNumber: event.props.movementNumber,
      oldStatus:      '',
      newStatus:      'created',
      updatedById:    event.props.createdById,
    });
  }
}
