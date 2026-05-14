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

  /** Har kuni 02:00 da muddati o'tgan partiyalarni belgilash */
  @Cron('0 2 * * *')
  async recalculate(): Promise<void> {
    this.logger.debug('FIFO qayta hisoblash...');
    try {
      const r = await this.fifo.markExpiredBatches();
      if (r.ok && r.data > 0) this.logger.warn(`${r.data} ta partiya muddati o'tgan deb belgilandi`);
    } catch (err: unknown) {
      this.logger.error('FIFO recalculate job xatosi:', err);
    }
  }
}
