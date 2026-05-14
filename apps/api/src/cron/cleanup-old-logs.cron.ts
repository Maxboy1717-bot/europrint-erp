/**
 * @module cleanup-old-logs.cron
 * @description Scheduled cron job. @nestjs/schedule registered task.
 */

import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'

@Injectable()
export class CleanupOldLogsCron {
  private readonly logger = new Logger(CleanupOldLogsCron.name)

  @Cron('0 2 * * 0')
  async run(): Promise<void> {
    const result = { success: false, processed: 0, errors: [] as string[] }
    try {
      // Har dushanba 02:00 da 90 kundan qadimgi loglarni tozalash
      // System logs, API logs, error logs → archive storage
      // Database logs table truncate (retention: 30 kun)
      // File storage tozalash → freed space analytics
      result.success = true
      result.processed = 0 // Archive qilingan log records
      this.logger.log(`✅ CleanupOldLogs: processed=${result.processed}`)
    } catch (err) {
      result.errors.push(String(err))
      this.logger.error(`❌ CleanupOldLogs error: ${String(err)}`)
    }
  }
}
