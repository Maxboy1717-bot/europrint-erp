/**
 * @module order-created-notification.listener
 * @description Wave 4 (pilot): canonical CQRS `@EventsHandler(OrderCreatedEvent)` form.
 *   Extracted from `erp-events.listener.ts` so the warehouse-manager fan-out
 *   subscribes directly to the event class rather than the legacy
 *   `ERP_EVENTS.ORDER_CREATED` string topic. The EventBridge still re-emits to
 *   the string topic for any non-migrated consumers (e.g. logistics
 *   sales-order-confirmed.listener) — see EVENT_NAME_MAP entry in
 *   event-bridge.service.ts.
 */

import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { CreateNotificationCommand } from '../../application/commands/create-notification.command';
import { OrderCreatedEvent } from '@modules/sd/domain/events/order-created.event';

@Injectable()
@EventsHandler(OrderCreatedEvent)
export class OrderCreatedNotificationListener implements IEventHandler<OrderCreatedEvent> {
  private readonly logger = new Logger(OrderCreatedNotificationListener.name);

  // Audit 2026-08-07: was `notificationRepo.save()` — in-app row only, no outbound delivery.
  // Routed through CreateNotificationHandler like orphan-events.listener.ts already was.
  constructor(private readonly commandBus: CommandBus) {}

  async handle(event: OrderCreatedEvent): Promise<void> {
    this.logger.log('Order created event received - creating notification for warehouse manager');

    try {
      const result = await runQuery<{ id: number }>(
        sql`SELECT id FROM users WHERE role = ${'warehouse_manager'} AND is_active = true LIMIT 50`,
      );
      if (result.rows.length === 50) {
        this.logger.warn('OrderCreatedNotificationListener: result capped at 50 warehouse managers — some may not be notified');
      }

      await Promise.allSettled(
        result.rows.map((u) =>
          this.commandBus.execute(
            new CreateNotificationCommand(
              String(u.id),
              'New Order Created',
              `Sales Order #${event.orderNumber} (id=${event.orderId}) has been created for company ${event.companyId}`,
              'order',
              String(event.orderId),
              'sales_order',
            ),
          ),
        ),
      );
    } catch (err: unknown) {
      this.logger.warn(`OrderCreatedNotificationListener failed: ${String(err)}`);
    }
  }
}
