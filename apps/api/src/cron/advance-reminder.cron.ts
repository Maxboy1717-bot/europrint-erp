/**
 * @module advance-reminder.cron
 * @description Tasdiqlanmagan avans so'rovlari (payroll_advances) — menejerga eslatma.
 *
 * AUDIT 2026-08-07 — nima uchun qayta yozildi
 *   Bu fayl `processed = 0` qattiq yozib, hech qanday DB so'rovisiz har kuni "✅
 *   muvaffaqiyatli" deb log yozardi. Eski izohdagi "CFO attention needed flag" ustuni bazada
 *   YO'Q — o'rniga eskalatsiya darajasi bildirishnoma matnida (severity/sarlavha) ifodalanadi,
 *   yangi ustun fabrikatsiya qilinmadi (Q-40).
 *
 * QARORLAR
 *   - Kanonik jadval — `payroll_advances` (ikkita faol yozuvchi: `drizzle-finance-ops.repo.ts
 *     recordAdvance()` va `employees-compat-financials.service.ts createCashAdvance()`).
 *     `advance_payments` — alohida, procurement/vendor avanslar uchun (`pos/procurement-request
 *     .service.ts`), boshqa domen, bu yerga aralashtirilmadi.
 *   - Status lug'ati — `'pending'` (jonli default, `createCashAdvance()` da tasdiqlangan).
 *   - Eslatma manzili — `payroll_advances.employee_id` → `employees.manager_id` → o'sha
 *     menejerning `employees.user_id`i (jadvalning o'zida to'g'ridan-to'g'ri approver ustuni
 *     yo'q — `employees` orqali ikki bosqichli join, `profile.repo.ts`dagi bir xil naqsh).
 *   - Eskalatsiya chegarasi (necha kundan keyin CFO-darajali ogohlantirish) —
 *     `business_settings.finance.advance_escalation_days` orqali CRUD (default 7).
 */

import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { CommandBus } from '@nestjs/cqrs'
import { sql } from 'drizzle-orm'
import { runQuery } from '@shared/db'
import { CreateNotificationCommand } from '../modules/notifications/application/commands/create-notification.command'
import { getBusinessSettingNumber } from '../shared/config/business-settings.reader'

/** `business_settings.finance.advance_escalation_days` — fallback qiymat. */
const ESCALATION_DAYS_FALLBACK = 7

interface PendingAdvanceRow {
  id: number
  employee_id: number
  full_name: string | null
  amount: string
  request_date: string
  days_pending: number
  manager_user_id: number | null
}

@Injectable()
export class AdvanceReminderCron {
  private readonly logger = new Logger(AdvanceReminderCron.name)

  constructor(private readonly commandBus: CommandBus) {}

  /** 10:00 — tasdiqlanmagan avans so'rovlarini tekshirish. */
  @Cron('0 10 * * *')
  async run(): Promise<void> {
    try {
      const escalationDays = await getBusinessSettingNumber('finance.advance_escalation_days', ESCALATION_DAYS_FALLBACK)

      const r = await runQuery<PendingAdvanceRow>(sql`
        SELECT pa.id, pa.employee_id, e.full_name,
               pa.amount::text AS amount,
               pa.request_date::text AS request_date,
               (CURRENT_DATE - pa.request_date)::int AS days_pending,
               m.user_id AS manager_user_id
        FROM payroll_advances pa
        JOIN employees e ON e.id = pa.employee_id
        LEFT JOIN employees m ON m.id = e.manager_id
        WHERE pa.status = 'pending'
          AND m.user_id IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM notifications n
            WHERE n.reference_type = 'payroll_advance_pending'
              AND n.reference_id = pa.id
              AND n.created_at > NOW() - INTERVAL '24 hours'
          )
        ORDER BY pa.request_date ASC
        LIMIT 100
      `)

      if (r.rows.length === 0) {
        this.logger.log('AdvanceReminder: tasdiqlanmagan avans so\'rovi topilmadi')
        return
      }

      let sent = 0
      for (const a of r.rows) {
        const escalated = a.days_pending >= escalationDays
        const result = await this.commandBus.execute(
          new CreateNotificationCommand(
            String(a.manager_user_id),
            escalated ? "Avans so'rovi UZOQ VAQT tasdiqlanmagan" : "Avans so'rovi tasdiq kutmoqda",
            `${a.full_name ?? `Xodim #${a.employee_id}`}: ${Number(a.amount).toLocaleString('uz')} UZS, ` +
              `so'ralgan sana ${a.request_date}, ${a.days_pending} kundan beri kutmoqda.`,
            'finance_advance_pending',
            String(a.id),
            'payroll_advance_pending',
          ),
        ).catch((err: unknown) => {
          this.logger.warn(`Avans #${a.id} bildirishnomasi yuborilmadi: ${String(err)}`)
          return null
        })
        if (result) sent++
      }

      this.logger.warn(`AdvanceReminder: ${r.rows.length} ta avans kutmoqda, ${sent} ta bildirishnoma yuborildi`)
    } catch (err) {
      this.logger.error(`AdvanceReminder cron xatosi: ${String(err)}`)
    }
  }
}
