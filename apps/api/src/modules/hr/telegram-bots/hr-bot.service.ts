/**
 * @module hr-bot.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 *
 * Rule 16: Command handlers live in hr-bot-commands.helpers.ts; this file is a thin facade.
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { safeCall } from '@common/result';
import { errMsg } from '../hr-v2-error';
import { TelegramBotsRepository } from './telegram-bots.repository';
import type { Telegraf, Context } from 'telegraf';
import { HrSession } from './hr-bot-helpers';
import {
  registerBasicCommands, registerProfileCommands, registerSickFlowHandlers,
} from './hr-bot-commands.helpers';

@Injectable()
export class HrBotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(HrBotService.name);
  private bot: Telegraf<Context> | null = null;
  private readonly token: string | undefined;
  private sessions = new Map<number, HrSession>();

  constructor(
    private readonly telegramRepo: TelegramBotsRepository,
    private readonly cfg: ConfigService,
  ) {
    this.token = this.cfg.get<string>('TELEGRAM_HR_BOT_TOKEN');
  }

  onModuleInit(): void {
    this._initBackground().catch((e) => this.logger.warn('[hr-bot.service] init failed: ' + e));
  }

  private async _initBackground(): Promise<void> {
    await safeCall(async () => {
      if (!this.token) {
        this.logger.warn('HR Bot token not configured (TELEGRAM_HR_BOT_TOKEN missing) — skipping');
        return;
      }
      try {
        const { Telegraf: TelegrafClass } = await import('telegraf');
        this.bot = new TelegrafClass(this.token) as Telegraf<Context>;
        this.registerCommands(this.bot);
        this.bot.launch().catch((err: Error) => this.logger.error(`HR Bot launch error: ${errMsg(err)}`));
        this.logger.log('HR Bot started');
      } catch (err) {
        this.logger.error(`Failed to initialize HR Bot: ${err instanceof Error ? errMsg(err) : String(err)}`);
      }
    });
  }

  async onModuleDestroy() {
    this.bot?.stop('HR Bot stopped');
  }

  private registerCommands(bot: Telegraf<Context>) {
    registerBasicCommands(bot, this.sessions);
    registerProfileCommands(bot, this.telegramRepo);
    registerSickFlowHandlers(bot, this.sessions);
  }

  async sendMessage(chatId: number | string, message: string): Promise<boolean> {
    if (!this.bot) return false;
    try {
      await this.bot.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' });
      return true;
    } catch (err) {
      this.logger.error(`sendMessage error: ${err instanceof Error ? errMsg(err) : String(err)}`);
      return false;
    }
  }

  getInstance(): Telegraf<Context> | null {
    return this.bot;
  }
}
