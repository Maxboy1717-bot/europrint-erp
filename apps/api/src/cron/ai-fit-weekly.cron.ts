/**
 * @module ai-fit-weekly.cron
 * @description 2.18 (MASTER-REJA-VIZYON) — "har karta AI'si muntazam" vizyonini bajaradi.
 *   AiFitService.evaluate() ilgari faqat on-demand POST /ai/fit/evaluate orqali
 *   chaqirilardi — avto-tsikl (cron) yo'q edi. Bu cron har HAFTA (Dushanba 03:00
 *   Toshkent) faol org_functions kartasi + unga `users.org_function_id` orqali
 *   biriktirilgan xodim juftliklarini DrizzleAiFitRepo.listActiveCardAssignments()
 *   orqali oladi va har biri uchun AiFitService.evaluate() ni chaqiradi.
 *
 *   GRACEFUL (Q-40 / evaluate() ning o'z mexanizmi): AI-kalit yo'q yoki AI chaqiruv
 *   xato bo'lsa, evaluate() FALLBACK_FIT_SCORE=50 bilan ai_fit_scores'ga baribir
 *   yozadi (hech qachon throw qilmaydi) — bu servisning mavjud xatti-harakati,
 *   bu faylda TAKRORLANMAYDI/o'zgartirilmaydi. Tasodifiy/o'ylab-chiqarilgan son
 *   YO'Q — faqat servisning o'z fallback qiymati yoki haqiqiy AI natijasi.
 *
 *   Idempotent emas — har hafta yangi ai_fit_scores qatori qo'shiladi (tarixiy
 *   trend uchun; findLatestByEmployee() eng oxirgisini oladi). Bitta karta xato
 *   bersa boshqalar davom etadi (runWeeklyCycle() ichida per-row try captured
 *   Result orqali).
 *
 * @layer Cron (AI)
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { isOk } from '@common/result';
import { AiFitService } from '../modules/ai/application/services/ai-fit.service';
import { CronStatusService } from './cron-status.service';

@Injectable()
export class AiFitWeeklyCron {
  private readonly logger = new Logger(AiFitWeeklyCron.name);
  /** Bir vaqtda faqat bitta run (uzun AI-chaqiruvlar ketma-ket — overlap oldini olish). */
  private running = false;

  constructor(
    private readonly aiFitService: AiFitService,
    private readonly cronStatus: CronStatusService,
  ) {}

  @Cron('0 3 * * 1') // har hafta Dushanba 03:00 Toshkent
  async runWeeklyFitCycle(): Promise<void> {
    const jobName = 'AiFitWeeklyCron';
    if (this.running) {
      this.logger.warn(`${jobName}: oldingi run hali tugamadi — bu run o'tkazib yuborildi`);
      return;
    }
    this.running = true;
    try {
      const r = await this.aiFitService.runWeeklyCycle();
      if (!isOk(r)) {
        this.logger.error(`${jobName} xato: ${r.error.message}`);
        this.cronStatus.recordFailure(jobName, r.error.message);
        return;
      }
      const { total, succeeded, failed } = r.data;
      this.logger.log(`${jobName}: ${total} karta-xodim juftligi — ${succeeded} baholandi, ${failed} xato`);
      this.cronStatus.recordSuccess(jobName);
    } catch (err) {
      this.logger.error(`${jobName} istisno: ${String(err)}`);
      this.cronStatus.recordFailure(jobName, String(err));
    } finally {
      this.running = false;
    }
  }
}
