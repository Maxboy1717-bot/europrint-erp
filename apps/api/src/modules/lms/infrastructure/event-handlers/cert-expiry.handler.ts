/**
 * @module cert-expiry.handler
 * @description PA2-18: canonical CQRS @EventsHandler form. Reacts to
 *   `CertificateExpiredEvent` class instances. Today the certificate
 *   aggregate creates the event (see `certificate.aggregate.ts:57`) but no
 *   command publishes it on the EventBus yet — see TODO PA2-18 below.
 *   Once the cert-expiry cron / aggregate save handler publishes the event
 *   via `eventBus.publish(new CertificateExpiredEvent(...))`, this handler
 *   will fire automatically.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler, EventBus } from '@nestjs/cqrs';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LmsRepository } from '../repositories/drizzle-lms.repo';
import { CertificateExpiredEvent } from '../../domain/events/certificate-expired.event';

interface TelegramServiceInterface {
  sendAlert(message: string): Promise<void>;
}

@Injectable()
@EventsHandler(CertificateExpiredEvent)
export class CertExpiryHandler implements IEventHandler<CertificateExpiredEvent> {
  private readonly logger = new Logger(CertExpiryHandler.name);
  private telegramService?: TelegramServiceInterface;

  constructor(
    private lmsRepo: LmsRepository,
    private readonly eventBus: EventBus,
  ) {}

  async handle(event: CertificateExpiredEvent): Promise<void> {
    this.logger.warn(
      `Certificate expired event - Certificate: ${event.props.certificateId}, Employee: ${event.props.employeeId}`
    );

    await this.lmsRepo.updateCertificateStatus(event.props.certificateId, 'expired');

    const message = `Sertifikat muddati tugagan: ${event.props.courseName} (Employee: ${event.props.employeeId})`;

    if (this.telegramService) {
      await this.telegramService.sendAlert(message);
    }

    this.logger.log(`Certificate expiry handled - Certificate: ${event.props.certificateId}`);
  }

  /**
   * Trigger 17 daily sweep: find genuinely-expired certificates and publish a
   * CertificateExpiredEvent for each, so the MES skill-block + notification
   * listeners fire. Previously a stub (logged only) → the whole cert-expiry chain
   * was dead. Publishing the typed event flows to the registered @EventsHandler set.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkExpiringCertificates(): Promise<void> {
    this.logger.debug('Running daily certificate expiry sweep');
    const r = await this.lmsRepo.findExpiredToFlag();
    if (!r.ok) {
      this.logger.error(`Certificate expiry sweep failed: ${r.error}`);
      return;
    }
    const rows = Array.isArray(r.data) ? (r.data as Array<Record<string, unknown>>) : [];
    const now = _time.now();
    for (const row of rows) {
      this.eventBus.publish(
        new CertificateExpiredEvent({
          certificateId: Number(row.certificate_id),
          employeeId: Number(row.employee_id),
          courseId: Number(row.course_id),
          courseName: String(row.course_name ?? ''),
          expiresAt: row.expires_at ? new Date(String(row.expires_at)) : undefined,
          expiredAt: now,
        }),
      );
    }
    this.logger.log(`Certificate expiry sweep: ${rows.length} expired certificate(s) flagged`);
  }
}
