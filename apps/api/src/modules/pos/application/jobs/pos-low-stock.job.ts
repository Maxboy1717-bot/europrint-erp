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
import { getAlertThreshold, ALERT_TYPE } from '../../../../shared/config/alert-thresholds.reader';

/** notification_routing_rules.event_type — config-driven qilib qo'yiladi (FAZA Bildirishnoma, 2026-07-01). */
const LOW_STOCK_EVENT_TYPE = 'wms.low_stock';
/**
 * Owner-decisions 2026-07-09: LOW_STOCK auto-routes to WAREHOUSE-role users
 * (omborchi / ombor boshlig'i), by role — not per-user subscription. Used as the
 * fallback when notification_routing_rules has no active rule for the event.
 */
const LOW_STOCK_FALLBACK_ROLE = 'warehouse_keeper';

/**
 * Audit 2026-08-07: `alert_thresholds` da `wms.low_stock` qatori (20%, "reorder nuqtaning shu
 * foizidan pastga tushsa ogohlantirish", 2026-08-03) mavjud edi, lekin **hech qanday kod uni
 * o'qimasdi** — ya'ni egasi foizni o'zgartirsa hech narsa o'zgarmasdi.
 *
 * ⚠️ ZIDDIYAT va u qanday hal qilindi: joriy kod `available_quantity < min_stock` da, ya'ni
 * reorder nuqtasining **100%** ida ogohlantiradi; jadval esa **20%** deydi. Agar chegara
 * to'g'ridan-to'g'ri filtrga qo'yilsa, ogohlantirishlar keskin **kamayadi** — bu xavfli
 * yo'nalishdagi regressiya bo'lardi (Q-39), va qaysi ma'no to'g'riligini egasi hal qilishi kerak
 * (Q-34). Shuning uchun chegara **qo'shimcha daraja** sifatida ishlatiladi: barcha reorder
 * ogohlantirishlari avvalgidek yuboriladi, chegaradan past tushganlari esa "KRITIK" deb
 * belgilanadi. Egasining raqami jonli ta'sirga ega bo'ldi, hech bir signal yo'qolmadi.
 */
const LOW_STOCK_CRITICAL_PCT_FALLBACK = 20;

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

      // Resolve the routing rule's target role(s) to concrete active user ids
      // (notification_routing_rules event_type='wms.low_stock'; falls back to the
      // warehouse_keeper role when unconfigured). We write ONE per-user notification
      // row each — visible via getForUser's user_id match — instead of a role-broadcast
      // row (user_id=0) that the reader never surfaced (that made the old routing inert).
      const userIdsResult = await this.routing.resolveUserIds(LOW_STOCK_EVENT_TYPE, LOW_STOCK_FALLBACK_ROLE);
      const targetUserIds = userIdsResult.ok ? userIdsResult.data : [];

      const criticalPct = await getAlertThreshold(ALERT_TYPE.WMS_LOW_STOCK, LOW_STOCK_CRITICAL_PCT_FALLBACK);
      const isCritical = (item: { currentQty: number; minQty: number }): boolean =>
        item.minQty > 0 && item.currentQty < item.minQty * (criticalPct / 100);
      const criticalCount = r.data.filter(isCritical).length;

      for (const item of r.data.slice(0, 20)) {
        const critical = isCritical(item);
        for (const uid of targetUserIds) {
          await this.notifications.sendNotification(
            uid,
            'LOW_STOCK',
            critical ? 'KRITIK past qoldiq' : 'Past qoldiq ogohlantirishi',
            `Material ${item.materialCode}: ${item.currentQty}/${item.minQty} (Ombor #${item.warehouseId})`
              + (critical ? ` — reorder nuqtasining ${criticalPct}% idan past!` : ''),
            'warehouse',
            item.warehouseId,
          ).catch(() => null);
        }
      }

      const summary = r.data.slice(0, 5)
        .map(i => `${isCritical(i) ? '🔴' : '⚠️'} ${i.materialCode}: ${i.currentQty}/${i.minQty}`)
        .join('\n');
      await this.telegram.sendAlert({
        title: criticalCount > 0
          ? `🔴 ${criticalCount} ta material KRITIK (jami ${r.data.length} ta tugayapti)`
          : `⚠️ ${r.data.length} ta material tugayapti`,
        body: summary,
        severity: criticalCount > 0 ? 'critical' : 'warning',
      }).catch(() => null);
    } catch (err: unknown) {
      this.logger.error('Low stock job xatosi:', err);
    }
  }
}
