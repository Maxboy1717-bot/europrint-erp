/**
 * @module ai-reports.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { I18nService } from 'nestjs-i18n'
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

  constructor(
    private telegramService: TelegramService,
    private readonly i18n: I18nService,
  ) {}

  @Cron('0 7 * * *')
  async sendDailyAiReport(): Promise<void> {
    try {
      const directorChatId = process.env.DIRECTOR_CHAT_ID || ''

      // Bugungi AI tahlili va tavsiyalar
      // TODO F2: replace mock risk_alerts / recommendations with i18n-localized DB data once AI report source is wired
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

      const text = await this.i18n.t('telegram.aiReports.dailyAiReport', {
        args: {
          date: report.date,
          salesForecast: report.sales_forecast.toLocaleString(),
          demandPrediction: report.demand_prediction,
          risksText,
          recsText,
          reportsUrl: process.env.AI_REPORTS_URL ?? '',
        },
      })
      await this.telegramService.sendMessage(directorChatId, text)
      this.logger.log('Daily AI report sent')
    } catch (err) {
      this.logger.error(`sendDailyAiReport error: ${String(err)}`)
    }
  }
}
