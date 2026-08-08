/**
 * @module pp-released-kg.listener
 * @description Bilim grafi PP hop — real, verified emitter:
 * release-production-order.handler.ts:72 `eventBus.publish(new PpReleasedEvent(...))`.
 */

import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { PpReleasedEvent } from '../../../pp/domain/events/pp-released.event';
import { KgSyncService } from '../../application/services/kg-sync.service';

@Injectable()
@EventsHandler(PpReleasedEvent)
export class PpReleasedKgListener implements IEventHandler<PpReleasedEvent> {
  constructor(private readonly kgSync: KgSyncService) {}

  async handle(event: PpReleasedEvent): Promise<void> {
    await this.kgSync.upsertFromPpReleased(event.poId);
  }
}
