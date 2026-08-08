/**
 * @module mes-completed-kg.listener
 * @description Bilim grafi MES hop — real, verified emitter:
 * complete-session.handler.ts:71 `eventBus.publish(new MesCompletedEvent(...))`.
 */

import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { MesCompletedEvent } from '../../../mes/domain/events/mes-completed.event';
import { KgSyncService } from '../../application/services/kg-sync.service';

@Injectable()
@EventsHandler(MesCompletedEvent)
export class MesCompletedKgListener implements IEventHandler<MesCompletedEvent> {
  constructor(private readonly kgSync: KgSyncService) {}

  async handle(event: MesCompletedEvent): Promise<void> {
    await this.kgSync.upsertFromMesCompleted(event.sessionId, event.ppId);
  }
}
