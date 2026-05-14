/**
 * @module warehouse.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
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

  constructor(private telegramService: TelegramService) {}

  @Cron('0 8 * * *')
  async sendMinimumStockAlert(): Promise<void> {
    try {
      const warehouseManagerId = process.env.WAREHOUSE_MANAGER_CHAT_ID || ''
      // DB dan minimal zaxira olamiz
      const alerts: StockAlert[] = []

      for (const alert of alerts) {
        const text = `
⚠️ <b>Minimal Zaxira Ogohlantirmasi</b>

📦 <b>Material:</b> ${alert.material_name}
🔖 <b>Kod:</b> ${alert.material_code}
📊 <b>Hozirgi:</b> ${alert.current_qty} ta
📉 <b>Minimal:</b> ${alert.minimum_qty} ta

Tezda buyurtma qiling!
        `
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
      const text = `
📋 <b>Kechki Zaxira Tekshiruvi</b>

Kunning oxiridagi zaxira holatini tekshiring:
- Kelgan material'lar
- Chiqarilgan material'lar
- Fizik inventori qidiruvi (agar zarur)

Portal: ${process.env.WAREHOUSE_PORTAL_URL}
      `
      await this.telegramService.sendMessage(warehouseManagerId, text)
      this.logger.log('Afternoon stock check sent')
    } catch (err) {
      this.logger.error(`sendAfternoonStockCheck error: ${String(err)}`)
    }
  }

  async onRentalExpiryReminder(rental: RentalExpiry): Promise<void> {
    try {
      const text = `
⏰ <b>Ijara Muddati Tugaymoqda!</b>

📏 <b>Maydoni:</b> ${rental.area_m2} m²
💵 <b>Kunlik Tarif:</b> ${rental.daily_rate} USD/m²
⏳ <b>Qolgan Kun:</b> ${rental.days_remaining} kun

Yangilash yoki bekor qilish bo'yicha qaror qabul qiling!
      `
      await this.telegramService.sendMessage(rental.manager_chat_id, text)
      this.logger.log('Rental expiry reminder sent')
    } catch (err) {
      this.logger.error(`onRentalExpiryReminder error: ${String(err)}`)
    }
  }
}
