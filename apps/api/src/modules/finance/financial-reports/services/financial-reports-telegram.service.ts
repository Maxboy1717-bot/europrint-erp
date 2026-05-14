/**
 * @module financial-reports-telegram.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Telegraf } from 'telegraf';

export type TelegramChannel = 'kunlik' | 'haftalik' | 'oylik' | 'muammo' | 'vazifa' | 'qollanma';

@Injectable()
export class FinancialReportsTelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FinancialReportsTelegramService.name);
  private bot: Telegraf | null = null;

  private readonly channels: Record<TelegramChannel, string | undefined>;

  constructor(private readonly configService: ConfigService) {
    this.channels = {
      kunlik:   this.configService.get<string>('TELEGRAM_KUNLIK_CHAT_ID'),
      haftalik: this.configService.get<string>('TELEGRAM_HAFTALIK_CHAT_ID'),
      oylik:    this.configService.get<string>('TELEGRAM_OYLIK_CHAT_ID'),
      muammo:   this.configService.get<string>('TELEGRAM_MUAMMO_CHAT_ID'),
      vazifa:   this.configService.get<string>('TELEGRAM_VAZIFA_CHAT_ID'),
      qollanma: this.configService.get<string>('TELEGRAM_QOLLANMA_CHAT_ID'),
    };
  }

  async onModuleInit(): Promise<void> {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not set — financial reports Telegram notifications disabled');
      return;
    }
    try {
      const { Telegraf: TelegrafClass } = await import('telegraf');
      this.bot = new TelegrafClass(token);
      this.logger.log('FinancialReports Telegram bot initialised');
    } catch (err) {
      this.logger.error(`Failed to init Telegram bot: ${String(err)}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    // bot was never launch()ed (send-only via bot.telegram) — just release the reference
    this.bot = null;
  }

  async sendReport(channel: TelegramChannel, html: string): Promise<void> {
    const chatId = this.channels[channel];
    if (!chatId) {
      this.logger.warn(`Channel ${channel} CHAT_ID not configured — skipping send`);
      return;
    }
    if (!this.bot) {
      this.logger.warn('Telegram bot not initialised — skipping send');
      return;
    }
    try {
      await this.bot.telegram.sendMessage(chatId, html, { parse_mode: 'HTML' });
    } catch (err) {
      this.logger.error(`Failed to send Telegram message to ${channel}: ${String(err)}`);
    }
  }

  async sendToAll(channels: TelegramChannel[], html: string): Promise<void> {
    await Promise.allSettled(channels.map((ch) => this.sendReport(ch, html)));
  }
}
