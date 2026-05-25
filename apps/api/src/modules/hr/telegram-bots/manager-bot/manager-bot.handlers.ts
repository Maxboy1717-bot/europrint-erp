/**
 * @module manager-bot.handlers
 * @description Telegraf inline action + text handlers + re-export of command handlers.
 *   Split into ./manager-bot.commands.ts (slash commands) + ./manager-bot.types.ts.
 */

import type { Telegraf, Context } from 'telegraf';
import { message } from 'telegraf/filters';
import { errMsg } from '../../hr-v2-error';
import type { HandlersDeps } from './manager-bot.types';

export type { PendingReject, LinkSession, HandlersDeps } from './manager-bot.types';
export {
  registerStartCommand, registerPendingCommand,
  registerApproveRejectCommands, registerTeamReportsCommands,
  registerKpiAlertsCommands,
} from './manager-bot.commands';

type CtxWithChat = Context & { chat?: { id?: number } };
type CtxWithMsg = CtxWithChat & { message?: { text?: string } };

export function registerInlineActions(bot: Telegraf<Context>, deps: HandlersDeps): void {
  const { telegramRepo, documentWorkflow, pendingRejects, logger } = deps;
  bot.action(/^approve:(\d+)$/, async (ctx) => {
    try {
      const match = (ctx as Context & { match?: RegExpMatchArray }).match;
      const stepId = match ? parseInt(match[1], 10) : NaN;
      if (isNaN(stepId)) return;
      const chatId = (ctx as CtxWithChat).chat?.id;
      if (!chatId) return;
      const managerR = await telegramRepo.getManagerByChatId(chatId);
      if (!managerR.ok || !managerR.data) {
        await ctx.answerCbQuery('Siz menejer sifatida topilmadingiz'); return;
      }
      await documentWorkflow.approveStep(stepId, managerR.data['id'] as number);
      await ctx.answerCbQuery('✅ Tasdiqlandi!');
      await ctx.editMessageText(`✅ Hujjat #${stepId} tasdiqlandi!`);
    } catch (err) {
      logger.error(`approve action error: ${errMsg(err)}`);
      await ctx.answerCbQuery('Xatolik yuz berdi').catch(() => undefined);
    }
  });

  bot.action(/^reject:(\d+)$/, async (ctx) => {
    try {
      const match = (ctx as Context & { match?: RegExpMatchArray }).match;
      const docId = match ? parseInt(match[1], 10) : NaN;
      if (isNaN(docId)) return;
      const chatId = (ctx as CtxWithChat).chat?.id;
      if (!chatId) return;
      const managerR = await telegramRepo.getManagerByChatId(chatId);
      if (!managerR.ok || !managerR.data) {
        await ctx.answerCbQuery('Siz menejer sifatida topilmadingiz'); return;
      }
      const stepIdR = await telegramRepo.getCurrentPendingStepId(docId, managerR.data['id'] as number);
      const stepId = stepIdR.ok ? stepIdR.data : null;
      if (!stepId) {
        await ctx.answerCbQuery('Hujjat sizga tayinlanmagan yoki allaqachon qayta ishlangan');
        return;
      }
      pendingRejects.set(chatId, { documentId: docId, stepId, step: 'awaiting_reason' });
      await ctx.answerCbQuery('Sabab kiriting', { show_alert: false });
      await ctx.reply(`📝 Hujjat #${docId} rad etish sababini yozing:`);
    } catch (err) {
      logger.error(`reject action error: ${errMsg(err)}`);
      await ctx.answerCbQuery('Xatolik yuz berdi').catch(() => undefined);
    }
  });
}

export function registerTextHandler(
  bot: Telegraf<Context>,
  deps: HandlersDeps,
  handleLinkSession: (ctx: Context, chatId: number, phone: string) => Promise<void>,
): void {
  const { telegramRepo, documentWorkflow, pendingRejects, linkSessions, logger } = deps;
  bot.on(message('text' as never), async (ctx: Context) => {
    try {
      const chatId = (ctx as CtxWithChat).chat?.id;
      const text = ((ctx as CtxWithMsg).message?.text ?? '').trim();
      if (!chatId || text.startsWith('/')) return;

      const linkSession = linkSessions.get(chatId);
      if (linkSession) { await handleLinkSession(ctx, chatId, text); return; }

      const pending = pendingRejects.get(chatId);
      if (!pending) return;
      if (text.length < 5) {
        await ctx.reply('⚠️ Sabab juda qisqa. Kamida 5 ta belgi kiriting:');
        return;
      }
      const managerR = await telegramRepo.getManagerByChatId(chatId);
      if (!managerR.ok || !managerR.data) {
        pendingRejects.delete(chatId);
        await ctx.reply('⚠️ Siz menejer sifatida topilmadingiz.');
        return;
      }
      const rejectR = await documentWorkflow.rejectStep(pending.stepId, managerR.data['id'] as number, text);
      if (!rejectR.ok) {
        await ctx.reply('⚠️ Hujjatni rad etishda xatolik yuz berdi. Qayta urinib ko\'ring.');
        return;
      }
      pendingRejects.delete(chatId);
      await ctx.reply(`❌ Hujjat #${pending.documentId} rad etildi.\nSabab: ${text}`);
    } catch (err) {
      logger.error(`text handler error: ${errMsg(err)}`);
      await ctx.reply('Xatolik yuz berdi, iltimos qayta urinib ko\'ring').catch(() => undefined);
    }
  });
}
