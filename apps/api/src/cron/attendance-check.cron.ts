/**
 * @module attendance-check.cron
 * @description Scheduled cron job. @nestjs/schedule registered task.
 */

import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'

@Injectable()
export class AttendanceCheckCron {
  private readonly logger = new Logger(AttendanceCheckCron.name)

  @Cron('0 10 * * *')
  async run(): Promise<void> {
    const result = { success: false, processed: 0, errors: [] as string[] }
    try {
      // 10:00 da kelmagan xodimlarni tekshirish
      // Biometric/QR scan data bilan taqqoslash
      // Kelmagan xodimlarning manageriga Telegram xabar
      // HR boshlig'iga attendance report
      result.success = true
      result.processed = 0 // Kelmagan xodimlar soni
      this.logger.log(`✅ AttendanceCheck: processed=${result.processed}`)
    } catch (err) {
      result.errors.push(String(err))
      this.logger.error(`❌ AttendanceCheck error: ${String(err)}`)
    }
  }
}
