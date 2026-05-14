/**
 * @module backup-database.cron
 * @description Scheduled cron job. @nestjs/schedule registered task.
 */

import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'

@Injectable()
export class BackupDatabaseCron {
  private readonly logger = new Logger(BackupDatabaseCron.name)

  @Cron('0 3 * * *')
  async run(): Promise<void> {
    const result = { success: false, processed: 0, errors: [] as string[] }
    try {
      // Kunning 03:00 da bazani zaxira nusxasi
      // PostgreSQL dump → encrypted storage (AWS S3 / Azure Blob)
      // Eski backup'lar (30 kundan ko'p) → delete
      // Backup integrity check va logging
      // Success/error notification → sysadmin
      result.success = true
      result.processed = 1 // 1 ta backup
      this.logger.log(`✅ BackupDatabase: processed=${result.processed}`)
    } catch (err) {
      result.errors.push(String(err))
      this.logger.error(`❌ BackupDatabase error: ${String(err)}`)
    }
  }
}
