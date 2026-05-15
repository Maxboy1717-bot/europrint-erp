/**
 * @module cc-bot.helpers
 * @description Pure DB query helpers + director-command registrations for CcBotService.
 *   Extracted to satisfy Rule 16.
 */

import { ConfigService } from '@nestjs/config';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import type { Telegraf, Context } from 'telegraf';
import type { DirectorAgentService } from '../../../agents/director-agent.service';
import type { StrategicAgentService } from '../../../agents/strategic-agent.service';

export async function resolveUserId(ctx: Context): Promise<number | null> {
  const chatId = ctx.chat?.id;
  if (!chatId) return null;
  const r = await runQuery<{ user_id: number | null }>(sql`
    SELECT user_id FROM employees WHERE telegram_chat_id = ${String(chatId)} LIMIT 1
  `);
  return r.rows[0]?.user_id ?? null;
}

export async function fetchSummary(userId: number) {
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

export async function sendBasketList(ctx: Context, userId: number, basket: 'inbox' | 'pending' | 'outbox') {
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
        { text: '❌ Rad etish', callback_data: `reject:${doc.id}` },
      ]);
    }
    await ctx.reply(
      `📄 ${doc.document_number}${flag}\n${doc.subject}`,
      { reply_markup: { inline_keyboard: buttons } },
    );
  }
}

export async function sendDocumentDetail(ctx: Context, documentId: string) {
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

export async function sendRejectionReasons(
  ctx: Context,
  documentId: string,
  setSession: (chatId: number) => void,
) {
  const r = await runQuery<{ id: string; reason_uz: string }>(sql`
    SELECT rr.id::text, rr.reason_uz
    FROM cc_rejection_reasons rr
    INNER JOIN cc_documents d ON d.template_id = rr.template_id
    WHERE d.id = ${documentId} AND rr.is_active
    ORDER BY rr.sort_order
  `);
  if (r.rows.length === 0) {
    if (!ctx.chat) return;
    setSession(ctx.chat.id);
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

export async function fetchTelegramChatIdForUser(userId: number): Promise<string | null> {
  const r = await runQuery<{ telegram_chat_id: string | null }>(sql`
    SELECT telegram_chat_id FROM employees WHERE user_id = ${userId} LIMIT 1
  `);
  return r.rows[0]?.telegram_chat_id ?? null;
}

export async function fetchProfilePrefs(userId: number) {
  const r = await runQuery<{ urgent_only: boolean; telegram_enabled: boolean; language: string }>(sql`
    SELECT urgent_only, telegram_enabled, language
    FROM cc_notification_prefs WHERE user_id = ${userId}
  `);
  return r.rows[0] ?? { urgent_only: false, telegram_enabled: true, language: 'uz' };
}

export function registerDirectorCommands(
  bot: Telegraf<Context>,
  cfg: ConfigService,
  director: DirectorAgentService,
  strategic: StrategicAgentService,
): void {
  const directorChatId = cfg.get<string>('DIRECTOR_TELEGRAM_ID');
  const isDirector = (ctx: Context): boolean => {
    const cid = ctx.from?.id;
    return Boolean(directorChatId && cid && String(cid) === directorChatId);
  };

  bot.command('holat', async (ctx) => {
    if (!isDirector(ctx)) return ctx.reply('Bu komanda faqat direktor uchun');
    try {
      await ctx.reply('⏳ Holat tayyorlanmoqda...');
      const b = await director.getDailyBriefing();
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
      const userId = await resolveUserId(ctx);
      const r = await director.askAdvisor(question, userId ?? undefined);
      await ctx.reply(`💡 *AI javob:*\n\n${r.answer}`, { parse_mode: 'Markdown' });
    } catch (err) {
      await ctx.reply(`❌ Xatolik: ${(err as Error).message}`);
    }
  });

  bot.command('bashorat', async (ctx) => {
    if (!isDirector(ctx)) return ctx.reply('Bu komanda faqat direktor uchun');
    try {
      await ctx.reply('🔮 Prognoz tayyorlanmoqda...');
      const f = await strategic.forecastRevenue(6);
      const text = `🔮 *6 oylik daromad bashorati*\n\n` +
        `🟢 Optimistik:  ${f.optimistic.toLocaleString()} so'm\n` +
        `🟡 Realistik:   ${f.realistic.toLocaleString()} so'm\n` +
        `🔴 Pessimistik: ${f.pessimistic.toLocaleString()} so'm`;
      await ctx.reply(text, { parse_mode: 'Markdown' });
    } catch (err) {
      await ctx.reply(`❌ Xatolik: ${(err as Error).message}`);
    }
  });
}
