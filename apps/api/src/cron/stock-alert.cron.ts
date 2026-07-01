/**
 * @module stock-alert.cron
 * @description FAZA Bildirishnoma (2026-07-01): bu fayl avval to'liq ishlamaydigan stub edi
 *   (`processed=0` hardcode, real DB so'rovi yo'q) va maqsadi (minimal zaxira/low-stock)
 *   `pos-low-stock.job.ts` bilan dublikat edi (Q-46: ishlamaydigan dublikat — to'liq
 *   qayta quriladi, saqlab qo'yilmaydi). Ombor uchun butunlay yo'q bo'lgan haqiqiy
 *   bo'shliqqa — LOT/PARTIYA MUDDATI TUGASHI (expiry) — qayta yo'naltirildi: audit
 *   (2026-07-01) "wms modulida @Cron 0 ta, faqat hisobot bor, bildirishnoma yaratmaydi"
 *   deb topgan edi.
 *
 *   Real so'rov `WmsCatalogAbcAgingExpiryService.getExpiry()` orqali (Q-46: mavjud,
 *   sinovdan o'tgan `batch_lots` so'rovini TAKRORLAMAYDI, qayta ishlatadi). Nishon
 *   (kimga yuborish) `notification_routing_rules` (event_type='wms.lot_expiring')
 *   orqali config-driven — egasi/admin `notification-routing-rules` CRUD orqali
 *   o'zgartira oladi; jadval bo'sh bo'lsa 'director' fallback (default seed qatori).
 *   Bir xil lot uchun 24 soat ichida takror bildirishnoma yubormaslik uchun
 *   NOT EXISTS dedupe (reference_type='batch_lot_expiry').
 */

import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { sql } from 'drizzle-orm'
import { runQuery } from '@shared/db'
import { WmsCatalogAbcAgingExpiryService } from '../modules/wms/application/wms-catalog/abc-aging-expiry.service'
import { NotificationRoutingRepository } from '../modules/notifications/infrastructure/notification-routing.repository'

/** notification_routing_rules.event_type. */
const LOT_EXPIRING_EVENT_TYPE = 'wms.lot_expiring'
/** Jadvalda qator bo'lmasa qaytiladigan fallback rol. */
const LOT_EXPIRING_FALLBACK_ROLE = 'director'
/** Nechi kun oldindan ogohlantirish (expiry-service ichida critical<=7, warning<=30). */
const DAYS_AHEAD = 30

@Injectable()
export class StockAlertCron {
  private readonly logger = new Logger(StockAlertCron.name)

  constructor(
    private readonly expiry:  WmsCatalogAbcAgingExpiryService,
    private readonly routing: NotificationRoutingRepository,
  ) {}

  /** Har kuni 08:00 — muddati tugayotgan/tugagan ombor lot/partiyalarini tekshirish. */
  @Cron('0 8 * * *')
  async run(): Promise<void> {
    const result = { success: false, processed: 0, errors: [] as string[] }
    try {
      const { data } = await this.expiry.getExpiry(DAYS_AHEAD)
      const urgent = data.filter(d => d.status === 'critical' || d.status === 'expired')
      if (urgent.length === 0) {
        result.success = true
        this.logger.log(`✅ StockAlert (lot-expiry): processed=0 (shoshilinch lot yo'q)`)
        return
      }

      const userIds = await this.routing.resolveUserIds(LOT_EXPIRING_EVENT_TYPE, LOT_EXPIRING_FALLBACK_ROLE)
      let processed = 0

      for (const item of urgent.slice(0, 100)) {
        const title = item.status === 'expired' ? 'Ombor lot muddati tugadi' : 'Ombor lot muddati tugashi yaqin'
        const body = `${item.name} (partiya ${item.batchNumber}): ${item.quantity} ${item.unitOfMeasure}, ` +
          (item.daysToExpiry < 0 ? `${Math.abs(item.daysToExpiry)} kun oldin tugagan` : `${item.daysToExpiry} kun qoldi`)
        const priority = item.status === 'expired' ? 'urgent' : 'high'

        for (const userId of userIds) {
          const r = await runQuery<{ id: number }>(sql`
            INSERT INTO notifications
              (user_id, type, title, body, is_read, priority, title_uz, message_uz,
               reference_id, reference_type, created_at)
            SELECT ${userId}, 'wms_lot_expiring', ${title}, ${body}, FALSE, ${priority},
                   ${title}, ${body}, ${Number(item.materialId)}, 'batch_lot_expiry', NOW()
            WHERE NOT EXISTS (
              SELECT 1 FROM notifications
              WHERE user_id = ${userId} AND reference_type = 'batch_lot_expiry'
                AND reference_id = ${Number(item.materialId)} AND created_at > NOW() - INTERVAL '1 day'
            )
            RETURNING id
          `)
          if (r.rows.length > 0) processed += 1
        }
      }

      result.success = true
      result.processed = processed
      this.logger.log(`✅ StockAlert (lot-expiry): shoshilinch=${urgent.length} bildirishnoma=${processed}`)
    } catch (err) {
      result.errors.push(String(err))
      this.logger.error(`❌ StockAlert error: ${String(err)}`)
    }
  }
}
