/**
 * @module deal-won-notification.listener
 * @description Wave 4 (pilot): canonical CQRS `@EventsHandler(DealWonEvent)` form.
 *   Extracted from `erp-events.listener.ts` so the notification fan-out subscribes
 *   directly to the event class rather than the legacy `ERP_EVENTS.DEAL_WON`
 *   string topic. The EventBridge still re-emits to the string topic for any
 *   non-migrated consumers — see EVENT_NAME_MAP entry in event-bridge.service.ts.
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Notification } from '../../domain/aggregates/notification.aggregate';
import { INotificationRepo, NOTIFICATION_REPO } from '../../domain/repositories/i-notification.repo';
import { DealWonEvent } from '@modules/crm/domain/events/deal-won.event';

@Injectable()
@EventsHandler(DealWonEvent)
export class DealWonNotificationListener implements IEventHandler<DealWonEvent> {
  private readonly logger = new Logger(DealWonNotificationListener.name);

  constructor(
    @Inject(NOTIFICATION_REPO) private readonly notificationRepo: INotificationRepo,
  ) {}

  async handle(event: DealWonEvent): Promise<void> {
    this.logger.log('Deal won event received - creating notification for director');

    try {
      const result = await runQuery<{ id: number }>(
        sql`SELECT id FROM users WHERE role = ${'director'} AND is_active = true LIMIT 50`,
      );
      if (result.rows.length === 50) {
        this.logger.warn('DealWonNotificationListener: result capped at 50 directors — some may not be notified');
      }

      await Promise.all(
        result.rows.map((u) => {
          const notification = Notification.createForUser(
            String(u.id),
            'New Deal Won',
            `Deal #${event.dealId} worth ${event.totalAmount} ${event.currency} has been won`,
            'deal',
          );
          notification.referenceId = String(event.dealId);
          notification.referenceType = 'deal';
          return this.notificationRepo.save(notification);
        }),
      );
    } catch (err: unknown) {
      this.logger.warn(`DealWonNotificationListener failed: ${String(err)}`);
    }
  }
}
