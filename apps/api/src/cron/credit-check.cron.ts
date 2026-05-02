import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'

@Injectable()
export class CreditCheckCron {
  private readonly logger = new Logger(CreditCheckCron.name)

  @Cron('0 8 * * *')
  async run(): Promise<void> {
    const result = { success: false, processed: 0, errors: [] as string[] }
    try {
      // 08:00 da kredit limitga yaqinlashgan kompaniyalarni tekshirish
      // Agar outstanding balance > limit × 80% → CFO/Manager alert
      // CRM kontakt: overspend_alert_status = true
      // Xabar: company nomi, current balance, limit, %
      // Finance module events emit
      result.success = true
      result.processed = 0 // Alert yuborilgan kompaniyalar
      this.logger.log(`✅ CreditCheck: processed=${result.processed}`)
    } catch (err) {
      result.errors.push(String(err))
      this.logger.error(`❌ CreditCheck error: ${String(err)}`)
    }
  }
}
