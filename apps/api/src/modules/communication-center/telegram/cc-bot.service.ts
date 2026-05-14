/**
 * Communication Center — Telegram bot
 *
 * Token: TELEGRAM_CC_BOT_TOKEN
 *
 * Komandlar: /start /savat /kiruvchi /kutish /chiquvchi /yangi /profil
 * Direktor: /holat /muammo /bashorat
 * Inline: approve:<docId> | reject:<docId> | view:<docId> | reject_reason:<id>
 *
 * NOTE: Query helpers split into ./cc-bot/cc-bot.helpers.ts for Rule 16.
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Telegraf, Context } from 'telegraf';
import { CcWorkflowService } from '../application/cc-workflow.service';
import { CcAiInterviewService } from '../application/cc-ai-interview.service';
import { DirectorAgentService } from '../../agents/director-agent.service';
import { StrategicAgentService } from '../../agents/strategic-agent.service';
import {
  resolveUserId, fetchSummary, sendBasketList, sendDocumentDetail,
  sendRejectionReasons, fetchTelegramChatIdForUser, fetchProfilePrefs,
  registerDirectorCommands,
} from './cc-bot/cc-bot.helpers';

interface SessionState {
  step: 'idle' | 'awaiting_pin_approve' | 'awaiting_pin_reject' | 'awaiting_reject_reason' | 'ai_intake';
  documentId?: string;
  rejectionReasonId?: string;
  rejectComment?: string;
  aiSessionId?: string;
}

@Injectable()
export class CcBotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CcBotService.name);
  private bot: Telegraf<Context> | null = null;
  private readonly token: string | undefined;
  private readonly sessions = new Map<number, SessionState>();

  constructor(
    private readonly cfg: ConfigService,
    private readonly wf: CcWorkflowService,
    private readonly ai: CcAiInterviewService,
    private readonly director: DirectorAgentService,
    private readonly strategic: StrategicAgentService,
  ) {
    this.token = this.cfg.get<string>('TELEGRAM_CC_BOT_TOKEN');
  }

  onModuleInit(): void {
    this.init().catch((e) => this.logger.warn(`init failed: ${(e as Error).message}`));
  }

  onModuleDestroy(): void {
    try { this.bot?.stop('SIGTERM'); } catch { /* noop */ }
    this.bot = null;
  }

  private async init(): Promise<void> {
    if (!this.token) {
      this.logger.warn('TELEGRAM_CC_BOT_TOKEN topilmadi — CC bot o\'chirilgan');
      return;
    }
    const { Telegraf: TelegrafClass } = await import('telegraf');
    this.bot = new TelegrafClass(this.token) as Telegraf<Context>;
    this.registerCommands(this.bot);
    this.bot.launch().catch((err: Error) => this.logger.error(`launch error: ${err.message}`));
    this.logger.log('CC Bot started');
  }

  private registerCommands(bot: Telegraf<Context>): void {
    this.registerStartHandler(bot);
    this.registerBasketHandlers(bot);
    this.registerProfileHandlers(bot);
    registerDirectorCommands(bot, this.cfg, this.director, this.strategic);
    this.registerInlineActions(bot);
    this.registerTextHandler(bot);
  }

  private registerStartHandler(bot: Telegraf<Context>): void {
    bot.start(async (ctx) => {
      await ctx.reply(
        'Kommunikatsiya Markazi botiga xush kelibsiz!\n\n' +
        'Mavjud komandalar:\n' +
        '/savat — savat holati\n' +
        '/kiruvchi — kiruvchi hujjatlar\n' +
        '/yangi — yangi hujjat yaratish\n' +
        '/profil — sozlamalar\n\n' +
        'Login uchun ERP veb-sahifasida Telegram chat ID qo\'shing.',
      );
    });
  }

  private registerBasketHandlers(bot: Telegraf<Context>): void {
    bot.command('savat', async (ctx) => {
      const userId = await resolveUserId(ctx);
      if (!userId) return ctx.reply('Avval ERP da Telegram chat ID o\'rnating');
      const s = await fetchSummary(userId);
      await ctx.reply(
        `📥 Kiruvchi: ${s.inbox}` + (s.inboxOverdue ? ` (${s.inboxOverdue} muddati o'tgan!)` : '') + '\n' +
        `⏳ Kutish:   ${s.pending}\n` +
        `📤 Chiquvchi: ${s.outbox}`,
        { reply_markup: { inline_keyboard: [
          [{ text: '📥 Kiruvchi', callback_data: 'list:inbox' }],
          [{ text: '⏳ Kutish', callback_data: 'list:pending' }],
          [{ text: '📤 Chiquvchi', callback_data: 'list:outbox' }],
        ] } },
      );
    });

    const basketListing = async (ctx: Context, basket: 'inbox' | 'pending' | 'outbox') => {
      const userId = await resolveUserId(ctx);
      if (!userId) return ctx.reply('Avval ERP da Telegram chat ID o\'rnating');
      await sendBasketList(ctx, userId, basket);
    };
    bot.command('kiruvchi',  (ctx) => basketListing(ctx, 'inbox'));
    bot.command('kutish',    (ctx) => basketListing(ctx, 'pending'));
    bot.command('chiquvchi', (ctx) => basketListing(ctx, 'outbox'));
  }

  private registerProfileHandlers(bot: Telegraf<Context>): void {
    bot.command('yangi', async (ctx) => {
      await ctx.reply(
        'Yangi hujjat turini ERP veb-sahifada tanlang:\n' +
        '/erp-dashboard/coordination — "Yangi hujjat" tugmasi\n\n' +
        'Telegram orqali AI intervyu kelajakda qo\'shiladi.',
      );
    });

    bot.command('profil', async (ctx) => {
      const userId = await resolveUserId(ctx);
      if (!userId) return ctx.reply('Avval Telegram chat ID o\'rnating');
      const p = await fetchProfilePrefs(userId);
      await ctx.reply(
        `Sozlamalar:\n` +
        `• Til: ${p.language}\n` +
        `• Telegram bildirishnoma: ${p.telegram_enabled ? 'YONIQ' : 'O\'CHIQ'}\n` +
        `• Faqat shoshilinch: ${p.urgent_only ? 'HA' : 'YO\'Q'}\n\n` +
        `O'zgartirish ERP veb-sahifa orqali.`,
      );
    });
  }

  private registerInlineActions(bot: Telegraf<Context>): void {
    this.registerListAndViewActions(bot);
    this.registerApprovalActions(bot);
  }

  private registerListAndViewActions(bot: Telegraf<Context>): void {
    bot.action(/^list:(inbox|pending|outbox)$/, async (ctx: Context & { match: RegExpExecArray }) => {
      try {
        const basket = ctx.match[1] as 'inbox' | 'pending' | 'outbox';
        const userId = await resolveUserId(ctx);
        if (userId) await sendBasketList(ctx, userId, basket);
        await ctx.answerCbQuery();
      } catch (err) { this.logger.error(`list action: ${(err as Error).message}`); }
    });

    bot.action(/^view:(.+)$/, async (ctx: Context & { match: RegExpExecArray }) => {
      try {
        await sendDocumentDetail(ctx, ctx.match[1]);
        await ctx.answerCbQuery();
      } catch (err) { this.logger.error(`view action: ${(err as Error).message}`); }
    });
  }

  private registerApprovalActions(bot: Telegraf<Context>): void {
    bot.action(/^approve:(.+)$/, async (ctx: Context & { match: RegExpExecArray }) => {
      const chatId = ctx.chat?.id;
      if (!chatId) return;
      this.sessions.set(chatId, { step: 'awaiting_pin_approve', documentId: ctx.match[1] });
      await ctx.reply('PIN kodingizni kiriting (4-8 raqam):');
      await ctx.answerCbQuery();
    });
    bot.action(/^reject:(.+)$/, async (ctx: Context & { match: RegExpExecArray }) => this.onRejectAction(ctx));
    bot.action(/^reject_reason:(.+)$/, async (ctx: Context & { match: RegExpExecArray }) => this.onRejectReasonAction(ctx));
  }

  private async onRejectAction(ctx: Context & { match: RegExpExecArray }): Promise<void> {
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    const docId = ctx.match[1];
    this.sessions.set(chatId, { step: 'awaiting_reject_reason', documentId: docId });
    await sendRejectionReasons(ctx, docId, (cid) => this.sessions.set(cid, { step: 'awaiting_pin_reject', documentId: docId }));
    await ctx.answerCbQuery();
  }

  private async onRejectReasonAction(ctx: Context & { match: RegExpExecArray }): Promise<void> {
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    const sess = this.sessions.get(chatId);
    if (sess?.step === 'awaiting_reject_reason' && sess.documentId) {
      sess.step = 'awaiting_pin_reject';
      sess.rejectionReasonId = ctx.match[1];
      this.sessions.set(chatId, sess);
      await ctx.reply('Rad etish uchun PIN kodingizni kiriting:');
    }
    await ctx.answerCbQuery();
  }

  private registerTextHandler(bot: Telegraf<Context>): void {
    // @ts-expect-error  Telegraf v4 type strictness — runtime ishlaydi
    bot.on('text', async (ctx: Context) => {
      const chatId = ctx.chat?.id;
      if (!chatId) return;
      const sess = this.sessions.get(chatId);
      if (!sess || sess.step === 'idle') return;
      const text = (ctx.message as { text?: string }).text?.trim() ?? '';

      if (sess.step === 'awaiting_pin_approve' && sess.documentId) {
        await this.handleApprovePin(ctx, chatId, sess.documentId, text);
        return;
      }
      if (sess.step === 'awaiting_pin_reject' && sess.documentId) {
        await this.handleRejectPin(ctx, chatId, sess, text);
        return;
      }
    });
  }

  private async handleApprovePin(ctx: Context, chatId: number, documentId: string, text: string): Promise<unknown> {
    if (!/^\d{4,8}$/.test(text)) return ctx.reply('PIN 4-8 raqam bo\'lishi kerak');
    ctx.deleteMessage().catch(() => { /* not critical */ });
    try {
      const userId = await resolveUserId(ctx);
      if (!userId) return ctx.reply('Foydalanuvchi aniqlanmadi');
      await this.wf.approve(documentId, userId, { pin: text });
      await ctx.reply('✅ Tasdiqlandi');
    } catch (err) {
      await ctx.reply(`❌ Xatolik: ${(err as Error).message}`);
    } finally {
      this.sessions.delete(chatId);
    }
  }

  private async handleRejectPin(ctx: Context, chatId: number, sess: SessionState, text: string): Promise<unknown> {
    if (!/^\d{4,8}$/.test(text)) return ctx.reply('PIN 4-8 raqam bo\'lishi kerak');
    ctx.deleteMessage().catch(() => { /* not critical */ });
    try {
      const userId = await resolveUserId(ctx);
      if (!userId) return ctx.reply('Foydalanuvchi aniqlanmadi');
      if (!sess.documentId) return ctx.reply('Hujjat tanlanmadi');
      await this.wf.reject(sess.documentId, userId, {
        pin: text, rejectionReasonId: sess.rejectionReasonId, comment: sess.rejectComment,
      });
      await ctx.reply('❌ Rad etildi');
    } catch (err) {
      await ctx.reply(`Xatolik: ${(err as Error).message}`);
    } finally {
      this.sessions.delete(chatId);
    }
  }

  /** Tashqi service'lardan chaqiriladi: foydalanuvchiga xabar yuboradi */
  async sendNotificationToUser(userId: number, text: string): Promise<void> {
    if (!this.bot) return;
    const chatId = await fetchTelegramChatIdForUser(userId);
    if (!chatId) return;
    try {
      await this.bot.telegram.sendMessage(chatId, text);
    } catch (err) {
      this.logger.warn(`Telegram send failed for user ${userId}: ${(err as Error).message}`);
    }
  }
}
