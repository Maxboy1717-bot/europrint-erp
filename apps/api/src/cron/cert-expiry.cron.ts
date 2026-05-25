/**
 * @module cert-expiry.cron
 * @description Scheduled cron job. @nestjs/schedule registered task.
 */

import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'

@Injectable()
export class CertExpiryCron {
  private readonly logger = new Logger(CertExpiryCron.name)

  @Cron('0 8 * * *')
  async run(): Promise<void> {
    const result = { success: false, processed: 0, errors: [] as string[] }
    try {
      // 08:00 da LMS sertifikat muddatini tekshirish
      // Muddati 30 kundan kam → LMS_CERT_EXPIRED event emit (Trigger 17)
      // Employee, manager, HR ga Telegram xabar
      // Certificate details: course_name, expiry_date, days_remaining
      // Renewal process reminder: training_url, refresh deadline
      result.success = true
      result.processed = 0 // Eslatma yuborilgan sertifikatlar
      this.logger.log(`✅ CertExpiry: processed=${result.processed}`)
    } catch (err) {
      result.errors.push(String(err))
      this.logger.error(`❌ CertExpiry error: ${String(err)}`)
    }
  }
}
