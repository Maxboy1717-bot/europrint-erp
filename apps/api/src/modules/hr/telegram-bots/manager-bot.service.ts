/**
 * @module manager-bot.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 *   Command handlers extracted to ./manager-bot/manager-bot.handlers.ts to satisfy Rule 16.
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentWorkflowService } from '../document-workflow/document-workflow.service';
import { safeCall } from '@common/result';
import { errMsg } from '../hr-v2-error';
import { TelegramBotsRepository } from './telegram-bots.repository';
import type { Telegraf, Context } from 'telegraf';
import {
  registerStartCommand, registerPendingCommand, registerApproveRejectCommands,
  registerTeamReportsCommands, registerKpiAlertsCommands, registerInlineActions,
  registerTextHandler, type PendingReject, type LinkSession,
} from './manager-bot/manager-bot.handlers';

@Injectable()
export class ManagerBotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ManagerBotService.name);
  private bot: Telegraf<Context> | null = null;
  private readonly token: string | undefined;
  private pendingRejects = new Map<number, PendingReject>();
  private linkSessions = new Map<number, LinkSession>();

  constructor(
    private readonly telegramRepo: TelegramBotsRepository,
    private readonly cfg: ConfigService,
    private readonly documentWorkflow: DocumentWorkflowService,
  ) {
    this.token = this.cfg.get<string>('TELEGRAM_MANAGER_BOT_TOKEN');
  }

  onModuleInit(): void { this._initBackground().catch((e) => this.logger.warn('[manager-bot.service] init failed: ' + e)); }
  private async _initBackground(): Promise<void> {
    await safeCall(async () => {
      if (!this.token) {
        this.logger.warn('Manager Bot token not configured (TELEGRAM_MANAGER_BOT_TOKEN missing) — skipping');
        return;
      }
      try {
        const { Telegraf: TelegrafClass } = await import('telegraf');
        this.bot = new TelegrafClass(this.token) as Telegraf<Context>;
        this.registerCommands(this.bot);
        this.bot.launch().catch((err: Error) => this.logger.error(`Manager Bot launch error: ${errMsg(err)}`));
        this.logger.log('Manager Bot started');
      } catch (err) {
        this.logger.error(`Failed to initialize Manager Bot: ${err instanceof Error ? errMsg(err) : String(err)}`);
      }
    });
  }

  async onModuleDestroy(): Promise<void> {
    this.bot?.stop('Manager Bot stopped');
  }

  private registerCommands(bot: Telegraf<Context>): void {
    const deps = {
      telegramRepo: this.telegramRepo,
      documentWorkflow: this.documentWorkflow,
      pendingRejects: this.pendingRejects,
      linkSessions: this.linkSessions,
      logger: this.logger,
    };
    registerStartCommand(bot, deps);
    registerPendingCommand(bot, deps);
    registerApproveRejectCommands(bot, deps);
    registerTeamReportsCommands(bot, deps);
    registerKpiAlertsCommands(bot, deps);
    registerInlineActions(bot, deps);
    registerTextHandler(bot, deps, (ctx, chatId, phone) => this.handleLinkSession(ctx, chatId, phone));
  }

  private async handleLinkSession(ctx: Context, chatId: number, phone: string): Promise<void> {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 9) {
      await ctx.reply('⚠️ Noto\'g\'ri telefon raqami. Masalan: +998901234567');
      return;
    }
    const empR = await this.telegramRepo.findEmployeeByPhone(digits);
    if (!empR.ok || !empR.data) {
      await ctx.reply('⚠️ Bu raqam tizimda topilmadi. HR bo\'limiga murojaat qiling.');
      return;
    }
    const emp = empR.data;
    if (emp['status'] !== 'active') {
      await ctx.reply('⚠️ Siz faol xodim sifatida topilmadingiz.');
      return;
    }
    if (emp['is_department_head'] !== true) {
      await ctx.reply('⚠️ Siz menejer huquqiga ega emassiz. HR bo\'limiga murojaat qiling.');
      return;
    }
    await this.telegramRepo.linkEmployeeChatId(emp['id'] as number, chatId);
    this.linkSessions.delete(chatId);
    await ctx.reply(
      `✅ <b>Muvaffaqiyatli ulandi!</b>\n\n` +
      `👤 ${String(emp['first_name'])} ${String(emp['last_name'])}\n\n` +
      'Endi barcha menejer funksiyalaridan foydalanishingiz mumkin:\n' +
      '/pending — Tasdiqlash kutayotgan hujjatlar\n' +
      '/team — Bo\'lim xodimlari\n' +
      '/alerts — Ogohlantirishlar',
      { parse_mode: 'HTML' },
    );
  }

  async sendMessage(chatId: number | string, message: string): Promise<boolean> {
    return safeCall(async () => {
      if (!this.bot) return false;
      await this.bot.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' });
      return true;
    }).then(r => (r.ok ? r.data : false));
  }

  getInstance(): Telegraf<Context> | null { return this.bot; }
}
