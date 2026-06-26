/**
 * @module ckp-daily-aggregate.cron
 * @description A68 (MASSIV, modul ЦКП) — kunlik ЦКП kaskad-agregat. Har kuni 01:00 (Toshkent)
 *   o'tgan kun bo'yicha HAR root-karta (parent_id NULL) subtree o'rtacha achievement'ini hisoblaydi
 *   (CkpFactRepository.aggregateAllRoots — bitta so'rov, N+1 yo'q). Bu kunlik chaqiruvni isbotlaydi:
 *   ilgari aggregateByDate faqat on-demand endpoint (GET org-structure/ckp/aggregate/:cardId) orqali
 *   chaqirilardi; endi kunlik cron ham bor.
 *
 *   FABRIKATSIYA YO'Q: faqat o'sha kuni fakti bo'lgan root'lar qaytariladi (HAVING fact_count>0).
 *   Fakt yo'q kunda hech narsa yozilmaydi/log qilinmaydi (soxta 0% YO'Q). Hisob-kitob manbai
 *   ckp_fact_values — o'qish/agregat, yon-ta'sir yo'q (idempotent, run o'tkazib yuborilsa ham
 *   correctness buzilmaydi, chunki on-demand endpoint o'sha logikani qayta hisoblaydi).
 *   Delegatsiya repository'ga (Qoida 15).
 *
 * @layer Cron (Org / ЦКП)
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TashkentTimeService } from '@common/time';
import { CkpFactRepository } from '../modules/org-structure/ckp-fact.repository';
import { CronStatusService } from './cron-status.service';

@Injectable()
export class CkpDailyAggregateCron {
  private readonly logger = new Logger(CkpDailyAggregateCron.name);
  private readonly time = new TashkentTimeService();

  constructor(
    private readonly ckpRepo: CkpFactRepository,
    private readonly cronStatus: CronStatusService,
  ) {}

  @Cron('0 1 * * *') // every day at 01:00 Tashkent — aggregate the day that just completed
  async aggregateYesterday(): Promise<void> {
    const jobName = 'CkpDailyAggregateCron';
    // O'tgan kun (bugun 00:00 - 1 kun) — to'liq tugagan kun bo'yicha agregat.
    const yesterday = this.time.formatDate(this.time.addDays(this.time.today(), -1));

    const r = await this.ckpRepo.aggregateAllRoots(yesterday);
    if (!r.ok) {
      this.logger.error(`CkpDailyAggregateCron xato (${yesterday}): ${r.error.message}`);
      this.cronStatus.recordFailure(jobName, r.error.message);
      return;
    }
    const rows = Array.isArray(r.data) ? r.data : [];
    this.logger.log(`CkpDailyAggregateCron: ${yesterday} — ${rows.length} root-karta agregatlandi`);
    this.cronStatus.recordSuccess(jobName);
  }
}
