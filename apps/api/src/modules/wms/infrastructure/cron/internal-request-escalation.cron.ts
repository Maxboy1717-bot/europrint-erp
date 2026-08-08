/**
 * @module internal-request-escalation.cron
 * @description WMS #32 (vizyon 10-warehouse.md #32) — "Rohler chaqiruv" 15/30/60 daqiqa eskalatsiya
 *   haydovchisi. Har 5 daqiqada bajarilmagan (pending) ichki material/uskuna so'rovlarni tekshirib,
 *   muddati o'tganlarni keyingi darajaga ko'taradi (delegatsiya servisga — Qoida 6/15). Cron faqat
 *   haydovchi: run o'tkazib yuborilsa, keyingi run baribir o'tgan so'rovlarni ushlaydi (manba-haqiqat
 *   = internal_requests.created_at + notifications dedup). WmsCycleCountGeneratorCron namunasi
 *   (WMS-modul provideri @Cron; ScheduleModule.forRoot() global cron.module.ts orqali skanerlaydi).
 * @layer Cron (WMS)
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InternalRequestEscalationService } from '../../application/internal-request-escalation.service';

@Injectable()
export class InternalRequestEscalationCron {
  private readonly logger = new Logger(InternalRequestEscalationCron.name);

  constructor(private readonly escalation: InternalRequestEscalationService) {}

  /** Har 5 daqiqa — muddati o'tgan rohler/material so'rovlarini eskalatsiya qiladi. */
  @Cron('*/5 * * * *')
  async escalateOverdue(): Promise<void> {
    const r = await this.escalation.escalateOverdue();
    if (!r.ok) {
      this.logger.error(`❌ InternalRequestEscalationCron error: ${r.error.message}`);
      return;
    }
    if (r.data.escalated > 0) {
      this.logger.log(
        `✅ Rohler eskalatsiya: ${r.data.escalated} so'rov, ${r.data.notified} bildirishnoma`,
      );
    }
  }
}
