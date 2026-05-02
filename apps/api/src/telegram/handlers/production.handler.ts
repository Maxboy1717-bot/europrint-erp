import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { TelegramService } from '../telegram.service'

interface ShiftHandover {
  shift_number: number
  shift_lead_chat_id: string
  units_produced: number
  quality_issues: number
}

interface MesAlert {
  error_code: string
  equipment_name: string
  technician_chat_id: string
  downtime_minutes: number
}

interface QcResult {
  batch_id: string
  total_units: number
  defective_units: number
  pass_rate: number
  production_lead_chat_id: string
}

@Injectable()
export class ProductionHandler {
  private readonly logger = new Logger(ProductionHandler.name)

  constructor(private telegramService: TelegramService) {}

  @Cron('0 14 * * *')
  async sendMorningShiftHandover(): Promise<void> {
    try {
      const shiftLeadId = process.env.SHIFT_LEAD_CHAT_ID || ''
      const text = `
📋 <b>Smena Topshirish Eslatmasi</b> - 14:00

Shift'ni qayd qiling:
✓ Ishlab chiqarilgan smartfonlar soni
✓ Xato va nosozliklari
✓ Zaxira material'lar holati
✓ Ishchi-xavfsizlik hodisalari

Keyingi shift boshligiga batafsil o'tqazib chiqing!
      `
      await this.telegramService.sendMessage(shiftLeadId, text)
      this.logger.log('Morning shift handover reminder sent')
    } catch (err) {
      this.logger.error(`sendMorningShiftHandover error: ${String(err)}`)
    }
  }

  @Cron('0 22 * * *')
  async sendEveningShiftHandover(): Promise<void> {
    try {
      const shiftLeadId = process.env.SHIFT_LEAD_CHAT_ID || ''
      const text = `
📋 <b>Smena Topshirish Eslatmasi</b> - 22:00

Tungi shift'ni qayd qiling:
✓ Kunning jami ishlab chiqarish
✓ Sifat tekshiruv natijalari
✓ Avariyligi hodisalari
✓ Maslahatlari va takliflar

Keyingi kun uchun tayyorlanishni boshlang!
      `
      await this.telegramService.sendMessage(shiftLeadId, text)
      this.logger.log('Evening shift handover reminder sent')
    } catch (err) {
      this.logger.error(`sendEveningShiftHandover error: ${String(err)}`)
    }
  }

  async onMesEquipmentFailure(alert: MesAlert): Promise<void> {
    try {
      const text = `
🚨 <b>MES Avariyligi!</b>

⚙️ <b>Qurilma:</b> ${alert.equipment_name}
🔴 <b>Xato Kodi:</b> ${alert.error_code}
⏱️ <b>To'xtash Vaqti:</b> ${alert.downtime_minutes} minut

Tezda ta'mir qiling!
      `
      await this.telegramService.sendMessage(alert.technician_chat_id, text)
      this.logger.log(`MES failure alert sent: ${alert.equipment_name}`)
    } catch (err) {
      this.logger.error(`onMesEquipmentFailure error: ${String(err)}`)
    }
  }

  async onQcResultsReady(result: QcResult): Promise<void> {
    try {
      const text = `
✅ <b>QC Natija Tayyor</b>

📦 <b>Batch ID:</b> ${result.batch_id}
📊 <b>Jami:</b> ${result.total_units} ta
❌ <b>Xatoli:</b> ${result.defective_units} ta
✔️ <b>O'tgan %:</b> ${result.pass_rate}%

Batafsil QC hisobotini portal'da tekshiring.
      `
      await this.telegramService.sendMessage(result.production_lead_chat_id, text)
      this.logger.log(`QC results notified: ${result.batch_id}`)
    } catch (err) {
      this.logger.error(`onQcResultsReady error: ${String(err)}`)
    }
  }
}
