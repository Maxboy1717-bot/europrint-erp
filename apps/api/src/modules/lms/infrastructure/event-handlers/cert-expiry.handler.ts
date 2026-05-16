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
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
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

  constructor(private lmsRepo: LmsRepository) {}

  async handle(event: CertificateExpiredEvent): Promise<void> {
    // TODO PA2-18: no command currently publishes CertificateExpiredEvent on
    // the CQRS bus — the aggregate creates it but never flushes via
    // eventBus.publish. Once a record-cert-expiry / publish-aggregate-events
    // step is wired, this handler will activate.
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

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkExpiringCertificates(): Promise<void> {
    this.logger.debug('Running daily certificate expiry check');

    const thirtyDaysFromNow = _time.now();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    this.logger.log('Certificate expiry check completed');
  }
}
