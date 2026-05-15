/**
 * @module notification-bot.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 *
 *   Event-message builders live in notification-bot-event-builders.ts (Rule 16 — 300 line cap).
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Result, AppError, safeCall } from '@common/result';
import { errMsg } from "../hr-v2-error";
import { TelegramBotsRepository } from './telegram-bots.repository';
import { NOTIFICATION_TEMPLATES, NotificationTemplateKey, renderTemplate } from './notification-templates';
import { buildEventMessage } from './notification-bot-event-builders';
import type { Telegraf, Context } from 'telegraf';
import { message } from 'telegraf/filters';

export interface ErpEventPayload {
  event: string;
  employeeId?: number;
  chatId?: number | string;
  data?: Record<string, unknown>;
}

export interface SendNotificationDto {
  userId: number;
  templateKey: NotificationTemplateKey;
  params: Record<string, string>;
}

type TCtxWithChat = Context & { chat?: { id?: number } };

@Injectable()
export class NotificationBotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationBotService.name);
  private bot: Telegraf<Context> | null = null;
  private readonly token: string | undefined;
  private readonly pendingLateReasons = new Map<string, string>();

  constructor(
    private readonly telegramRepo: TelegramBotsRepository,
    private readonly cfg: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.token = this.cfg.get<string>('TELEGRAM_NOTIFICATION_BOT_TOKEN');
  }

  onModuleInit(): void { this._initBackground().catch((e) => this.logger.warn('[notification-bot.service] init failed: ' + e)); }
  private async _initBackground(): Promise<void> {
    await safeCall(async () => {
      if (!this.token) {
        this.logger.warn('Notification Bot token not configured (TELEGRAM_NOTIFICATION_BOT_TOKEN missing) — skipping');
        return;
      }
      try {
        const { Telegraf: TelegrafClass } = await import('telegraf');
        this.bot = new TelegrafClass(this.token) as Telegraf<Context>;
        this.registerCommands(this.bot);
        this.bot.launch().catch((err: Error) => this.logger.error(`Notification Bot launch error: ${errMsg(err)}`));
        this.logger.log('Notification Bot started');
      } catch (err) {
        this.logger.error(`Failed to initialize Notification Bot: ${err instanceof Error ? errMsg(err) : String(err)}`);
      }
    });
  }

  async onModuleDestroy() { this.bot?.stop('Notification Bot stopped'); }

  async getEmployeeChatId(employeeId: number): Promise<string | undefined> {
    try {
      const chatIdR = await this.telegramRepo.getEmployeeTelegramChatId(employeeId);
      return (chatIdR.ok ? (chatIdR.data as string | null) : null) ?? undefined;
    } catch (e) { this.logger.warn('[NotifBot] getEmployeeChatId failed', String(e)); }
  }

  registerLateReasonPending(chatId: string, employeeId: string): void {
    this.pendingLateReasons.set(String(chatId), employeeId);
  }

  async sendNotification(dto: SendNotificationDto): Promise<Result<void, AppError>> {
    return safeCall(async () => {
      const chatId = await this.getEmployeeChatId(dto.userId);
      if (!chatId) {
        this.logger.debug(`sendNotification: no chatId for userId=${dto.userId}`);
        return;
      }
      const tpl = NOTIFICATION_TEMPLATES[dto.templateKey];
      const message = renderTemplate(tpl.template_uz, dto.params);
      await this.sendRaw(chatId, message);
    });
  }

  private async sendRaw(chatId: string | number, message: string): Promise<void> {
    if (!this.bot) return;
    try {
      await this.bot.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' });
    } catch (err) {
      this.logger.error(`sendRaw error: ${errMsg(err)}`);
    }
  }

  private registerStartCommand(bot: Telegraf<Context>): void {
    bot.command('start', async (ctx: Context) => {
      if (!(ctx as TCtxWithChat).chat?.id) return;
      await ctx.reply(
        '🔔 <b>EuroPrint Notification Bot</b>\n\nUshbu bot ERP tizimidagi muhim xabarlarni yetkazib beradi.\n\n' +
        'Buyruqlar:\n/sozlamalar — Bildirishnoma sozlamalari\n/ulash — Hisobni ulash',
        { parse_mode: 'HTML' },
      );
    });
  }

  private registerSozlamalarCommand(bot: Telegraf<Context>): void {
    bot.command('sozlamalar', async (ctx: Context) => {
      await ctx.reply(
        '⚙️ <b>Bildirishnoma sozlamalari</b>\n\n' +
        '✅ Hujjat tasdiqlash/rad etish\n✅ Kechikish ogohlantirishlari\n✅ Adaptatsiya xavfi\n' +
        '✅ PIP eslatmalari\n✅ Kunlik hisobot eslatmasi\n✅ Ta\'til tasdiqlash\n' +
        '✅ Maosh bildirishnomasi\n✅ Tug\'ilgan kun tabriklari\n\n' +
        'Barcha bildirishnomalar ERP orqali boshqariladi:\n<a href="https://erp.europrint.uz">erp.europrint.uz</a>',
        { parse_mode: 'HTML' },
      );
    });
  }

  private registerUlashCommand(bot: Telegraf<Context>): void {
    bot.command('ulash', async (ctx: Context) => {
      const chatId = (ctx as TCtxWithChat).chat?.id;
      await ctx.reply(
        `🔗 <b>Hisobni ulash</b>\n\nChat ID: <code>${chatId}</code>\n\n` +
        'Ushbu chat ID ni HR bo\'limiga yuboring va ular ERP tizimida akkauntingizga ulashadi.\n\n' +
        'Yoki ERP da o\'zingiz ulashingiz mumkin:\n<a href="https://erp.europrint.uz">erp.europrint.uz</a>',
        { parse_mode: 'HTML' },
      );
    });
  }

  private registerInboundTextHandler(bot: Telegraf<Context>): void {
    bot.on(message('text' as never), async (ctx: Context) => {
      const chatId = String((ctx as TCtxWithChat).chat?.id ?? '');
      if (!chatId) return;
      const employeeId = this.pendingLateReasons.get(chatId);
      if (!employeeId) return;
      const text = ((ctx as Context & { message?: { text?: string } }).message?.text ?? '').trim();
      if (!text) return;
      if (text.length < 30) {
        await ctx.reply(
          `❌ Sabab juda qisqa (${text.length} ta belgi). Kamida 30 ta belgi yozing va qayta yuboring.`,
          { parse_mode: 'HTML' },
        );
        return;
      }
      this.pendingLateReasons.delete(chatId);
      await this.eventEmitter.emitAsync('telegram.late_reason_received', { employeeId, reason: text });
    });
  }

  private registerCommands(bot: Telegraf<Context>): void {
    this.registerStartCommand(bot);
    this.registerSozlamalarCommand(bot);
    this.registerUlashCommand(bot);
    this.registerInboundTextHandler(bot);
  }

  async sendNotificationRaw(chatId: number | string, message: string): Promise<boolean> {
    if (!this.bot) return false;
    try {
      await this.bot.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' });
      return true;
    } catch (err) {
      this.logger.error(`sendNotificationRaw error: ${err instanceof Error ? errMsg(err) : String(err)}`);
      return false;
    }
  }

  async sendMessage(chatId: number | string, message: string): Promise<boolean> {
    return this.sendNotificationRaw(chatId, message);
  }

  async broadcastTemplate(templateKey: keyof typeof NOTIFICATION_TEMPLATES, params: Record<string, string>): Promise<number> {
    if (!this.bot) return 0;
    const tpl = NOTIFICATION_TEMPLATES[templateKey];
    const message = renderTemplate(tpl.template_uz, params);
    const chatIdsR = await this.telegramRepo.getAllActiveChatIds();
    const chatIds = chatIdsR.ok ? chatIdsR.data as string[] : [];
    let sent = 0;
    for (const chatId of chatIds) {
      if (await this.sendNotificationRaw(chatId, message)) sent++;
    }
    return sent;
  }

  async handleErpEvent(payload: ErpEventPayload): Promise<string | undefined> {
    const { event, employeeId, data } = payload;
    let chatId: string | undefined = payload.chatId ? String(payload.chatId) : undefined;
    if (!chatId && employeeId) chatId = await this.getEmployeeChatId(employeeId);
    if (!chatId) { this.logger.debug(`handleErpEvent: no chatId for event=${event}`); return undefined; }
    const message = buildEventMessage(event, data ?? {});
    if (message) await this.sendNotificationRaw(chatId, message);
    return chatId;
  }

  getInstance(): Telegraf<Context> | null { return this.bot; }
}
