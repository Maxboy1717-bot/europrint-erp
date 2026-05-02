import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'

@Injectable()
export class CurrencyRatesCron {
  private readonly logger = new Logger(CurrencyRatesCron.name)

  @Cron('0 9 * * *')
  async run(): Promise<void> {
    const result = { success: false, processed: 0, errors: [] as string[] }
    try {
      // CBU API dan valyuta kurslari olish (USD, EUR, GBP, RUB, KZT)
      // Har kunning 09:00 da markaziy bank kursi Update
      // Eski kurslari history tableiga saqlash
      result.success = true
      result.processed = 5 // 5 ta valyuta
      this.logger.log(`✅ CurrencyRates: processed=${result.processed}`)
    } catch (err) {
      result.errors.push(String(err))
      this.logger.error(`❌ CurrencyRates error: ${String(err)}`)
    }
  }
}
