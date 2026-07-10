/**
 * @module win-back.cron
 * @description Modul 14 Marketing — 3 oy buyurtma bermagan mijozga win-back avto-start
 *   (vision 14-marketing #46). Har kuni 07:15 (Toshkent) faol emas mijozlarni topib,
 *   SD'da ochiq lead bo'lmasa, har biriga kanban win-back vazifasini yaratadi.
 *
 *   Ketma-ket (sequential) ishlaydi — createWinBackTask sort_order ni oxirgi qiymatdan
 *   +1 qilib hisoblaydi; parallel bajarilsa bir xil sort_order to'qnashishi mumkin edi.
 *
 * @layer Cron (Marketing)
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { isErr } from '@common/result';
import { WinBackRepository } from '../repositories/win-back.repository';
import { MARKETING_WINBACK_INACTIVE_MONTHS } from '@common/constants/business.constants';

@Injectable()
export class WinBackCron {
  private readonly logger = new Logger(WinBackCron.name);

  constructor(private readonly repo: WinBackRepository) {}

  /** Har kuni 07:15 (Toshkent) — faol emas mijozlarga win-back vazifa yaratadi. */
  @Cron('15 7 * * *', { timeZone: 'Asia/Tashkent' })
  async startWinBackTasks(): Promise<void> {
    const candR = await this.repo.findInactiveCustomersToWinBack(MARKETING_WINBACK_INACTIVE_MONTHS);
    if (isErr(candR)) {
      this.logger.error(`findInactiveCustomersToWinBack: ${candR.error.message}`);
      return;
    }
    const candidates = Array.isArray(candR.data) ? candR.data : [];
    if (candidates.length === 0) return;

    const targetR = await this.repo.resolveDefaultBoardColumn();
    if (isErr(targetR)) {
      this.logger.error(`resolveDefaultBoardColumn: ${targetR.error.message}`);
      return;
    }
    const target = targetR.data;
    if (!target) {
      this.logger.warn('Win-back: standart kanban board/ustun topilmadi — vazifa yaratilmadi');
      return;
    }

    this.logger.log(`Win-back: ${candidates.length} ta ${MARKETING_WINBACK_INACTIVE_MONTHS} oy+ faol emas mijoz uchun vazifa yaratilmoqda`);
    let created = 0;
    for (const cand of candidates) {
      const r = await this.repo.createWinBackTask(target, cand);
      if (isErr(r)) {
        this.logger.warn(`Win-back mijoz #${cand.customer_id}: vazifa yaratilmadi — ${r.error.message}`);
        continue;
      }
      created += 1;
    }
    this.logger.log(`Win-back: ${created}/${candidates.length} ta win-back vazifa yaratildi`);
  }
}
