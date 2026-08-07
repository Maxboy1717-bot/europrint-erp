/**
 * @module overdue-po.cron
 * @description Kechikkan xarid buyurtmalari (PO) — ichki xaridor/menejerga eslatma.
 *
 * AUDIT 2026-08-07 — nima uchun qayta yozildi
 *   Bu fayl `processed = 0` qattiq yozib, hech qanday DB so'rovisiz har kuni "✅ muvaffaqiyatli"
 *   deb log yozardi (`docs/audit/FANTOM-JADVALLAR-2026-08-07.md` bilan bir xil naqsh — yashil,
 *   lekin yolg'on). Endi kanonik `purchase_orders` (asosiy jadval; `mm_purchase_orders` — shu
 *   ustidan VIEW, `information_schema.tables` bilan tasdiqlangan) dan `expected_date` bo'yicha
 *   real so'rov yuboradi.
 *
 * QARORLAR
 *   - "Kutayotgan" holat = status hali `received`/`invoiced`/`closed`/`cancelled` emas
 *     (`PurchaseOrderAggregate.PoStatus`, `mm-purchase-orders.controller.ts` bilan bir xil
 *     lug'at — lowercase).
 *   - Eslatma manzili = `purchase_orders.created_by` (PO ni yaratgan xaridor/menejer) — eski
 *     izohda aytilganidek, YETKAZUVCHI EMAS.
 *   - Eslatma chegarasi (necha kun oldindan) — `business_settings.mm.po_reminder_days_ahead`
 *     orqali CRUD (egasi qoidasi: threshold hech qachon kodga qotmaydi).
 *   - Dedup — `stock-alert.cron.ts` bilan bir xil NOT EXISTS naqshi: bir xil PO uchun 24 soatda
 *     bitta eslatma.
 */

import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { CommandBus } from '@nestjs/cqrs'
import { sql } from 'drizzle-orm'
import { runQuery } from '@shared/db'
import { CreateNotificationCommand } from '../modules/notifications/application/commands/create-notification.command'
import { getBusinessSettingNumber } from '../shared/config/business-settings.reader'

/** `business_settings.mm.po_reminder_days_ahead` — fallback qiymat. */
const PO_REMINDER_DAYS_AHEAD_FALLBACK = 3
/** Holatlar — kutayotgan hisoblanmaydi (mol allaqachon kelgan/yopilgan/bekor qilingan). */
const NOT_PENDING_STATUSES = ['received', 'invoiced', 'closed', 'cancelled'] as const

interface OverduePoRow {
  id: number
  po_number: string
  vendor_name: string | null
  expected_date: string
  days_remaining: number
  created_by: number | null
}

@Injectable()
export class OverduePoCron {
  private readonly logger = new Logger(OverduePoCron.name)

  constructor(private readonly commandBus: CommandBus) {}

  /** 09:00 — muddati yaqinlashgan/o'tgan xarid buyurtmalarini tekshirish. */
  @Cron('0 9 * * *')
  async run(): Promise<void> {
    try {
      const daysAhead = await getBusinessSettingNumber('mm.po_reminder_days_ahead', PO_REMINDER_DAYS_AHEAD_FALLBACK)

      const r = await runQuery<OverduePoRow>(sql`
        SELECT po.id, po.po_number,
               COALESCE(po.vendor_name, po.vendor_id::text) AS vendor_name,
               po.expected_date::text AS expected_date,
               (po.expected_date - CURRENT_DATE)::int AS days_remaining,
               po.created_by
        FROM purchase_orders po
        WHERE po.deleted_at IS NULL
          AND po.status NOT IN (${sql.join(NOT_PENDING_STATUSES.map((s) => sql`${s}`), sql`, `)})
          AND po.expected_date IS NOT NULL
          AND po.expected_date <= CURRENT_DATE + (${daysAhead}::int * INTERVAL '1 day')
          AND po.created_by IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM notifications n
            WHERE n.reference_type = 'purchase_order_overdue'
              AND n.reference_id = po.id
              AND n.created_at > NOW() - INTERVAL '24 hours'
          )
        ORDER BY po.expected_date ASC
        LIMIT 100
      `)

      if (r.rows.length === 0) {
        this.logger.log('OverduePo: kechikkan/kechikish arafasidagi PO topilmadi')
        return
      }

      let sent = 0
      for (const po of r.rows) {
        const overdue = po.days_remaining < 0
        const result = await this.commandBus.execute(
          new CreateNotificationCommand(
            String(po.created_by),
            overdue ? "Xarid buyurtmasi muddati o'tdi" : 'Xarid buyurtmasi muddati yaqinlashmoqda',
            `${po.po_number} (${po.vendor_name ?? '—'}): kutilgan sana ${po.expected_date}` +
              (overdue ? `, ${Math.abs(po.days_remaining)} kun kechikdi.` : `, ${po.days_remaining} kun qoldi.`),
            'mm_po_overdue',
            String(po.id),
            'purchase_order_overdue',
          ),
        ).catch((err: unknown) => {
          this.logger.warn(`PO #${po.id} bildirishnomasi yuborilmadi: ${String(err)}`)
          return null
        })
        if (result) sent++
      }

      this.logger.warn(`OverduePo: ${r.rows.length} ta PO topildi, ${sent} ta bildirishnoma yuborildi`)
    } catch (err) {
      this.logger.error(`OverduePo cron xatosi: ${String(err)}`)
    }
  }
}
