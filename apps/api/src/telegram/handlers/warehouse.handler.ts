/**
 * @module warehouse.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { I18nService } from 'nestjs-i18n'
import { TelegramService } from '../telegram.service'

interface StockAlert {
  material_code: string
  material_name: string
  current_qty: number
  minimum_qty: number
  warehouse_manager_chat_id: string
}

interface RentalExpiry {
  area_m2: number
  daily_rate: number
  manager_chat_id: string
  days_remaining: number
}

@Injectable()
export class WarehouseHandler {
  private readonly logger = new Logger(WarehouseHandler.name)

  constructor(
    private telegramService: TelegramService,
    private readonly i18n: I18nService,
  ) {}

  @Cron('0 8 * * *')
  async sendMinimumStockAlert(): Promise<void> {
    try {
      const warehouseManagerId = process.env.WAREHOUSE_MANAGER_CHAT_ID || ''
      // DB dan minimal zaxira olamiz
      const alerts: StockAlert[] = []

      for (const alert of alerts) {
        const text = await this.i18n.t('telegram.warehouse.minimumStockAlert', {
          args: {
            materialName: alert.material_name,
            materialCode: alert.material_code,
            currentQty: alert.current_qty,
            minimumQty: alert.minimum_qty,
          },
        })
        await this.telegramService.sendMessage(
          alert.warehouse_manager_chat_id,
          text,
        )
      }
      this.logger.log(`Minimum stock alerts sent: ${alerts.length}`)
    } catch (err) {
      this.logger.error(`sendMinimumStockAlert error: ${String(err)}`)
    }
  }

  @Cron('0 14 * * *')
  async sendAfternoonStockCheck(): Promise<void> {
    try {
      const warehouseManagerId = process.env.WAREHOUSE_MANAGER_CHAT_ID || ''
      const text = await this.i18n.t('telegram.warehouse.afternoonStockCheck', {
        args: { portalUrl: process.env.WAREHOUSE_PORTAL_URL ?? '' },
      })
      await this.telegramService.sendMessage(warehouseManagerId, text)
      this.logger.log('Afternoon stock check sent')
    } catch (err) {
      this.logger.error(`sendAfternoonStockCheck error: ${String(err)}`)
    }
  }

  async onRentalExpiryReminder(rental: RentalExpiry): Promise<void> {
    try {
      const text = await this.i18n.t('telegram.warehouse.rentalExpiryReminder', {
        args: {
          areaM2: rental.area_m2,
          dailyRate: rental.daily_rate,
          daysRemaining: rental.days_remaining,
        },
      })
      await this.telegramService.sendMessage(rental.manager_chat_id, text)
      this.logger.log('Rental expiry reminder sent')
    } catch (err) {
      this.logger.error(`onRentalExpiryReminder error: ${String(err)}`)
    }
  }
}
