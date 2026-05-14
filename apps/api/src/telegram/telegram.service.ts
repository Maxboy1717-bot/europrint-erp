/**
 * @module telegram.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Ok, Err, safeCall, Result, AppError } from '@common/result';
import { Injectable, Logger } from '@nestjs/common'
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

  constructor() {
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
    const text = `
📊 <b>Kunlik Direktor Hisoboti</b> - ${report.date}

💰 <b>Sotuvlar:</b> ${report.salesAmount.toLocaleString()} USD
🎯 <b>Deal'lar:</b> ${report.dealsCount} ta
👥 <b>Yangi Lid'lar:</b> ${report.newLeads} ta

🏭 <b>Ishlab Chiqarish:</b> ${report.productionUnits} ta smartfon
⭐ <b>Sifat Natijasi:</b> ${report.qualityScore}%
👤 <b>Davomat:</b> ${report.attendanceRate}

Batafsil: ${process.env.DASHBOARD_URL || 'dashboard.url'}
    `
    return this.sendMessage(directorChatId, text)
  }
}
