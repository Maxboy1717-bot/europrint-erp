import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LmsRepository } from '../repositories/drizzle-lms.repo';
import { CertificateExpiredEvent } from '../../domain/events/certificate-expired.event';

interface TelegramServiceInterface {
  sendAlert(message: string): Promise<void>;
}

@Injectable()
export class CertExpiryHandler {
  private readonly logger = new Logger(CertExpiryHandler.name);
  private telegramService?: TelegramServiceInterface;

  constructor(private lmsRepo: LmsRepository) {}

  @OnEvent('CertificateExpired', { async: true })
  async handleCertExpiry(event: CertificateExpiredEvent): Promise<void> {
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
