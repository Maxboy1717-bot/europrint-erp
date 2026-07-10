/**
 * @module qc-internal-audit.cron
 * @description 09-qc #22 — Davriy ichki sifat auditi (choraklik). Har chorak boshida
 *   (1-yanvar/1-aprel/1-iyul/1-oktabr 02:00 Toshkent) joriy chorak uchun ichki sifat auditini
 *   idempotent rejalashtiradi (QcInternalAuditService.scheduleCurrentQuarter → qc_internal_audits).
 *   period kaliti ('YYYY-Qn') dublikatni oldini oladi — cron takror ishga tushsa yangi qator yo'q.
 *
 *   Vizyon (vision-1000-answers/09-qc.md #22): "cron trigger choraklik/yillik". FABRIKATSIYA YO'Q:
 *   faqat 'scheduled' qator; auditor/topilma/kalendar/protokol runtime'da to'ladi (egasi-data
 *   kerak emas — jadval + cron yagona darvoza edi). Delegatsiya service→repo (Qoida 15).
 * @layer Cron (QC)
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { QcInternalAuditService } from '../modules/qc/application/qc-internal-audit.service';
import { CronStatusService } from './cron-status.service';

@Injectable()
export class QcInternalAuditCron {
  private readonly logger = new Logger(QcInternalAuditCron.name);

  constructor(
    private readonly service: QcInternalAuditService,
    private readonly cronStatus: CronStatusService,
  ) {}

  // Har chorak boshi: 1-yanvar/aprel/iyul/oktabr, 02:00. (daqiqa soat kun oy hafta-kuni)
  @Cron('0 2 1 1,4,7,10 *')
  async scheduleQuarterlyAudit(): Promise<void> {
    const jobName = 'QcInternalAuditCron';
    const r = await this.service.scheduleCurrentQuarter();
    if (!r.ok) {
      this.logger.error(`QcInternalAuditCron xato: ${r.error.message}`);
      this.cronStatus.recordFailure(jobName, r.error.message);
      return;
    }
    if (r.data) {
      const id = (r.data as { id?: number }).id;
      this.logger.log(`QcInternalAuditCron: davriy ichki audit rejalashtirildi (id=${id})`);
    } else {
      this.logger.log('QcInternalAuditCron: joriy chorak allaqachon rejalashtirilgan (dublikat yo\'q)');
    }
    this.cronStatus.recordSuccess(jobName);
  }
}
