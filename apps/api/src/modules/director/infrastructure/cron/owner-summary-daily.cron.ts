/**
 * @module owner-summary-daily.cron
 * @description Director — egasi kunlik hisobotini Telegram orqali avtomatik yuborish.
 *   Vizyon/audit (SB0379, P2): `OwnerSummaryService.buildSummary(true)` (holat + 5 egasi
 *   raqami + Telegram push) allaqachon mavjud edi (`trySend()`), lekin faqat qo'lda
 *   `POST /director/owner-summary/send` chaqirilganda ishlar edi — kunlik avtomatik
 *   yuborish (cron) YO'Q edi. Bu cron shu bo'shliqni yopadi (rasporyazhenie-escalation.cron /
 *   zno-zvs-sla-escalation.cron bilan bir xil naqsh: shu modul ichida @Cron, director.module.ts
 *   providers'ga qo'shiladi).
 *
 *   Config-gated (TELEGRAM_BOT_TOKEN + OWNER_TELEGRAM_CHAT_ID) — `buildSummary()` allaqachon
 *   graceful: config yo'q bo'lsa `sent=false, reason='telegram_not_configured'` bilan qaytadi,
 *   hech qachon throw qilmaydi (Result pattern, `safeCall`). Cron shu natijani faqat log qiladi.
 * @layer Cron (Director)
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OwnerSummaryService } from '../../application/owner-summary.service';

@Injectable()
export class OwnerSummaryDailyCron {
  private readonly logger = new Logger(OwnerSummaryDailyCron.name);

  constructor(private readonly ownerSummary: OwnerSummaryService) {}

  /**
   * Har kuni ertalab 08:00 (Tashkent) — holat + 5 egasi raqamini hisoblab, config bo'lsa
   * Telegramga yuborish. Config yo'q bo'lsa ham compute muvaffaqiyatli bo'ladi (graceful),
   * faqat `telegram.sent=false` bilan — bu holat log'da ko'rinadi (owner keyin config qo'shsa
   * darhol ishlay boshlaydi, kod tomonidan hech narsa o'zgartirish shart emas).
   */
  @Cron('0 8 * * *')
  async sendDailyDigest(): Promise<void> {
    const result = await this.ownerSummary.buildSummary(true);
    if (!result.ok) {
      this.logger.warn(`[OwnerSummaryDailyCron] hisobot hisoblashda xato: ${result.error.message}`);
      return;
    }
    const { telegram } = result.data;
    if (telegram.sent) {
      this.logger.log('[OwnerSummaryDailyCron] kunlik hisobot Telegramga yuborildi');
    } else {
      this.logger.warn(`[OwnerSummaryDailyCron] Telegramga yuborilmadi: ${telegram.reason}`);
    }
  }
}
