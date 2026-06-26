/**
 * @module mes-sos-escalation.cron
 * @description #11 — SOS/downtime org-zanjir timeout eskalatsiyasi. Har 2 daqiqada javob
 *   kelmagan (deadline o'tgan) hal-qilinmagan SOS'larni org_departments.parent_id bo'ylab
 *   keyingi darajaga (usta→bo'lim→direktor) ko'taradi va yangi javobgarga bildirishnoma yozadi.
 *   Manba-haqiqat: escalation_due_at ustuni; cron faqat haydovchi (run o'tkazib yuborilsa,
 *   keyingi run baribir o'tgan deadline'larni ushlaydi). Delegatsiya servisga (Qoida 15).
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MesSosEscalationService } from '../modules/mes/application/mes-sos-escalation.service';
import { CronStatusService } from './cron-status.service';

@Injectable()
export class MesSosEscalationCron {
  private readonly logger = new Logger(MesSosEscalationCron.name);

  constructor(
    private readonly escalation: MesSosEscalationService,
    private readonly cronStatus: CronStatusService,
  ) {}

  @Cron('*/2 * * * *')
  async escalateOverdueSos(): Promise<void> {
    const jobName = 'MesSosEscalationCron';
    const r = await this.escalation.escalateOverdue();
    if (!r.ok) {
      this.logger.error(`❌ MesSosEscalationCron error: ${r.error.message}`);
      this.cronStatus.recordFailure(jobName, r.error.message);
      return;
    }
    if (r.data.escalated > 0 || r.data.exhausted > 0) {
      this.logger.log(
        `✅ MesSosEscalationCron: ${r.data.escalated} eskalatsiya, ${r.data.exhausted} zanjir-tepasi`,
      );
    }
    this.cronStatus.recordSuccess(jobName);
  }
}
