/**
 * @module delivery-goods-issued.event
 * @description Domain event payload. Emitted via @nestjs/event-emitter or CQRS event bus.
 *
 *   VISION-3340 #51 (golden-thread SD→WMS): a delivery has reached a "left-the-warehouse"
 *   status (post-goods-issue — in_transit/delivered), so the shipped finished-goods quantity
 *   must LEAVE the finished-goods warehouse. Published by {@link DeliveriesService.updateStatus}
 *   and consumed by the WMS DeliveryGoodsIssuedListener, which writes the EXTERNAL_OUT movement
 *   (the inverse of the QC/MES FG-receipt listeners that ADD stock). Carries the deliveryId (the
 *   listener resolves the delivery_items lines from it) and, when known, the sales order id.
 */

import { DomainEvent } from '@shared/domain/domain-event.base';

export class DeliveryGoodsIssuedEvent extends DomainEvent {
  readonly aggregateName: string = 'Delivery';

  constructor(
    public readonly deliveryId: number,
    public readonly salesOrderId: number | null = null,
  ) {
    super(deliveryId, 'DeliveryGoodsIssued');
  }
}
