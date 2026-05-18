/**
 * @module pos-wms-sync-completed.listener
 * @description Wave 4 round-4 (PA2-18): canonical CQRS
 *   `@EventsHandler(PosMovementCompletedEvent)` form. Extracted from
 *   `pos-wms-sync.service.ts`. Delegates back into the service method
 *   `onMovementCompleted` so the WMS sync logic (warehouse_stock upsert +
 *   warehouse_transactions insert + Socket.IO broadcast) is preserved.
 *
 *   EventBridge keeps re-emitting to the legacy `pos.movement.data.completed`
 *   string topic for non-migrated consumers — see EVENT_NAME_MAP entry in
 *   event-bridge.service.ts.
 *
 *   No production code currently publishes `pos.movement.data.completed` on
 *   either bus (no emit site exists today); the listener was therefore
 *   already a dead-letter prior to migration.
 */

import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { PosMovementCompletedEvent } from '../../domain/events/pos-movement-completed.event';
import { PosWmsSyncService } from '../services/pos-wms-sync.service';

@Injectable()
@EventsHandler(PosMovementCompletedEvent)
export class PosWmsSyncCompletedListener
  implements IEventHandler<PosMovementCompletedEvent>
{
  constructor(private readonly wmsSync: PosWmsSyncService) {}

  async handle(event: PosMovementCompletedEvent): Promise<void> {
    // Existing service method preserved — reuses the WMS upsert + transactions
    // insert logic verbatim. `event.props` matches the historical payload
    // shape (movementId/movementNumber/etc.).
    await this.wmsSync.onMovementCompleted(event.props);
  }
}
