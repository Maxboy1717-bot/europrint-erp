/**
 * @module order-status-changed-delivery.listener
 * @description Wave 4 round-4 (PA2-18): canonical CQRS
 *   `@EventsHandler(OrderStatusChangedEvent)` form. Extracted from the legacy
 *   `sales-order-confirmed.listener.ts` (which had two `@OnEvent` decorators
 *   on a single class) so the OrderStatusChanged half subscribes directly to
 *   the typed event class rather than the legacy
 *   `ERP_EVENTS.ORDER_STATUS_CHANGED` string topic.
 *
 *   EventBridge keeps re-emitting to the legacy string topic for any
 *   non-migrated consumers — see EVENT_NAME_MAP entry in
 *   event-bridge.service.ts.
 *
 *   The handler only acts when `newStatus === 'confirmed'`. Same dead-letter
 *   caveat as `order-created-delivery.listener.ts` applies — the typed event
 *   class lacks `customerName` + `deliveryAddress`.
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { OrderStatusChangedEvent } from '@modules/sd/domain/events/order-status-changed.event';
import { IDeliveryRepo, DELIVERY_REPO } from '../../domain/repositories/i-delivery.repo';

@Injectable()
@EventsHandler(OrderStatusChangedEvent)
export class OrderStatusChangedDeliveryListener
  implements IEventHandler<OrderStatusChangedEvent>
{
  private readonly logger = new Logger(OrderStatusChangedDeliveryListener.name);

  constructor(
    @Inject(DELIVERY_REPO) private readonly deliveryRepo: IDeliveryRepo,
  ) {}

  async handle(event: OrderStatusChangedEvent): Promise<void> {
    // Only act on the confirmed transition — that's when delivery auto-create
    // should fire (mirrors the legacy listener's `status === 'confirmed'` gate).
    if (event.newStatus !== 'confirmed') return;

    const salesOrderId = String(event.orderId);
    this.logger.log({
      msg: 'OrderStatusChangedEvent → confirmed — checking for existing delivery',
      salesOrderId,
      previousStatus: event.previousStatus,
    });

    const existingResult = await this.deliveryRepo.findBySalesOrderId(salesOrderId);
    if (existingResult.ok && existingResult.data) {
      this.logger.log('Delivery already exists for this sales order — skipping');
      return;
    }

    // PA2-18 resolved (see order-created-delivery.listener.ts): the repo
    // resolves customerName/deliveryAddress from the sales order itself. On the
    // confirmed transition we auto-create the logistics delivery record.
    const created = await this.deliveryRepo.createFromSalesOrder(event.orderId);
    if (!created.ok) {
      this.logger.error(
        `OrderStatusChangedDeliveryListener: failed to auto-create delivery for sales order ${salesOrderId}: ${created.error.message}`,
      );
      return;
    }
    if (!created.data) {
      this.logger.warn(
        `OrderStatusChangedDeliveryListener: sales order ${salesOrderId} not found — no delivery created`,
      );
      return;
    }
    this.logger.log({
      msg: 'Delivery auto-created on order confirmation',
      salesOrderId,
      deliveryId: created.data.id,
      deliveryNumber: created.data.deliveryNumber,
      customerName: created.data.customerName,
    });
  }
}
