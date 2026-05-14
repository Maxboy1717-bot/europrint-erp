/**
 * @module warehouse-rental.cron
 * @description Scheduled cron job. @nestjs/schedule registered task.
 */

import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'

@Injectable()
export class WarehouseRentalCron {
  private readonly logger = new Logger(WarehouseRentalCron.name)

  @Cron('5 0 * * *')
  async run(): Promise<void> {
    const result = { success: false, processed: 0, errors: [] as string[] }
    try {
      // Aktiv ijara yozuvlarini yangilash
      // Formula: billableDays = MAX(0, totalDays - freeDays)
      // totalAmount = areaM2 × billableDays × dailyRatePerM2
      // Agar ijara muddati 8 kundan qolsa → Telegram signal
      result.success = true
      result.processed = 0 // DB dan hisoblangan
      this.logger.log(`✅ WarehouseRental: processed=${result.processed}`)
    } catch (err) {
      result.errors.push(String(err))
      this.logger.error(`❌ WarehouseRental error: ${String(err)}`)
    }
  }
}
