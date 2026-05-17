/**
 * @module telegram.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Ok, Err, safeCall, Result, AppError } from '@common/result';
import { Injectable, Logger } from '@nestjs/common'
import { I18nService } from 'nestjs-i18n'
import TelegramBot from 'node-telegram-bot-api'

interface DirectorReport {
  date: string
  salesAmount: number
  dealsCount: number
  newLeads: number
  productionUnits: number
  qualityScore: number
  attendanceRate: string
}

@Injectable()
export class TelegramService {
  private bot: TelegramBot
  private readonly logger = new Logger(TelegramService.name)

  constructor(private readonly i18n: I18nService) {
    const token = process.env.TELEGRAM_BOT_TOKEN || ''
    this.bot = new TelegramBot(token, { polling: false })
  }

  async sendMessage(
    chatId: string | number,
    text: string,
  ): Promise<Result<TelegramBot.Message, AppError>> {
    return safeCall(async () => this.bot.sendMessage(chatId, text, { parse_mode: 'HTML' }));
  }

  async sendAlert(
    chatId: string | number,
    title: string,
    body: string,
  ): Promise<Result<TelegramBot.Message, AppError>> {
    const text = `⚠️ <b>${title}</b>\n\n${body}`
    return this.sendMessage(chatId, text)
  }

  async sendDirectorDailyReport(
    directorChatId: string | number,
    report: DirectorReport,
  ): Promise<Result<TelegramBot.Message, AppError>> {
    const text = await this.i18n.t('telegram.service.directorDailyReport', {
      args: {
        date: report.date,
        salesAmount: report.salesAmount.toLocaleString(),
        dealsCount: report.dealsCount,
        newLeads: report.newLeads,
        productionUnits: report.productionUnits,
        qualityScore: report.qualityScore,
        attendanceRate: report.attendanceRate,
        dashboardUrl: process.env.DASHBOARD_URL || 'dashboard.url',
      },
    })
    return this.sendMessage(directorChatId, text)
  }
}
