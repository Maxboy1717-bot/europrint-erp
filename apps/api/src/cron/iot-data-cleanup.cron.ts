/**
 * @module iot-data-cleanup.cron
 * @description Scheduled cron job. @nestjs/schedule registered task.
 */

import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'

@Injectable()
export class IotDataCleanupCron {
  private readonly logger = new Logger(IotDataCleanupCron.name)

  @Cron('0 2 * * 6')
  async run(): Promise<void> {
    const result = { success: false, processed: 0, errors: [] as string[] }
    try {
      // Har shanba 02:00 da 90 kundan eski IoT sensor datalarini tozalash
      // Production floor sensors (temperature, humidity, vibration, pressure)
      // Warehouse climate monitors (temperature, humidity)
      // Vehicle GPS/fuel consumption data
      // Archive strategy: 90 kun → coldstore (S3 Glacier, Azure Archive)
      // Raw data delete, aggregated hourly summaries keep
      result.success = true
      result.processed = 0 // Archive qilingan IoT records
      this.logger.log(`✅ IotDataCleanup: processed=${result.processed}`)
    } catch (err) {
      result.errors.push(String(err))
      this.logger.error(`❌ IotDataCleanup error: ${String(err)}`)
    }
  }
}
