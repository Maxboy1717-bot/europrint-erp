/**
 * @module budget-alert.cron
 * @description Byudjet chegaradan oshganda budjet egasiga ogohlantirish.
 *
 * AUDIT 2026-08-07 — nima uchun qayta yozildi
 *   Bu fayl `processed = 0` qattiq yozib, hech qanday DB so'rovisiz har dushanba "✅
 *   muvaffaqiyatli" deb log yozardi. Eski izohdagi "Trend: this_week vs last_week vs month_avg"
 *   qismi BUNI QURMAYDI — vaqt-qatorlari uchun mos manba (haftalik snapshot) sxemada yo'q,
 *   uni o'ylab topish fabrikatsiya bo'lardi (Q-40). Asosiy qism — "spent > budget × chegara" —
 *   mavjud ustunlardan to'g'ridan-to'g'ri hisoblanadi.
 *
 * QARORLAR
 *   - Kanonik jadval — `budgets` (`budget_controls` — nomiga qaramay orfan, hech qanday writer
 *     yo'q; `drizzle-finance-budgets.repo.ts` `budgets`+`budget_lines` ga yozadi).
 *   - `spent_amount / budget_amount` to'g'ridan-to'g'ri hisoblanadi — `budget_lines.variance_percent`
 *     ishlatilmadi, chunki u generated column emas (yozilgandan keyin eskirishi mumkin).
 *   - Status lug'ati — `draft` / `approved` / `deleted` (soft-delete `status='deleted'` orqali,
 *     jadvalda `deleted_at` yo'q). Faqat `approved` byudjetlar tekshiriladi.
 *   - Chegara foizi — `business_settings.finance.budget_alert_warn_pct` (default 80%).
 *   - Eslatma manzili — `budgets.created_by` (byudjetni yaratgan/egallagan xodim).
 */

import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { CommandBus } from '@nestjs/cqrs'
import { sql } from 'drizzle-orm'
import { runQuery } from '@shared/db'
import { CreateNotificationCommand } from '../modules/notifications/application/commands/create-notification.command'
import { getBusinessSettingNumber } from '../shared/config/business-settings.reader'

/** `business_settings.finance.budget_alert_warn_pct` — fallback qiymat (0.8 = 80%). */
const BUDGET_WARN_PCT_FALLBACK = 0.8

interface BudgetRiskRow {
  id: number
  budget_name: string | null
  name: string | null
  department: string | null
  created_by: number | null
  budget_amount: string
  spent_amount: string
}

@Injectable()
export class BudgetAlertCron {
  private readonly logger = new Logger(BudgetAlertCron.name)

  constructor(private readonly commandBus: CommandBus) {}

  /** Har dushanba 09:00 — tasdiqlangan byudjetlarda sarf-chegara tekshiruvi. */
  @Cron('0 9 * * 1')
  async run(): Promise<void> {
    try {
      const warnPct = await getBusinessSettingNumber('finance.budget_alert_warn_pct', BUDGET_WARN_PCT_FALLBACK)

      const r = await runQuery<BudgetRiskRow>(sql`
        SELECT id, budget_name, name, department, created_by,
               COALESCE(budget_amount, 0)::text AS budget_amount,
               COALESCE(spent_amount, 0)::text AS spent_amount
        FROM budgets
        WHERE status = 'approved'
          AND created_by IS NOT NULL
          AND COALESCE(budget_amount, 0) > 0
          AND COALESCE(spent_amount, 0) >= COALESCE(budget_amount, 0) * ${warnPct}
          AND NOT EXISTS (
            SELECT 1 FROM notifications n
            WHERE n.reference_type = 'budget_overspend_risk'
              AND n.reference_id = budgets.id
              AND n.created_at > NOW() - INTERVAL '7 days'
          )
      `)

      if (r.rows.length === 0) {
        this.logger.log('BudgetAlert: chegaraga yaqinlashgan byudjet topilmadi')
        return
      }

      let sent = 0
      for (const b of r.rows) {
        const budgetAmount = Number(b.budget_amount)
        const spentAmount = Number(b.spent_amount)
        const pct = budgetAmount > 0 ? Math.round((spentAmount / budgetAmount) * 100) : 0
        const label = b.budget_name ?? b.name ?? `Byudjet #${b.id}`
        const result = await this.commandBus.execute(
          new CreateNotificationCommand(
            String(b.created_by),
            'Byudjet chegaraga yaqinlashmoqda',
            `${label}${b.department ? ` (${b.department})` : ''}: sarflangan ${spentAmount.toLocaleString('uz')} / ${budgetAmount.toLocaleString('uz')} (${pct}%)`,
            'finance_budget_risk',
            String(b.id),
            'budget_overspend_risk',
          ),
        ).catch((err: unknown) => {
          this.logger.warn(`Byudjet #${b.id} bildirishnomasi yuborilmadi: ${String(err)}`)
          return null
        })
        if (result) sent++
      }

      this.logger.warn(`BudgetAlert: ${r.rows.length} ta byudjet chegaraga yaqin, ${sent} ta bildirishnoma yuborildi`)
    } catch (err) {
      this.logger.error(`BudgetAlert cron xatosi: ${String(err)}`)
    }
  }
}
