/**
 * Communication Center — Telegram bot
 *
 * Komandlar:
 *   /start     — boshlash + til tanlash
 *   /savat     — uchala savat sonlari + tugmalar
 *   /kiruvchi  — kiruvchi savat ro'yxati
 *   /kutish    — kutish savati
 *   /chiquvchi — chiquvchi savat
 *   /yangi     — yangi hujjat (AI intervyu boshlanadi)
 *   /profil    — bildirishnoma sozlamalari
 *
 * Inline tugmalar:
 *   approve:<docId>   tasdiqlash → PIN so'raydi
 *   reject:<docId>    rad etish  → sabab tanlatadi → PIN
 *   view:<docId>      hujjat ko'rinishi
 *   ai_answer:<sessionId>:<value>   AI savol javob (choice tanlovi)
 *
 * Token: TELEGRAM_CC_BOT_TOKEN
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import type { Telegraf, Context } from 'telegraf';
import { CcWorkflowService } from '../application/cc-workflow.service';
import { CcAiInterviewService } from '../application/cc-ai-interview.service';
import { DirectorAgentService } from '../../agents/director-agent.service';
import { StrategicAgentService } from '../../agents/strategic-agent.service';

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
  private readonly sessions = new Map<number, SessionState>();   // chatId → state

  constructor(
    private readonly cfg:       ConfigService,
    private readonly wf:        CcWorkflowService,
    private readonly ai:        CcAiInterviewService,
    private readonly director:  DirectorAgentService,
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

  // ─────────────────────────────────────────────────────────────────────
  private registerCommands(bot: Telegraf<Context>): void {
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

    bot.command('savat', async (ctx) => {
      const userId = await this.resolveUserId(ctx);
      if (!userId) return ctx.reply('Avval ERP da Telegram chat ID o\'rnating');
      const s = await this.fetchSummary(userId);
      await ctx.reply(
        `📥 Kiruvchi: ${s.inbox}` + (s.inboxOverdue ? ` (${s.inboxOverdue} muddati o'tgan!)` : '') + '\n' +
        `⏳ Kutish:   ${s.pending}\n` +
        `📤 Chiquvchi: ${s.outbox}`,
        { reply_markup: { inline_keyboard: [
          [{ text: '📥 Kiruvchi', callback_data: 'list:inbox' }],
          [{ text: '⏳ Kutish',   callback_data: 'list:pending' }],
          [{ text: '📤 Chiquvchi', callback_data: 'list:outbox' }],
        ] } },
      );
    });

    bot.command('kiruvchi', async (ctx) => {
      const userId = await this.resolveUserId(ctx);
      if (!userId) return ctx.reply('Avval ERP da Telegram chat ID o\'rnating');
      await this.sendBasketList(ctx, userId, 'inbox');
    });
    bot.command('kutish', async (ctx) => {
      const userId = await this.resolveUserId(ctx);
      if (!userId) return ctx.reply('Avval ERP da Telegram chat ID o\'rnating');
      await this.sendBasketList(ctx, userId, 'pending');
    });
    bot.command('chiquvchi', async (ctx) => {
      const userId = await this.resolveUserId(ctx);
      if (!userId) return ctx.reply('Avval ERP da Telegram chat ID o\'rnating');
      await this.sendBasketList(ctx, userId, 'outbox');
    });

    bot.command('yangi', async (ctx) => {
      await ctx.reply(
        'Yangi hujjat turini ERP veb-sahifada tanlang:\n' +
        '/erp-dashboard/coordination — "Yangi hujjat" tugmasi\n\n' +
        'Telegram orqali AI intervyu kelajakda qo\'shiladi.',
      );
    });

    bot.command('profil', async (ctx) => {
      const userId = await this.resolveUserId(ctx);
      if (!userId) return ctx.reply('Avval Telegram chat ID o\'rnating');
      const r = await runQuery<{ urgent_only: boolean; telegram_enabled: boolean; language: string }>(sql`
        SELECT urgent_only, telegram_enabled, language
        FROM cc_notification_prefs WHERE user_id = ${userId}
      `);
      const p = r.rows[0] ?? { urgent_only: false, telegram_enabled: true, language: 'uz' };
      await ctx.reply(
        `Sozlamalar:\n` +
        `• Til: ${p.language}\n` +
        `• Telegram bildirishnoma: ${p.telegram_enabled ? 'YONIQ' : 'O\'CHIQ'}\n` +
        `• Faqat shoshilinch: ${p.urgent_only ? 'HA' : 'YO\'Q'}\n\n` +
        `O'zgartirish ERP veb-sahifa orqali.`,
      );
    });

    // ── DIREKTOR komandalar — faqat DIRECTOR_TELEGRAM_ID ga ishlaydi ─────
    const directorChatId = this.cfg.get<string>('DIRECTOR_TELEGRAM_ID');
    const isDirector = (ctx: Context): boolean => {
      const cid = ctx.from?.id;
      return Boolean(directorChatId && cid && String(cid) === directorChatId);
    };

    bot.command('holat', async (ctx) => {
      if (!isDirector(ctx)) return ctx.reply('Bu komanda faqat direktor uchun');
      try {
        await ctx.reply('⏳ Holat tayyorlanmoqda...');
        const b = await this.director.getDailyBriefing();
        const text = `📊 *Joriy holat — ${b.date}*\n\n` +
          `🟦 Kechikkan buyurtmalar: ${b.kpi.ordersDelayed}\n` +
          `🟥 24h SLA buzilgan: ${b.kpi.ccInboxOverdue}\n` +
          `🟧 Kritik qoldiq: ${b.kpi.criticalStockCount}\n` +
          `🟪 Buyurtma summasi: ${b.kpi.ordersDelayedAmount.toLocaleString()} so'm\n\n` +
          `*Alertlar:* ${b.alerts.length}\n\n` +
          `*AI xulosa:*\n${b.summary}`;
        await ctx.reply(text, { parse_mode: 'Markdown' });
      } catch (err) {
        await ctx.reply(`❌ Xatolik: ${(err as Error).message}`);
      }
    });

    bot.command('muammo', async (ctx) => {
      if (!isDirector(ctx)) return ctx.reply('Bu komanda faqat direktor uchun');
      const text = (ctx.message as { text?: string }).text ?? '';
      const question = text.replace(/^\/muammo\s*/i, '').trim();
      if (!question) return ctx.reply('Format: /muammo Bugun nima muammo bor?');
      try {
        await ctx.reply('🤖 AI fikrlamoqda...');
        const userId = await this.resolveUserId(ctx);
        const r = await this.director.askAdvisor(question, userId ?? undefined);
        await ctx.reply(`💡 *AI javob:*\n\n${r.answer}`, { parse_mode: 'Markdown' });
      } catch (err) {
        await ctx.reply(`❌ Xatolik: ${(err as Error).message}`);
      }
    });

    bot.command('bashorat', async (ctx) => {
      if (!isDirector(ctx)) return ctx.reply('Bu komanda faqat direktor uchun');
      try {
        await ctx.reply('🔮 Prognoz tayyorlanmoqda...');
        const f = await this.strategic.forecastRevenue(6);
        const text = `🔮 *6 oylik daromad bashorati*\n\n` +
          `🟢 Optimistik:  ${f.optimistic.toLocaleString()} so'm\n` +
          `🟡 Realistik:   ${f.realistic.toLocaleString()} so'm\n` +
          `🔴 Pessimistik: ${f.pessimistic.toLocaleString()} so'm`;
        await ctx.reply(text, { parse_mode: 'Markdown' });
      } catch (err) {
        await ctx.reply(`❌ Xatolik: ${(err as Error).message}`);
      }
    });

    // ── Callback handlers (bot.action for inline button callbacks) ───
    bot.action(/^list:(inbox|pending|outbox)$/, async (ctx: Context & { match: RegExpExecArray }) => {
      try {
        const basket = ctx.match[1] as 'inbox' | 'pending' | 'outbox';
        const userId = await this.resolveUserId(ctx);
        if (userId) await this.sendBasketList(ctx, userId, basket);
        await ctx.answerCbQuery();
      } catch (err) { this.logger.error(`list action: ${(err as Error).message}`); }
    });

    bot.action(/^view:(.+)$/, async (ctx: Context & { match: RegExpExecArray }) => {
      try {
        await this.sendDocumentDetail(ctx, ctx.match[1]);
        await ctx.answerCbQuery();
      } catch (err) { this.logger.error(`view action: ${(err as Error).message}`); }
    });

    bot.action(/^approve:(.+)$/, async (ctx: Context & { match: RegExpExecArray }) => {
      const chatId = ctx.chat?.id;
      if (!chatId) return;
      this.sessions.set(chatId, { step: 'awaiting_pin_approve', documentId: ctx.match[1] });
      await ctx.reply('PIN kodingizni kiriting (4-8 raqam):');
      await ctx.answerCbQuery();
    });

    bot.action(/^reject:(.+)$/, async (ctx: Context & { match: RegExpExecArray }) => {
      const chatId = ctx.chat?.id;
      if (!chatId) return;
      const docId = ctx.match[1];
      this.sessions.set(chatId, { step: 'awaiting_reject_reason', documentId: docId });
      await this.sendRejectionReasons(ctx, docId);
      await ctx.answerCbQuery();
    });

    bot.action(/^reject_reason:(.+)$/, async (ctx: Context & { match: RegExpExecArray }) => {
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
    });

    // ── Text handler — PIN tekshirish va boshqa input'lar ─────────────
    // @ts-expect-error  Telegraf v4 type strictness — runtime ishlaydi (boshqa bot service'lar bilan bir xil pattern)
    bot.on('text', async (ctx: Context) => {
      const chatId = ctx.chat?.id;
      if (!chatId) return;
      const sess = this.sessions.get(chatId);
      if (!sess || sess.step === 'idle') return;

      const text = (ctx.message as { text?: string }).text?.trim() ?? '';

      if (sess.step === 'awaiting_pin_approve' && sess.documentId) {
        if (!/^\d{4,8}$/.test(text)) return ctx.reply('PIN 4-8 raqam bo\'lishi kerak');
        // Delete PIN message immediately to protect it from chat history
        ctx.deleteMessage().catch(() => { /* not critical */ });
        try {
          const userId = await this.resolveUserId(ctx);
          if (!userId) return ctx.reply('Foydalanuvchi aniqlanmadi');
          await this.wf.approve(sess.documentId, userId, { pin: text });
          await ctx.reply('✅ Tasdiqlandi');
        } catch (err) {
          await ctx.reply(`❌ Xatolik: ${(err as Error).message}`);
        } finally {
          this.sessions.delete(chatId);
        }
        return;
      }

      if (sess.step === 'awaiting_pin_reject' && sess.documentId) {
        if (!/^\d{4,8}$/.test(text)) return ctx.reply('PIN 4-8 raqam bo\'lishi kerak');
        // Delete PIN message immediately to protect it from chat history
        ctx.deleteMessage().catch(() => { /* not critical */ });
        try {
          const userId = await this.resolveUserId(ctx);
          if (!userId) return ctx.reply('Foydalanuvchi aniqlanmadi');
          await this.wf.reject(sess.documentId, userId, {
            pin: text, rejectionReasonId: sess.rejectionReasonId, comment: sess.rejectComment,
          });
          await ctx.reply('❌ Rad etildi');
        } catch (err) {
          await ctx.reply(`Xatolik: ${(err as Error).message}`);
        } finally {
          this.sessions.delete(chatId);
        }
        return;
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // SUPPORT METHODS
  // ─────────────────────────────────────────────────────────────────────
  /** Telegram chat_id → ERP user_id (employees.telegram_chat_id orqali) */
  private async resolveUserId(ctx: Context): Promise<number | null> {
    const chatId = ctx.chat?.id;
    if (!chatId) return null;
    const r = await runQuery<{ user_id: number | null }>(sql`
      SELECT user_id FROM employees WHERE telegram_chat_id = ${String(chatId)} LIMIT 1
    `);
    return r.rows[0]?.user_id ?? null;
  }

  private async fetchSummary(userId: number) {
    const r = await runQuery<{ inbox: string; pending: string; outbox: string; inbox_overdue: string }>(sql`
      SELECT
        COUNT(*) FILTER (WHERE basket_state = 'inbox'   AND basket_owner_user_id = ${userId}) AS inbox,
        COUNT(*) FILTER (WHERE basket_state = 'pending' AND basket_owner_user_id = ${userId}) AS pending,
        COUNT(*) FILTER (WHERE basket_state = 'outbox'  AND sender_user_id      = ${userId}) AS outbox,
        COUNT(*) FILTER (WHERE basket_state = 'inbox' AND basket_owner_user_id = ${userId} AND is_inbox_overdue) AS inbox_overdue
      FROM cc_documents WHERE archived_at IS NULL
    `);
    const x = r.rows[0] ?? { inbox: '0', pending: '0', outbox: '0', inbox_overdue: '0' };
    return {
      inbox: Number(x.inbox), pending: Number(x.pending),
      outbox: Number(x.outbox), inboxOverdue: Number(x.inbox_overdue),
    };
  }

  private async sendBasketList(ctx: Context, userId: number, basket: 'inbox' | 'pending' | 'outbox') {
    // Explicit column filter — no sql.raw() with variable column names
    const ownerFilter = basket === 'outbox'
      ? sql`AND d.sender_user_id = ${userId}`
      : sql`AND d.basket_owner_user_id = ${userId}`;
    const r = await runQuery<{ id: string; document_number: string; subject: string; priority: string; is_inbox_overdue: boolean }>(sql`
      SELECT d.id::text, d.document_number, d.subject, d.priority, d.is_inbox_overdue
      FROM cc_documents d
      WHERE d.basket_state = ${basket}
        ${ownerFilter}
        AND d.archived_at IS NULL
      ORDER BY d.is_inbox_overdue DESC, d.basket_entered_at ASC
      LIMIT 10
    `);
    if (r.rows.length === 0) return ctx.reply(`Savat bo'sh.`);
    for (const doc of r.rows) {
      const flag = doc.is_inbox_overdue ? ' ⏰' : '';
      const buttons: { text: string; callback_data: string }[][] = [[
        { text: '👁 Ko\'rish', callback_data: `view:${doc.id}` },
      ]];
      if (basket === 'inbox' || basket === 'pending') {
        buttons.push([
          { text: '✅ Tasdiqlash', callback_data: `approve:${doc.id}` },
          { text: '❌ Rad etish',  callback_data: `reject:${doc.id}` },
        ]);
      }
      await ctx.reply(
        `📄 ${doc.document_number}${flag}\n${doc.subject}`,
        { reply_markup: { inline_keyboard: buttons } },
      );
    }
  }

  private async sendDocumentDetail(ctx: Context, documentId: string) {
    const r = await runQuery<{
      document_number: string; subject: string; ai_body: string;
      sender_first: string | null; sender_last: string | null;
      created_at: string;
    }>(sql`
      SELECT d.document_number, d.subject, d.ai_body, d.created_at,
             u.first_name AS sender_first, u.last_name AS sender_last
      FROM cc_documents d
      LEFT JOIN users u ON u.id = d.sender_user_id
      WHERE d.id = ${documentId} LIMIT 1
    `);
    const doc = r.rows[0];
    if (!doc) return ctx.reply('Hujjat topilmadi');
    const senderName = `${doc.sender_first ?? ''} ${doc.sender_last ?? ''}`.trim() || 'Noma\'lum';
    await ctx.reply(
      `📄 ${doc.document_number}\n` +
      `📝 ${doc.subject}\n` +
      `👤 ${senderName}\n\n` +
      `${doc.ai_body.slice(0, 3500)}` + (doc.ai_body.length > 3500 ? '…\n\n[Davomi veb-sahifada]' : ''),
    );
  }

  private async sendRejectionReasons(ctx: Context, documentId: string) {
    const r = await runQuery<{ id: string; reason_uz: string }>(sql`
      SELECT rr.id::text, rr.reason_uz
      FROM cc_rejection_reasons rr
      INNER JOIN cc_documents d ON d.template_id = rr.template_id
      WHERE d.id = ${documentId} AND rr.is_active
      ORDER BY rr.sort_order
    `);
    if (r.rows.length === 0) {
      if (!ctx.chat) return;
      this.sessions.set(ctx.chat.id, { step: 'awaiting_pin_reject', documentId });
      return ctx.reply('Sabab kiritmasdan PIN bilan rad etish uchun PIN yuboring:');
    }
    await ctx.reply('Rad etish sababini tanlang:', {
      reply_markup: {
        inline_keyboard: r.rows.map(rr => ([
          { text: rr.reason_uz, callback_data: `reject_reason:${rr.id}` },
        ])),
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  /** Tashqi service'lardan chaqiriladi: foydalanuvchiga xabar yuboradi */
  async sendNotificationToUser(userId: number, text: string): Promise<void> {
    if (!this.bot) return;
    const r = await runQuery<{ telegram_chat_id: string | null }>(sql`
      SELECT telegram_chat_id FROM employees WHERE user_id = ${userId} LIMIT 1
    `);
    const chatId = r.rows[0]?.telegram_chat_id;
    if (!chatId) return;
    try {
      await this.bot.telegram.sendMessage(chatId, text);
    } catch (err) {
      this.logger.warn(`Telegram send failed for user ${userId}: ${(err as Error).message}`);
    }
  }
}
