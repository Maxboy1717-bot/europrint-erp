/**
 * @module stock-alert.cron
 * @description Scheduled cron job. @nestjs/schedule registered task.
 */

import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'

@Injectable()
export class StockAlertCron {
  private readonly logger = new Logger(StockAlertCron.name)

  @Cron('0 8 * * *')
  async run(): Promise<void> {
    const result = { success: false, processed: 0, errors: [] as string[] }
    try {
      // 08:00 da minimal zaxira (minimum_stock) tekshirish
      // Ombor boshlig'iga yetishmayotgan itemlarni xabar
      // Content: material_code, current_qty, minimum_qty, warehouse_location
      // Suggestion: reorder_qty, supplier_contact, lead_time
      // Priority HIGH agar used_by_production > 50 items/day
      result.success = true
      result.processed = 0 // Alert yuborilgan materiallar
      this.logger.log(`✅ StockAlert: processed=${result.processed}`)
    } catch (err) {
      result.errors.push(String(err))
      this.logger.error(`❌ StockAlert error: ${String(err)}`)
    }
  }
}
