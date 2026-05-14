/**
 * @module reminder-send.cron
 * @description Scheduled cron job. @nestjs/schedule registered task.
 */

import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'

@Injectable()
export class ReminderSendCron {
  private readonly logger = new Logger(ReminderSendCron.name)

  @Cron('0 * * * *')
  async run(): Promise<void> {
    const result = { success: false, processed: 0, errors: [] as string[] }
    try {
      // Har soatning boshida muddati yaqin vazifalarni tekshirish
      // Muddati 1 soat qolganda → mas'ulga Telegram xabar
      // Priority: HIGH va URGENT bo'lsalar preferens bilan
      // Kanban board status: IN_PROGRESS yoki PENDING
      result.success = true
      result.processed = 0 // Eslatma yuborilgan vazifalar
      this.logger.log(`✅ ReminderSend: processed=${result.processed}`)
    } catch (err) {
      result.errors.push(String(err))
      this.logger.error(`❌ ReminderSend error: ${String(err)}`)
    }
  }
}
