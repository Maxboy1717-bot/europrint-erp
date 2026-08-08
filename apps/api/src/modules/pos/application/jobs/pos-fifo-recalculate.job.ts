/**
 * @module pos-fifo-recalculate.job
 * @description Source module. See exports for details.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PosFifoService } from '../services/pos-fifo.service';

@Injectable()
export class PosFifoRecalculateJob {
  private readonly logger = new Logger(PosFifoRecalculateJob.name);

  constructor(private readonly fifo: PosFifoService) {}

  /**
   * Har kuni 02:00 da omborda qolgan muddati o'tgan partiyalarni sanaydi.
   *
   * Audit 2026-08-07: bu ilgari `markExpiredBatches()` ni chaqirardi va u mavjud bo'lmagan
   * `pos_batches` jadvaliga yozardi — cron har kecha yiqilib, xato `Result` ichida yutilardi
   * (`r.ok` false bo'lgani uchun log ham chiqmasdi). Endi kanonik `batch_lots` dan haqiqiy
   * sonni oladi; xato bo'lsa jim qolmaydi.
   */
  @Cron('0 2 * * *')
  async recalculate(): Promise<void> {
    this.logger.debug('FIFO: muddati o\'tgan partiyalar tekshirilmoqda...');
    try {
      const r = await this.fifo.countExpiredBatches();
      if (!r.ok) {
        this.logger.warn(`FIFO muddat tekshiruvi bajarilmadi: ${r.error}`);
        return;
      }
      if (r.data > 0) {
        this.logger.warn(`${r.data} ta partiya muddati o'tgan va hamon omborda — ombor hisobotini ko'ring`);
      }
    } catch (err: unknown) {
      this.logger.error('FIFO recalculate job xatosi:', err);
    }
  }
}
