/**
 * @module wms-goods-issued-kg.listener
 * @description Bilim grafi WMS hop — real, verified emitter:
 * goods-issue.handler.ts:125 `eventBus.publish(new WmsGoodsIssuedEvent(payload))`,
 * payload = { materialId, amount, ppId, timestamp, fifoValue? } (untyped
 * Record — checked defensively, no fabrication if a field is missing).
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { WmsGoodsIssuedEvent } from '../../../wms/application/events/wms-goods-issued.event';
import { KgSyncService } from '../../application/services/kg-sync.service';

@Injectable()
@EventsHandler(WmsGoodsIssuedEvent)
export class WmsGoodsIssuedKgListener implements IEventHandler<WmsGoodsIssuedEvent> {
  private readonly logger = new Logger(WmsGoodsIssuedKgListener.name);

  constructor(private readonly kgSync: KgSyncService) {}

  async handle(event: WmsGoodsIssuedEvent): Promise<void> {
    const ppId = Number(event.payload['ppId']);
    const materialId = Number(event.payload['materialId']);
    if (!Number.isFinite(ppId) || !Number.isFinite(materialId)) {
      this.logger.warn({ payload: event.payload }, 'kg sync: WmsGoodsIssuedEvent missing ppId/materialId, skipped');
      return;
    }
    await this.kgSync.upsertFromWmsGoodsIssued(ppId, materialId);
  }
}
