/**
 * @module deal-won-notification.listener
 * @description Wave 4 (pilot): canonical CQRS `@EventsHandler(DealWonEvent)` form.
 *   Extracted from `erp-events.listener.ts` so the notification fan-out subscribes
 *   directly to the event class rather than the legacy `ERP_EVENTS.DEAL_WON`
 *   string topic. The EventBridge still re-emits to the string topic for any
 *   non-migrated consumers — see EVENT_NAME_MAP entry in event-bridge.service.ts.
 */

import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { CreateNotificationCommand } from '../../application/commands/create-notification.command';
import { DealWonEvent } from '@modules/crm/domain/events/deal-won.event';

/**
 * Audit 2026-08-07: this listener called `notificationRepo.save()` directly, which writes the
 * `notifications` row and nothing else — no channel-preference filtering, no Telegram/email/SMS
 * send, no `status` write-back. A won deal therefore only ever appeared if the director happened
 * to open the app. The delivery layer lives in CreateNotificationHandler, and
 * `orphan-events.listener.ts` in this same directory already dispatches through it; this listener
 * (and its four neighbours) were left on the direct-save path. Now routed through the CommandBus
 * like the rest, so the notification actually leaves the building.
 */
@Injectable()
@EventsHandler(DealWonEvent)
export class DealWonNotificationListener implements IEventHandler<DealWonEvent> {
  private readonly logger = new Logger(DealWonNotificationListener.name);

  constructor(private readonly commandBus: CommandBus) {}

  async handle(event: DealWonEvent): Promise<void> {
    this.logger.log('Deal won event received - creating notification for director');

    try {
      const result = await runQuery<{ id: number }>(
        sql`SELECT id FROM users WHERE role = ${'director'} AND is_active = true LIMIT 50`,
      );
      if (result.rows.length === 50) {
        this.logger.warn('DealWonNotificationListener: result capped at 50 directors — some may not be notified');
      }

      await Promise.allSettled(
        result.rows.map((u) =>
          this.commandBus.execute(
            new CreateNotificationCommand(
              String(u.id),
              'New Deal Won',
              `Deal #${event.dealId} worth ${event.totalAmount} ${event.currency} has been won`,
              'deal',
              String(event.dealId),
              'deal',
            ),
          ),
        ),
      );
    } catch (err: unknown) {
      this.logger.warn(`DealWonNotificationListener failed: ${String(err)}`);
    }
  }
}
