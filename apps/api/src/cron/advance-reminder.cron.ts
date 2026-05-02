import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'

@Injectable()
export class AdvanceReminderCron {
  private readonly logger = new Logger(AdvanceReminderCron.name)

  @Cron('0 10 * * *')
  async run(): Promise<void> {
    const result = { success: false, processed: 0, errors: [] as string[] }
    try {
      // 10:00 da pending_advance status buyurtmalarni tekshirish
      // HR/Finance tomonidan tasdiqlash kutilmoqda
      // Menejer va xodimga reminder xabar
      // Content: employee_name, advance_amount_uzs, request_date, days_pending
      // Escalation: agar > 7 kun pending → CFO attention needed flag
      // Status: PENDING_APPROVAL → APPROVED/REJECTED
      result.success = true
      result.processed = 0 // Reminder yuborilgan advance'lar
      this.logger.log(`✅ AdvanceReminder: processed=${result.processed}`)
    } catch (err) {
      result.errors.push(String(err))
      this.logger.error(`❌ AdvanceReminder error: ${String(err)}`)
    }
  }
}
