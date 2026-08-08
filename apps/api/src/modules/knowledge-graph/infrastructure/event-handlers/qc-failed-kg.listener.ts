/**
 * @module qc-failed-kg.listener
 * @description Bilim grafi QC hop (fail) — real, verified emitter:
 * submit-inspection.handler.ts:138 `eventBus.publish(new QcFailedEvent(...))`.
 * This is the AI-overlay flagship signal: flags the production_order→
 * qc_inspection edge is_broken=true so the Graph View can pulse it red.
 */

import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { QcFailedEvent } from '../../../qc/domain/events';
import { KgSyncService } from '../../application/services/kg-sync.service';

@Injectable()
@EventsHandler(QcFailedEvent)
export class QcFailedKgListener implements IEventHandler<QcFailedEvent> {
  constructor(private readonly kgSync: KgSyncService) {}

  async handle(event: QcFailedEvent): Promise<void> {
    await this.kgSync.upsertFromQcFailed(event.inspectionId, event.orderId, event.reason);
  }
}
