/**
 * @module sales-order-confirmed.listener
 * @description Wave 4 round-4 (PA2-18): the two `@OnEvent` decorators that
 *   previously lived here have been split into canonical CQRS event handlers:
 *
 *     - ERP_EVENTS.ORDER_CREATED        → OrderCreatedDeliveryListener
 *     - ERP_EVENTS.ORDER_STATUS_CHANGED → OrderStatusChangedDeliveryListener
 *
 *   This file is kept as a marker so existing module imports (which referenced
 *   `SalesOrderConfirmedListener`) continue to compile. The two new listeners
 *   are registered in `logistics.module.ts`; remove this stub once external
 *   imports of `SalesOrderConfirmedListener` have been updated.
 */

import { Injectable } from '@nestjs/common';

@Injectable()
export class SalesOrderConfirmedListener {
  // Marker only — actual logic lives in the two @EventsHandler classes
  // (`order-created-delivery.listener.ts` and
  // `order-status-changed-delivery.listener.ts`). Kept to avoid breaking
  // module imports while round-4 lands.
}
