/**
 * @module qc-passed-kg.listener
 * @description Bilim grafi QC hop (pass) — real, verified emitter:
 * submit-inspection.handler.ts:130 `eventBus.publish(new QcPassedEvent(...))`.
 */

import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { QcPassedEvent } from '../../../qc/domain/events';
import { KgSyncService } from '../../application/services/kg-sync.service';

@Injectable()
@EventsHandler(QcPassedEvent)
export class QcPassedKgListener implements IEventHandler<QcPassedEvent> {
  constructor(private readonly kgSync: KgSyncService) {}

  async handle(event: QcPassedEvent): Promise<void> {
    await this.kgSync.upsertFromQcPassed(event.inspectionId, event.orderId);
  }
}
