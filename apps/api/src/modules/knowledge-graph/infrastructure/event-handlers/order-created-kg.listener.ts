/**
 * @module order-created-kg.listener
 * @description Bilim grafi SD hop — real, verified emitter:
 * sd-quotations.repository.ts:462 `eventBus.publish(new OrderCreatedEvent(...))`.
 */

import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { OrderCreatedEvent } from '../../../sd/domain/events/order-created.event';
import { KgSyncService } from '../../application/services/kg-sync.service';

@Injectable()
@EventsHandler(OrderCreatedEvent)
export class OrderCreatedKgListener implements IEventHandler<OrderCreatedEvent> {
  constructor(private readonly kgSync: KgSyncService) {}

  async handle(event: OrderCreatedEvent): Promise<void> {
    await this.kgSync.upsertFromOrderCreated(event.orderId, event.orderNumber, event.totalAmount, event.companyId);
  }
}
