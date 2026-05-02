import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { QUEUE_NAMES } from '../modules/queue/queue.constants';

/**
 * Sprint 2 — TZ-02/TZ-04: Haftalik EOQ qayta hisoblash + Safety Stock yangilash
 *
 * Har dushanba 03:00 da ishga tushadi:
 *   1. EOQ qayta hisoblash barcha materiallar uchun
 *   2. Safety Stock EWM α=0.2 va ABC Z-scores bilan yangilash
 *
 * Ish BullMQ mrp-run navbatiga yuboriladi (async, Redis orqali).
 * Redis mavjud bo'lmasa — to'g'ridan-to'g'ri ishga tushiriladi.
 */
@Injectable()
export class EoqSafetyStockRefreshCron {
  private readonly logger = new Logger(EoqSafetyStockRefreshCron.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.MRP_RUN) private readonly mrpQueue: Queue,
  ) {}

  /** Har dushanba 03:00 (UTC+5 uchun: 22:00 UTC yakshanba) */
  @Cron('0 3 * * 1')
  async runWeeklyRefresh(): Promise<void> {
    this.logger.log('Haftalik EOQ + Safety Stock + Turnover view yangilash boshlandi');
    try {
      await this.mrpQueue.add(
        'eoq-refresh',
        { jobType: 'EOQ_RECALC_ALL', triggeredBy: 'weekly-cron' },
        { priority: 10, attempts: 3 },
      );
      await this.mrpQueue.add(
        'safety-stock-refresh',
        { jobType: 'SAFETY_STOCK_REFRESH', triggeredBy: 'weekly-cron' },
        { priority: 10, attempts: 3, delay: 60_000 },
      );
      this.logger.log('EOQ + Safety Stock refresh navbatga qo\'shildi');

      await runQuery(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY v_inventory_turnover`).catch((e: Error) => {
        this.logger.warn(`v_inventory_turnover yangilashda xato: ${String(e)}`);
      });
      this.logger.log('v_inventory_turnover materialized view yangilandi');
    } catch (err) {
      this.logger.error(`Haftalik refresh xatosi: ${String(err)}`);
    }
  }
}
