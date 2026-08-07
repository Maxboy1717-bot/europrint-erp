/**
 * @module credit-check.cron
 * @description Kredit limitiga yaqinlashgan mijozlarni topib, mas'ul menejerga ogohlantirish.
 *
 * AUDIT 2026-08-07 — nima uchun qayta yozildi
 *   Bu fayl `processed = 0` qattiq yozib, hech qanday DB so'rovisiz har kuni "✅ muvaffaqiyatli"
 *   deb log yozardi. Eski izohdagi "CRM kontakt: overspend_alert_status = true" maydoni bazada
 *   YO'Q — bu qismi bajarilmadi (Q-40, mavjud bo'lmagan ustunga yozib bo'lmaydi).
 *
 * QARORLAR
 *   - Formula = `drizzle-sd-customers.repo.ts getCreditStatus()` bilan AYNAN bir xil: kredit
 *     limit ╳ `sd_payments.status='pending'` yig'indisi (bir xil hisob ikki joyda bir xil natija
 *     bersin — "bir joyda tuzatilib qo'shnisi unutilgan" naqshining oldini olish).
 *   - `credit_limit = 0` → chegara qo'yilmagan, tekshirilmaydi (asl metoddagi qoida bilan bir xil).
 *   - Chegara foizi (default 80%) — `business_settings.sd.credit_check_warn_pct` orqali CRUD.
 *   - Eslatma manzili — `sd_customers.manager_id` (mijozga biriktirilgan menejer).
 *   - E1 printsipi (Kanban registri #29 bilan izchil): bu cron HECH QACHON blokламaydi, faqat
 *     ogohlantiradi — bloklash qarori FIN menejerga tegishli.
 */

import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { CommandBus } from '@nestjs/cqrs'
import { sql } from 'drizzle-orm'
import { runQuery } from '@shared/db'
import { CreateNotificationCommand } from '../modules/notifications/application/commands/create-notification.command'
import { getBusinessSettingNumber } from '../shared/config/business-settings.reader'

/** `business_settings.sd.credit_check_warn_pct` — fallback qiymat (0.8 = 80%). */
const CREDIT_WARN_PCT_FALLBACK = 0.8

interface CreditRiskRow {
  id: number
  name: string
  manager_id: number | null
  credit_limit: string
  outstanding: string
}

@Injectable()
export class CreditCheckCron {
  private readonly logger = new Logger(CreditCheckCron.name)

  constructor(private readonly commandBus: CommandBus) {}

  /** 08:00 — kredit limitga yaqinlashgan mijozlarni tekshirish. */
  @Cron('0 8 * * *')
  async run(): Promise<void> {
    try {
      const warnPct = await getBusinessSettingNumber('sd.credit_check_warn_pct', CREDIT_WARN_PCT_FALLBACK)

      const r = await runQuery<CreditRiskRow>(sql`
        SELECT c.id, c.name, c.manager_id,
               COALESCE(c.credit_limit, 0)::text AS credit_limit,
               COALESCE((SELECT SUM(p.amount) FROM sd_payments p
                         WHERE p.customer_id = c.id AND p.status = 'pending'), 0)::text AS outstanding
        FROM sd_customers c
        WHERE c.status != 'deleted' AND c.deleted_at IS NULL
          AND c.manager_id IS NOT NULL
          AND COALESCE(c.credit_limit, 0) > 0
          AND COALESCE((SELECT SUM(p.amount) FROM sd_payments p
                        WHERE p.customer_id = c.id AND p.status = 'pending'), 0)
                >= COALESCE(c.credit_limit, 0) * ${warnPct}
          AND NOT EXISTS (
            SELECT 1 FROM notifications n
            WHERE n.reference_type = 'sd_customer_credit_risk'
              AND n.reference_id = c.id
              AND n.created_at > NOW() - INTERVAL '24 hours'
          )
      `)

      if (r.rows.length === 0) {
        this.logger.log('CreditCheck: kredit limitiga yaqinlashgan mijoz topilmadi')
        return
      }

      let sent = 0
      for (const c of r.rows) {
        const limit = Number(c.credit_limit)
        const outstanding = Number(c.outstanding)
        const pct = limit > 0 ? Math.round((outstanding / limit) * 100) : 0
        const result = await this.commandBus.execute(
          new CreateNotificationCommand(
            String(c.manager_id),
            'Mijoz kredit limitiga yaqinlashmoqda',
            `${c.name}: qoldiq ${outstanding.toLocaleString('uz')} / limit ${limit.toLocaleString('uz')} (${pct}%)`,
            'sd_credit_risk',
            String(c.id),
            'sd_customer_credit_risk',
          ),
        ).catch((err: unknown) => {
          this.logger.warn(`Mijoz #${c.id} bildirishnomasi yuborilmadi: ${String(err)}`)
          return null
        })
        if (result) sent++
      }

      this.logger.warn(`CreditCheck: ${r.rows.length} ta mijoz kredit-xavfida, ${sent} ta bildirishnoma yuborildi`)
    } catch (err) {
      this.logger.error(`CreditCheck cron xatosi: ${String(err)}`)
    }
  }
}
