/**
 * @module gtd-missing-escalation.cron
 * @description Vision 10-warehouse#10 — GTD (bojxona) yetishmovchilik 14-kunlik eskalatsiya
 *   haydovchisi. Har kuni muddati o'tgan (gtd_due_date < bugun) va GTD-raqami kiritilmagan
 *   import qabullarini topib, Klassifikatsiya + Moliyaga bir marta bildirishnoma yozadi
 *   (delegatsiya servisga — Qoida 6/15; qabulni BLOKLAMAYDI). Cron faqat haydovchi:
 *   run o'tkazib yuborilsa, keyingi run baribir ushlaydi (manba-haqiqat = gtd_due_date +
 *   notifications dedup). InternalRequestEscalationCron namunasi (WMS-modul provideri @Cron;
 *   ScheduleModule.forRoot() global cron.module.ts orqali skanerlaydi).
 * @layer Cron (WMS)
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { GtdFlagService } from '../../application/gtd-flag.service';

@Injectable()
export class GtdMissingEscalationCron {
  private readonly logger = new Logger(GtdMissingEscalationCron.name);

  constructor(private readonly gtd: GtdFlagService) {}

  /** Har kuni 07:15 — muddati o'tgan GTD-yetishmovchiliklarni eskalatsiya qiladi. */
  @Cron('15 7 * * *')
  async escalateOverdue(): Promise<void> {
    const r = await this.gtd.escalateOverdue();
    if (!r.ok) {
      this.logger.error(`❌ GtdMissingEscalationCron error: ${r.error.message}`);
      return;
    }
    if (r.data.escalated > 0) {
      this.logger.log(`✅ GTD eskalatsiya: ${r.data.escalated} qabul, ${r.data.notified} bildirishnoma`);
    }
  }
}
