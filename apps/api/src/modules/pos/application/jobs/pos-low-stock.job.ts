/**
 * @module pos-low-stock.job
 * @description Source module. See exports for details.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PosFifoService } from '../services/pos-fifo.service';
import { PosTelegramService } from '../services/pos-telegram.service';
import { PosNotificationsService } from '../services/pos-notifications.service';
import { NotificationRoutingRepository } from '../../../notifications/infrastructure/notification-routing.repository';

/** notification_routing_rules.event_type — config-driven qilib qo'yiladi (FAZA Bildirishnoma, 2026-07-01). */
const LOW_STOCK_EVENT_TYPE = 'wms.low_stock';
/** Jadvalda qator bo'lmasa qaytiladigan avvalgi hardcoded rol (regressiya yo'q, Q-39). */
const LOW_STOCK_FALLBACK_ROLE = 'pos_manager';

@Injectable()
export class PosLowStockJob {
  private readonly logger = new Logger(PosLowStockJob.name);

  constructor(
    private readonly fifo:          PosFifoService,
    private readonly telegram:      PosTelegramService,
    private readonly notifications: PosNotificationsService,
    private readonly routing:       NotificationRoutingRepository,
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

      // egasi/admin sozlagan nishon rol(lar) — notification_routing_rules (event_type='wms.low_stock');
      // sozlanmagan bo'lsa avvalgi hardcoded 'pos_manager'ga qaytadi (regressiya yo'q).
      const targetRolesResult = await this.routing.resolveRoles(LOW_STOCK_EVENT_TYPE, LOW_STOCK_FALLBACK_ROLE);
      const targetRoles = targetRolesResult.ok ? targetRolesResult.data : [LOW_STOCK_FALLBACK_ROLE];

      for (const item of r.data.slice(0, 20)) {
        for (const targetRole of targetRoles) {
          await this.notifications.createNotification({
            type: 'LOW_STOCK',
            title: 'Past qoldiq ogohlantirishi',
            body: `Material ${item.materialCode}: ${item.currentQty}/${item.minQty} (Ombor #${item.warehouseId})`,
            targetRole,
          }).catch(() => null);
        }
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
