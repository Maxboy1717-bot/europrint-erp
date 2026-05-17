/**
 * @module lms-cert-expired-notification.listener
 * @description Wave 4 (pilot): canonical CQRS `@EventsHandler(CertificateExpiredEvent)`
 *   form. Extracted from `erp-events.listener.ts` so the operator + HR-manager
 *   fan-out subscribes directly to the event class rather than the legacy
 *   `ERP_EVENTS.LMS_CERT_EXPIRED` string topic. The EventBridge still re-emits
 *   to the string topic for any non-migrated consumers (e.g. the MES
 *   lms-cert-expired.listener) — see EVENT_NAME_MAP entry in
 *   event-bridge.service.ts.
 *
 *   Note: today the certificate aggregate creates `CertificateExpiredEvent`
 *   (see certificate.aggregate.ts:57) but no command currently flushes it via
 *   eventBus.publish. Until that wiring is added, this listener is a no-op at
 *   runtime — exactly the same dead-letter state as the legacy `@OnEvent`
 *   listener was previously in.
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Notification } from '../../domain/aggregates/notification.aggregate';
import { INotificationRepo, NOTIFICATION_REPO } from '../../domain/repositories/i-notification.repo';
import { CertificateExpiredEvent } from '@modules/lms/domain/events/certificate-expired.event';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';

@Injectable()
@EventsHandler(CertificateExpiredEvent)
export class LmsCertExpiredNotificationListener
  implements IEventHandler<CertificateExpiredEvent>
{
  private readonly logger = new Logger(LmsCertExpiredNotificationListener.name);

  constructor(
    @Inject(NOTIFICATION_REPO) private readonly notificationRepo: INotificationRepo,
  ) {}

  async handle(event: CertificateExpiredEvent): Promise<void> {
    this.logger.log(
      'LMS cert expired event received - creating notifications for operator and HR managers',
    );

    const { certificateId, employeeId, courseName } = event.props;

    try {
      // Notify the specific operator directly when their numeric id is known.
      const operatorNotification = Notification.createForUser(
        String(employeeId),
        'Certificate Expired',
        `Your certificate for ${courseName} has expired. Please renew it immediately.`,
        'lms_expired',
      );
      operatorNotification.referenceId = String(certificateId);
      operatorNotification.referenceType = 'certificate';
      await this.notificationRepo.save(operatorNotification);

      // Fan out to active HR managers.
      const result = await runQuery<{ id: number }>(
        sql`SELECT id FROM users WHERE role = ${'hr_manager'} AND is_active = true LIMIT 50`,
      );
      if (result.rows.length === 50) {
        this.logger.warn('LmsCertExpiredNotificationListener: result capped at 50 HR managers — some may not be notified');
      }

      await Promise.all(
        result.rows.map((u) => {
          const notification = Notification.createForUser(
            String(u.id),
            'Operator Certificate Expired',
            `Operator ${employeeId}'s certificate for ${courseName} has expired`,
            'lms_expired',
          );
          notification.referenceId = String(certificateId);
          notification.referenceType = 'certificate';
          return this.notificationRepo.save(notification);
        }),
      );
    } catch (err: unknown) {
      this.logger.warn(`LmsCertExpiredNotificationListener failed: ${String(err)}`);
    }
  }
}
