/**
 * @module overdue-po.cron
 * @description Scheduled cron job. @nestjs/schedule registered task.
 */

import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'

@Injectable()
export class OverduePoCron {
  private readonly logger = new Logger(OverduePoCron.name)

  @Cron('0 9 * * *')
  async run(): Promise<void> {
    const result = { success: false, processed: 0, errors: [] as string[] }
    try {
      // 09:00 da kechikkan xarid buyurtmalarini tekshirish
      // Status: PO_CREATED va qolgan kun < 3 → eslatma
      // Supplier emas, internal manager/buyer ga xabar
      // Telegram: supplier nomi, po_number, dueDate, days_remaining
      // Escalation: dueDate o'tgan → urgent flag
      result.success = true
      result.processed = 0 // Eslatma yuborilgan PO'lar
      this.logger.log(`✅ OverduePo: processed=${result.processed}`)
    } catch (err) {
      result.errors.push(String(err))
      this.logger.error(`❌ OverduePo error: ${String(err)}`)
    }
  }
}
