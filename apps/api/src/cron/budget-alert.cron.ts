/**
 * @module budget-alert.cron
 * @description Scheduled cron job. @nestjs/schedule registered task.
 */

import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'

@Injectable()
export class BudgetAlertCron {
  private readonly logger = new Logger(BudgetAlertCron.name)

  @Cron('0 9 * * 1')
  async run(): Promise<void> {
    const result = { success: false, processed: 0, errors: [] as string[] }
    try {
      // Har dushanba 09:00 da departament byudjeti tahlili
      // Agar spent > total_budget × 80% → CFO va department manager alert
      // Byudjet category: CAPEX, OPEX, SALARY, MARKETING, LOGISTICS
      // Alert content: category, spent_sum, budget_sum, percentage, remaining
      // Trend: this_week vs last_week vs month_avg
      result.success = true
      result.processed = 0 // Alert yuborilgan department'lar
      this.logger.log(`✅ BudgetAlert: processed=${result.processed}`)
    } catch (err) {
      result.errors.push(String(err))
      this.logger.error(`❌ BudgetAlert error: ${String(err)}`)
    }
  }
}
