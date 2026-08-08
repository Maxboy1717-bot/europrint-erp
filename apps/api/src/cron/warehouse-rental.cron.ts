/**
 * @module warehouse-rental.cron
 * @description Ijara muddati yaqinlashgan aktiv omborlar uchun menejerga eslatma.
 *
 * AUDIT 2026-08-07 — nima uchun qayta yozildi
 *   Bu fayl `processed = 0` qattiq yozib, hech qanday DB so'rovisiz har kuni "✅
 *   muvaffaqiyatli" deb log yozardi.
 *
 * QARORLAR
 *   - "Aktiv ijara yozuvlarini yangilash (billableDays/totalAmount hisoblash)" QISMI —
 *     ⛔ QASDDAN QURILMADI: bu allaqachon bor va bu croni QAYTARARDI. `warehouse-rental
 *     .repository.ts getRecords()` `status='active'` yozuvlar uchun `total_days`/
 *     `billable_days`/`total_amount` ni HAR SO'ROVDA CASE-ifoda bilan JONLI hisoblaydi
 *     (saqlangan qiymat emas) — persist qilingan yangilanish umuman kerak emas, u faqat
 *     `closeRecord()` da (ijara yopilganda) muzlatiladi. Bu qismni "qurish" allaqachon
 *     ishlayotgan mexanizmni dublikat qilgan bo'lardi (Q-46).
 *   - "8 kundan qolsa signal" QISMI — bu croni yagona haqiqiy vazifasi. Chegara allaqachon
 *     `warehouse_rental_settings.notify_days_before` orqali CRUD (default 8, `updateSettings()`
 *     da mavjud) — yangi business_settings kalit KERAK EMAS, mavjud sozlamadan o'qiladi.
 *   - Dedup — jadvalning o'z `notified_at` ustunidan (generic `notifications` NOT EXISTS
 *     naqshi emas, chunki bu yerda maxsus ustun allaqachon bor): kuniga bir marta.
 *   - Eslatma manzili — `warehouse_rental_records.manager_id`.
 */

import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { CommandBus } from '@nestjs/cqrs'
import { sql } from 'drizzle-orm'
import { db, runQuery } from '@shared/db'
import { CreateNotificationCommand } from '../modules/notifications/application/commands/create-notification.command'

/** `warehouse_rental_settings.notify_days_before` bo'sh bo'lsa ishlatiladigan fallback. */
const NOTIFY_DAYS_BEFORE_FALLBACK = 8

interface EndingRentalRow {
  id: number
  manager_id: number | null
  product_name: string | null
  warehouse_name: string | null
  end_date: string
  days_remaining: number
}

@Injectable()
export class WarehouseRentalCron {
  private readonly logger = new Logger(WarehouseRentalCron.name)

  constructor(private readonly commandBus: CommandBus) {}

  /** Har kuni 00:05 — muddati yaqinlashgan aktiv ijaralarni tekshirish. */
  @Cron('5 0 * * *')
  async run(): Promise<void> {
    try {
      const settingsRow = await runQuery<{ notify_days_before: number | null }>(
        sql`SELECT notify_days_before FROM warehouse_rental_settings ORDER BY updated_at DESC LIMIT 1`,
      ).catch(() => ({ rows: [] as Array<{ notify_days_before: number | null }> }))
      const notifyDaysBefore = settingsRow.rows[0]?.notify_days_before ?? NOTIFY_DAYS_BEFORE_FALLBACK

      const r = await runQuery<EndingRentalRow>(sql`
        SELECT id, manager_id, product_name, warehouse_name,
               end_date::text AS end_date,
               (end_date - CURRENT_DATE)::int AS days_remaining
        FROM warehouse_rental_records
        WHERE status = 'active'
          AND end_date IS NOT NULL
          AND end_date <= CURRENT_DATE + (${notifyDaysBefore}::int * INTERVAL '1 day')
          AND manager_id IS NOT NULL
          AND (notified_at IS NULL OR notified_at::date < CURRENT_DATE)
        ORDER BY end_date ASC
        LIMIT 100
      `)

      if (r.rows.length === 0) {
        this.logger.log('WarehouseRental: muddati yaqinlashgan aktiv ijara topilmadi')
        return
      }

      let sent = 0
      for (const rent of r.rows) {
        const overdue = rent.days_remaining < 0
        const result = await this.commandBus.execute(
          new CreateNotificationCommand(
            String(rent.manager_id),
            overdue ? "Ombor ijarasi muddati o'tdi" : 'Ombor ijarasi muddati yaqinlashmoqda',
            `${rent.product_name ?? '—'} (${rent.warehouse_name ?? '—'}): tugash sanasi ${rent.end_date}` +
              (overdue ? `, ${Math.abs(rent.days_remaining)} kun kechikdi.` : `, ${rent.days_remaining} kun qoldi.`),
            'wms_rental_ending',
            String(rent.id),
            'warehouse_rental_ending',
          ),
        ).catch((err: unknown) => {
          this.logger.warn(`Ijara #${rent.id} bildirishnomasi yuborilmadi: ${String(err)}`)
          return null
        })
        if (result) {
          sent++
          await db.execute(sql`UPDATE warehouse_rental_records SET notified_at = NOW() WHERE id = ${rent.id}`)
            .catch((err: unknown) => this.logger.warn(`Ijara #${rent.id} notified_at yozilmadi: ${String(err)}`))
        }
      }

      this.logger.warn(`WarehouseRental: ${r.rows.length} ta ijara muddati yaqinlashmoqda, ${sent} ta bildirishnoma yuborildi`)
    } catch (err) {
      this.logger.error(`WarehouseRental cron xatosi: ${String(err)}`)
    }
  }
}
