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

import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { CreateNotificationCommand } from '../../application/commands/create-notification.command';
import { NotificationRoutingRepository } from '../notification-routing.repository';
import { QcFailedEvent } from '@modules/qc/domain/events';

/** notification_routing_rules.event_type — config-driven qilib qo'yiladi (FAZA Bildirishnoma, 2026-07-01). */
const QC_FAILED_EVENT_TYPE = 'qc.failed';
/** Jadvalda qator bo'lmasa qaytiladigan avvalgi hardcoded rol (regressiya yo'q, Q-39). */
const QC_FAILED_FALLBACK_ROLE = 'production_manager';

@Injectable()
@EventsHandler(QcFailedEvent)
export class QcFailedNotificationListener implements IEventHandler<QcFailedEvent> {
  private readonly logger = new Logger(QcFailedNotificationListener.name);

  // Audit 2026-08-07: was `notificationRepo.save()` — an in-app row only. A failed QC
  // inspection is exactly the case where the production manager must be reached off-screen,
  // so this now goes through CreateNotificationHandler (preferences → Telegram → status).
  constructor(
    private readonly commandBus: CommandBus,
    private readonly routing: NotificationRoutingRepository,
  ) {}

  async handle(event: QcFailedEvent): Promise<void> {
    this.logger.log('QC failed event received - resolving notification targets via routing rules');

    try {
      const userIdsResult = await this.routing.resolveUserIds(QC_FAILED_EVENT_TYPE, QC_FAILED_FALLBACK_ROLE);
      const userIds = userIdsResult.ok ? userIdsResult.data : [];
      if (userIds.length === 0) {
        this.logger.warn('QcFailedNotificationListener: no active targets resolved (routing rule + fallback both empty)');
      }

      await Promise.allSettled(
        userIds.map((id) =>
          this.commandBus.execute(
            new CreateNotificationCommand(
              String(id),
              'Quality Control Failed',
              `Inspection #${event.inspectionId} on order ${event.orderId} failed. Reason: ${event.reason}`,
              'qc_failed',
              String(event.inspectionId),
              'inspection',
            ),
          ),
        ),
      );
    } catch (err: unknown) {
      this.logger.warn(`QcFailedNotificationListener failed: ${String(err)}`);
    }
  }
}
