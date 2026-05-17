/**
 * @module qc-failed-notification.listener
 * @description Wave 4 (pilot): canonical CQRS `@EventsHandler(QcFailedEvent)` form.
 *   Extracted from `erp-events.listener.ts` so the production-manager fan-out
 *   subscribes directly to the event class rather than the legacy
 *   `ERP_EVENTS.QC_FAILED` string topic. The EventBridge still re-emits to
 *   the string topic for any non-migrated consumers — see EVENT_NAME_MAP entry
 *   in event-bridge.service.ts.
 *
 *   Note: `QcFailedEvent` is currently published with `{inspectionId, orderId,
 *   reason}` by submit-inspection.handler.ts. The legacy notification listener
 *   referenced `productId` which the event does not carry — the message text
 *   now uses `orderId` instead. The report-defect.handler.ts emit site still
 *   publishes a POJO with `eventType: ERP_EVENTS.QC_FAILED` (not a
 *   QcFailedEvent instance) — that is tracked as a separate cleanup.
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Notification } from '../../domain/aggregates/notification.aggregate';
import { INotificationRepo, NOTIFICATION_REPO } from '../../domain/repositories/i-notification.repo';
import { QcFailedEvent } from '@modules/qc/domain/events';

@Injectable()
@EventsHandler(QcFailedEvent)
export class QcFailedNotificationListener implements IEventHandler<QcFailedEvent> {
  private readonly logger = new Logger(QcFailedNotificationListener.name);

  constructor(
    @Inject(NOTIFICATION_REPO) private readonly notificationRepo: INotificationRepo,
  ) {}

  async handle(event: QcFailedEvent): Promise<void> {
    this.logger.log('QC failed event received - creating notification for production manager');

    try {
      const result = await runQuery<{ id: number }>(
        sql`SELECT id FROM users WHERE role = ${'production_manager'} AND is_active = true LIMIT 50`,
      );
      if (result.rows.length === 50) {
        this.logger.warn('QcFailedNotificationListener: result capped at 50 production managers — some may not be notified');
      }

      await Promise.all(
        result.rows.map((u) => {
          const notification = Notification.createForUser(
            String(u.id),
            'Quality Control Failed',
            `Inspection #${event.inspectionId} on order ${event.orderId} failed. Reason: ${event.reason}`,
            'qc_failed',
          );
          notification.referenceId = event.inspectionId;
          notification.referenceType = 'inspection';
          return this.notificationRepo.save(notification);
        }),
      );
    } catch (err: unknown) {
      this.logger.warn(`QcFailedNotificationListener failed: ${String(err)}`);
    }
  }
}
