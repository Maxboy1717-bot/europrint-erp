/**
 * @module order-created-delivery.listener
 * @description Wave 4 round-4 (PA2-18): canonical CQRS
 *   `@EventsHandler(OrderCreatedEvent)` form. Extracted from the legacy
 *   `sales-order-confirmed.listener.ts` (which had two `@OnEvent` decorators
 *   on a single class) so the OrderCreated half subscribes directly to the
 *   typed event class rather than the legacy `ERP_EVENTS.ORDER_CREATED`
 *   string topic.
 *
 *   EventBridge keeps re-emitting to the legacy string topic for any
 *   non-migrated consumers — see EVENT_NAME_MAP entry in
 *   event-bridge.service.ts.
 *
 *   PAYLOAD RESOLVED (T7-04, 2026-06-26, commit 2c35b89d):
 *   The canonical `OrderCreatedEvent` carries only `{ orderId, companyId,
 *   orderNumber, totalAmount }` — it does NOT carry `customerName` /
 *   `deliveryAddress`. Rather than widen the event payload, the fix moved
 *   resolution into the repository: `IDeliveryRepo.createFromSalesOrder`
 *   looks up the sales order (+ linked CRM company) directly and derives
 *   customer name / delivery address from there. This handler no longer
 *   logs-and-exits — it calls `createFromSalesOrder`, which performs a real
 *   INSERT into `deliveries`, closing the SD → Logistics golden-thread hop.
 *
 *   The legacy `@OnEvent` listener for the string-topic flow has been
 *   retired in this migration; the rich-payload path now flows exclusively
 *   through EventBridge re-emit (so any straggler @OnEvent consumers
 *   in other modules keep working).
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { OrderCreatedEvent } from '@modules/sd/domain/events/order-created.event';
import { IDeliveryRepo, DELIVERY_REPO } from '../../domain/repositories/i-delivery.repo';

@Injectable()
@EventsHandler(OrderCreatedEvent)
export class OrderCreatedDeliveryListener
  implements IEventHandler<OrderCreatedEvent>
{
  private readonly logger = new Logger(OrderCreatedDeliveryListener.name);

  constructor(
    @Inject(DELIVERY_REPO) private readonly deliveryRepo: IDeliveryRepo,
  ) {}

  async handle(event: OrderCreatedEvent): Promise<void> {
    const salesOrderId = String(event.orderId);
    this.logger.log({
      msg: 'OrderCreatedEvent received — checking for existing delivery',
      salesOrderId,
      orderNumber: event.orderNumber,
    });

    const existingResult = await this.deliveryRepo.findBySalesOrderId(salesOrderId);
    if (existingResult.ok && existingResult.data) {
      this.logger.log('Delivery already exists for this sales order — skipping');
      return;
    }

    // PA2-18 resolved: the canonical OrderCreatedEvent does not carry
    // customerName/deliveryAddress, so the repo resolves them from the sales
    // order (and its linked CRM company) itself. This auto-creates the
    // logistics delivery record — closing the SD → Logistics golden-thread hop.
    const created = await this.deliveryRepo.createFromSalesOrder(event.orderId);
    if (!created.ok) {
      this.logger.error(
        `OrderCreatedDeliveryListener: failed to auto-create delivery for sales order ${salesOrderId}: ${created.error.message}`,
      );
      return;
    }
    if (!created.data) {
      this.logger.warn(
        `OrderCreatedDeliveryListener: sales order ${salesOrderId} not found — no delivery created`,
      );
      return;
    }
    this.logger.log({
      msg: 'Delivery auto-created for sales order',
      salesOrderId,
      deliveryId: created.data.id,
      deliveryNumber: created.data.deliveryNumber,
      customerName: created.data.customerName,
    });
  }
}
