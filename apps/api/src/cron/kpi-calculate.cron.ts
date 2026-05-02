import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'

@Injectable()
export class KpiCalculateCron {
  private readonly logger = new Logger(KpiCalculateCron.name)

  @Cron('30 23 * * *')
  async run(): Promise<void> {
    const result = { success: false, processed: 0, errors: [] as string[] }
    try {
      // 23:30 da (kunning oxirida) barcha xodimlarning KPI hisoblash
      // Sales: deal count, revenue_usd, win_rate, cycle_time
      // Support: ticket resolution time, satisfaction_rate, ticket_count
      // Production: units_produced, defect_rate, efficiency, quality_score
      // HR: attendance_rate, training_hours, performance_review
      // KPI table daily snapshot → history for trend analysis
      result.success = true
      result.processed = 0 // Hisoblangan xodimlar soni
      this.logger.log(`✅ KpiCalculate: processed=${result.processed}`)
    } catch (err) {
      result.errors.push(String(err))
      this.logger.error(`❌ KpiCalculate error: ${String(err)}`)
    }
  }
}
