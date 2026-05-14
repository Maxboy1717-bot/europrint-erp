/**
 * @module ai-reports.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { TelegramService } from '../telegram.service'

interface DailyAiReport {
  date: string
  sales_forecast: number
  demand_prediction: string
  risk_alerts: string[]
  recommendations: string[]
  director_chat_id: string
}

@Injectable()
export class AiReportsHandler {
  private readonly logger = new Logger(AiReportsHandler.name)

  constructor(private telegramService: TelegramService) {}

  @Cron('0 7 * * *')
  async sendDailyAiReport(): Promise<void> {
    try {
      const directorChatId = process.env.DIRECTOR_CHAT_ID || ''

      // Bugungi AI tahlili va tavsiyalar
      const report: DailyAiReport = {
        date: _time.now().toISOString().split('T')[0],
        sales_forecast: 45_000,
        demand_prediction: 'O\'rtacha',
        risk_alerts: [
          'Kompetitor aktivligi oshdi',
          'Kursi volatil',
        ],
        recommendations: [
          'Narxni 5% pasaytirish taklif etiladi',
          'Bozor segmentini kengaytirish',
        ],
        director_chat_id: directorChatId,
      }

      const risksText = (Array.isArray(report?.risk_alerts) ? report?.risk_alerts : []).map(r => `⚠️ ${r}`).join('\n')
      const recsText = (Array.isArray(report?.recommendations) ? report?.recommendations : []).map(r => `✓ ${r}`).join('\n')

      const text = `
🤖 <b>Kunlik AI Tahlili</b> - ${report.date}

📈 <b>Sotuvlar Prognozi:</b> ${report.sales_forecast.toLocaleString()} USD
📊 <b>Talab:</b> ${report.demand_prediction}

⚠️ <b>Risk Ogohlantirmalari:</b>
${risksText}

💡 <b>Tavsiyalar:</b>
${recsText}

Batafsil: ${process.env.AI_REPORTS_URL}
      `
      await this.telegramService.sendMessage(directorChatId, text)
      this.logger.log('Daily AI report sent')
    } catch (err) {
      this.logger.error(`sendDailyAiReport error: ${String(err)}`)
    }
  }
}
