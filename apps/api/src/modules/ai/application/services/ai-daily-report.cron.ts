/**
 * @module ai-daily-report.cron
 * @description T12-08 — Kunlik ЦКП AI-chatbot cron (mashinasiz xodimga savol).
 *
 *   Vizyon (EP-ORG-002, ЦКП 12%): mashinasiz (MES'siz) xodim kunlik ЦКП-savolni
 *   AI-chatbotdan oladi → erkin matnda javob beradi → kunlik hisobot. Mashina
 *   operatorlari ЦКП'ni IoT/MES avto-feed orqali oladi (operator-hourly-invoice.cron) —
 *   ularga savol yo'llanmaydi (takror yo'q).
 *
 *   Bu cron HAR KUNI 07:00 (Toshkent, Du-Sha) mashinasiz xodimga biriktirilgan,
 *   ЦКП-meta'si bor kartalar uchun ЦКП-savolni `ai_ckp_chat_logs`'ga 'assistant'
 *   navbati sifatida yozadi (xodim keyin shu sessiyada javob beradi → submit()).
 *
 *   GRACEFUL (Q-40): AI-kalit yo'q bo'lsa cron SKIP qilmaydi — statik ЦКП-savol
 *   yo'llanadi (savol matni FAKT EMAS; hech qanday actualValue to'qilmaydi).
 *   Idempotent: o'sha kun savol yo'llangan kartalar repository tomonidan
 *   chiqarib tashlanadi (cron qayta yurganda takror savol YO'Q).
 *
 *   Biznes logika servisda (Qoida 6) — cron faqat scheduler + delegatsiya.
 *
 * @layer Cron (AI / ЦКП)
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TashkentTimeService } from '@common/time';
import { AiDailyReportService } from './ai-daily-report.service';

@Injectable()
export class AiDailyReportCron {
  private readonly logger = new Logger(AiDailyReportCron.name);
  private readonly time = new TashkentTimeService();
  /** Bir vaqtda faqat bitta run (uzun AI-chaqiruv overlap'ini oldini olish). */
  private running = false;

  constructor(private readonly service: AiDailyReportService) {}

  @Cron('0 7 * * 1-6', { timeZone: 'Asia/Tashkent' }) // har kuni 07:00 Toshkent (Du-Sha) — ish kuni boshida ЦКП-savol
  async pushDailyCkpQuestions(): Promise<void> {
    if (this.running) {
      this.logger.warn('[T12-08] Oldingi run hali tugamadi — bu run o\'tkazib yuborildi');
      return;
    }
    this.running = true;
    try {
      const factDate = this.time.formatDate(this.time.today());
      const r = await this.service.runDailyQuestionPush(factDate);
      if (!r.ok) {
        this.logger.error(`[T12-08] Kunlik ЦКП-savol cron xato (${factDate}): ${r.error.message}`);
        return;
      }
      const { candidates, questionsLogged, aiAvailable } = r.data;
      this.logger.log(
        `[T12-08] Kunlik ЦКП-savol (${factDate}): ${questionsLogged}/${candidates} ` +
        `mashinasiz kartaga yo'llandi (AI=${aiAvailable ? 'bor' : 'yo\'q→statik'})`,
      );
    } catch (err) {
      this.logger.error(`[T12-08] Kunlik ЦКП-savol cron istisno: ${String(err)}`);
    } finally {
      this.running = false;
    }
  }
}
