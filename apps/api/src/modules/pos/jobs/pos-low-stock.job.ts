/**
 * @module pos-low-stock.job
 * @description Source module. See exports for details.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PosFifoService } from '../services/pos-fifo.service';
import { PosTelegramService } from '../services/pos-telegram.service';
import { PosNotificationsService } from '../services/pos-notifications.service';

@Injectable()
export class PosLowStockJob {
  private readonly logger = new Logger(PosLowStockJob.name);

  constructor(
    private readonly fifo:          PosFifoService,
    private readonly telegram:      PosTelegramService,
    private readonly notifications: PosNotificationsService,
  ) {}

  /** Har soatda past qoldiqlarni tekshirish */
  @Cron(CronExpression.EVERY_HOUR)
  async checkLowStock(): Promise<void> {
    this.logger.debug('Past qoldiqlar tekshirilmoqda...');
    try {
      const r = await this.fifo.getLowStockMaterials();
      if (!r.ok) { this.logger.error('Low stock check: [%s] %s', r.error.code, r.error.message); return; }

      if (r.data.length === 0) return;

      this.logger.warn(`${r.data.length} ta material past qoldiqlarda`);

      for (const item of r.data.slice(0, 20)) {
        await this.notifications.createNotification({
          type: 'LOW_STOCK',
          title: 'Past qoldiq ogohlantirishi',
          body: `Material ${item.materialCode}: ${item.currentQty}/${item.minQty} (Ombor #${item.warehouseId})`,
          targetRole: 'pos_manager',
        }).catch(() => null);
      }

      const summary = r.data.slice(0, 5).map(i => `${i.materialCode}: ${i.currentQty}/${i.minQty}`).join('\n');
      await this.telegram.sendAlert({
        title: `⚠️ ${r.data.length} ta material tugayapti`,
        body: summary,
        severity: 'warning',
      }).catch(() => null);
    } catch (err: unknown) {
      this.logger.error('Low stock job xatosi:', err);
    }
  }
}
