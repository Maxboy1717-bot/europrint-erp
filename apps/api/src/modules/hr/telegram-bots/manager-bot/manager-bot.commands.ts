/**
 * @module manager-bot.commands
 * @description Slash-command handlers for ManagerBotService.
 */

import type { Telegraf, Context } from 'telegraf';
import { errMsg } from '../../hr-v2-error';
import type { HandlersDeps } from './manager-bot.types';

type CtxWithChat = Context & { chat?: { id?: number } };
type CtxWithMsg = CtxWithChat & { message?: { text?: string } };

export function registerStartCommand(bot: Telegraf<Context>, deps: HandlersDeps): void {
  const { telegramRepo, pendingRejects, linkSessions, logger } = deps;
  bot.command('start', async (ctx: Context) => {
    try {
      const chatId = (ctx as CtxWithChat).chat?.id;
      if (!chatId) return;
      pendingRejects.delete(chatId);
      linkSessions.delete(chatId);
      const existingR = await telegramRepo.getManagerByChatId(chatId);
      if (existingR.ok && existingR.data) {
        const m = existingR.data;
        await ctx.reply(
          `👔 <b>EuroPrint Manager Bot</b>\n\n` +
          `Xush kelibsiz, ${String(m['first_name'])} ${String(m['last_name'])}!\n\n` +
          'Buyruqlar:\n' +
          '/pending — Tasdiqlash kutayotgan hujjatlar\n' +
          '/approve &lt;id&gt; — Hujjatni tasdiqlash\n' +
          '/reject &lt;id&gt; — Hujjatni rad etish\n' +
          '/team — Bo\'lim xodimlari\n' +
          '/reports — Kundalik hisobotlar holati\n' +
          '/kpi — Bo\'lim KPI ko\'rsatkichlari\n' +
          '/alerts — Joriy ogohlantirishlar',
          { parse_mode: 'HTML' },
        );
      } else {
        linkSessions.set(chatId, { step: 'awaiting_phone' });
        await ctx.reply(
          '👔 <b>EuroPrint Manager Bot</b>\n\n' +
          'Hisobingizni ulash uchun telefon raqamingizni yuboring:\n' +
          '(Masalan: +998901234567)\n\n' +
          'Agar siz menejer bo\'lmasangiz, HR bo\'limiga murojaat qiling.',
          { parse_mode: 'HTML' },
        );
      }
    } catch (err) {
      logger.error(`/start error: ${errMsg(err)}`);
      await ctx.reply('Xatolik yuz berdi, iltimos qayta urinib ko\'ring').catch(() => undefined);
    }
  });
}

export function registerPendingCommand(bot: Telegraf<Context>, deps: HandlersDeps): void {
  const { telegramRepo, logger } = deps;
  bot.command('pending', async (ctx: Context) => {
    try {
      const chatId = (ctx as CtxWithChat).chat?.id;
      if (!chatId) return;
      const managerR = await telegramRepo.getManagerByChatId(chatId);
      if (!managerR.ok || !managerR.data) {
        await ctx.reply('⚠️ Siz menejer sifatida topilmadingiz. HR bo\'limiga murojaat qiling.');
        return;
      }
      const manager = managerR.data;
      const docsR = await telegramRepo.getPendingDocumentsForManager(manager['id'] as number);
      const docs = docsR.ok ? docsR.data : [];
      if (!docs.length) {
        await ctx.reply('✅ Tasdiqlash kutayotgan hujjatlar yo\'q.');
        return;
      }
      const { Markup } = await import('telegraf');
      for (const doc of docs.slice(0, 10)) {
        const docId = doc['id'] as number;
        const title = String(doc['title'] ?? 'Hujjat');
        const submitter = String(doc['submitter_name'] ?? 'Xodim');
        const submittedAt = String(doc['submitted_at'] ?? '');
        await ctx.reply(
          `📄 <b>${title}</b>\nYuboruvchi: ${submitter}\nSana: ${submittedAt}`,
          {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
              [
                Markup.button.callback(`✅ Tasdiqlash`, `approve:${docId}`),
                Markup.button.callback(`❌ Rad etish`, `reject:${docId}`),
              ],
            ]),
          },
        );
      }
    } catch (err) {
      logger.error(`/pending error: ${errMsg(err)}`);
      await ctx.reply('Xatolik yuz berdi, iltimos qayta urinib ko\'ring').catch(() => undefined);
    }
  });
}

export function registerApproveRejectCommands(bot: Telegraf<Context>, deps: HandlersDeps): void {
  const { telegramRepo, documentWorkflow, pendingRejects, logger } = deps;
  bot.command('approve', async (ctx: Context) => {
    try {
      const text = ((ctx as CtxWithMsg).message?.text ?? '').trim();
      const parts = text.split(/\s+/);
      const stepId = parts[1] ? parseInt(parts[1], 10) : NaN;
      if (isNaN(stepId)) {
        await ctx.reply('⚠️ Foydalanish: /approve &lt;id&gt;', { parse_mode: 'HTML' });
        return;
      }
      const chatId = (ctx as CtxWithChat).chat?.id;
      if (!chatId) return;
      const managerR = await telegramRepo.getManagerByChatId(chatId);
      if (!managerR.ok || !managerR.data) {
        await ctx.reply('⚠️ Siz menejer sifatida topilmadingiz.');
        return;
      }
      await documentWorkflow.approveStep(stepId, managerR.data['id'] as number);
      await ctx.reply(`✅ Hujjat #${stepId} tasdiqlandi!`);
    } catch (err) {
      logger.error(`/approve error: ${errMsg(err)}`);
      await ctx.reply('Xatolik yuz berdi, iltimos qayta urinib ko\'ring').catch(() => undefined);
    }
  });

  bot.command('reject', async (ctx: Context) => {
    try {
      const text = ((ctx as CtxWithMsg).message?.text ?? '').trim();
      const parts = text.split(/\s+/);
      const docId = parts[1] ? parseInt(parts[1], 10) : NaN;
      if (isNaN(docId)) {
        await ctx.reply('⚠️ Foydalanish: /reject &lt;id&gt;', { parse_mode: 'HTML' });
        return;
      }
      const chatId = (ctx as CtxWithChat).chat?.id;
      if (!chatId) return;
      const managerR = await telegramRepo.getManagerByChatId(chatId);
      if (!managerR.ok || !managerR.data) {
        await ctx.reply('⚠️ Siz menejer sifatida topilmadingiz.');
        return;
      }
      const stepIdR = await telegramRepo.getCurrentPendingStepId(docId, managerR.data['id'] as number);
      const stepId = stepIdR.ok ? stepIdR.data : null;
      if (!stepId) {
        await ctx.reply('⚠️ Bu hujjat sizga tayinlanmagan yoki allaqachon qayta ishlangan.');
        return;
      }
      pendingRejects.set(chatId, { documentId: docId, stepId, step: 'awaiting_reason' });
      await ctx.reply(`📝 Hujjat #${docId} rad etish sababi uchun yozing:`);
    } catch (err) {
      logger.error(`/reject error: ${errMsg(err)}`);
      await ctx.reply('Xatolik yuz berdi, iltimos qayta urinib ko\'ring').catch(() => undefined);
    }
  });
}

export function registerTeamReportsCommands(bot: Telegraf<Context>, deps: HandlersDeps): void {
  const { telegramRepo, logger } = deps;
  bot.command('team', async (ctx: Context) => {
    try {
      const chatId = (ctx as CtxWithChat).chat?.id;
      if (!chatId) return;
      const managerR = await telegramRepo.getManagerByChatId(chatId);
      if (!managerR.ok || !managerR.data) { await ctx.reply('⚠️ Siz menejer sifatida topilmadingiz.'); return; }
      const teamR = await telegramRepo.getTeamForManager(managerR.data['id'] as number);
      const team = teamR.ok ? teamR.data : [];
      if (!team.length) { await ctx.reply('👥 Bo\'limingizda xodimlar topilmadi.'); return; }
      const lines = team.map(m => {
        const icon = m['attendance_today'] === 'present' ? '🟢' : m['attendance_today'] === 'late' ? '🟡' : '🔴';
        return `${icon} ${String(m['first_name'])} ${String(m['last_name'])} — ${String(m['position'] ?? 'Lavozim yo\'q')}`;
      });
      await ctx.reply(`👥 <b>Bo\'lim xodimlari</b>\n\n${lines.join('\n')}`, { parse_mode: 'HTML' });
    } catch (err) {
      logger.error(`/team error: ${errMsg(err)}`);
      await ctx.reply('Xatolik yuz berdi, iltimos qayta urinib ko\'ring').catch(() => undefined);
    }
  });

  bot.command('reports', async (ctx: Context) => {
    try {
      const chatId = (ctx as CtxWithChat).chat?.id;
      if (!chatId) return;
      const managerR = await telegramRepo.getManagerByChatId(chatId);
      if (!managerR.ok || !managerR.data) { await ctx.reply('⚠️ Siz menejer sifatida topilmadingiz.'); return; }
      const reportsR = await telegramRepo.getDailyReportStatusForManager(managerR.data['id'] as number);
      const data = reportsR.ok ? reportsR.data : { submitted: 0, missing: 0, total: 0 };
      await ctx.reply(
        `📊 <b>Kundalik hisobot holati</b>\n\n` +
        `✅ Topshirganlar: ${String(data['submitted'] ?? 0)}\n` +
        `❌ Topshirmaganlar: ${String(data['missing'] ?? 0)}\n` +
        `👥 Jami: ${String(data['total'] ?? 0)}`,
        { parse_mode: 'HTML' },
      );
    } catch (err) {
      logger.error(`/reports error: ${errMsg(err)}`);
      await ctx.reply('Xatolik yuz berdi, iltimos qayta urinib ko\'ring').catch(() => undefined);
    }
  });
}

export function registerKpiAlertsCommands(bot: Telegraf<Context>, deps: HandlersDeps): void {
  const { telegramRepo, logger } = deps;
  bot.command('kpi', async (ctx: Context) => {
    try {
      const chatId = (ctx as CtxWithChat).chat?.id;
      if (!chatId) return;
      const managerR = await telegramRepo.getManagerByChatId(chatId);
      if (!managerR.ok || !managerR.data) { await ctx.reply('⚠️ Siz menejer sifatida topilmadingiz.'); return; }
      const kpiR = await telegramRepo.getDepartmentKpi(managerR.data['department_id'] as number);
      const kpi = kpiR.ok ? kpiR.data : null;
      if (!kpi) { await ctx.reply('📈 KPI ma\'lumotlari hozircha mavjud emas.'); return; }
      await ctx.reply(
        `📈 <b>Bo\'lim KPI (oxirgi 30 kun)</b>\n\n` +
        `⏰ O\'rtacha kechikish: ${String(kpi['avg_late_minutes'] ?? 0)} daqiqa\n` +
        `📊 Hisobot to\'ldirish darajasi: ${String(kpi['report_rate'] ?? 0)}%\n` +
        `✅ Davomat darajasi: ${String(kpi['attendance_rate'] ?? 0)}%\n` +
        `🎯 Maqsadlar bajarilishi: ${String(kpi['goals_completion'] ?? 0)}%`,
        { parse_mode: 'HTML' },
      );
    } catch (err) {
      logger.error(`/kpi error: ${errMsg(err)}`);
      await ctx.reply('Xatolik yuz berdi, iltimos qayta urinib ko\'ring').catch(() => undefined);
    }
  });

  bot.command('alerts', async (ctx: Context) => {
    try {
      const chatId = (ctx as CtxWithChat).chat?.id;
      if (!chatId) return;
      const managerR = await telegramRepo.getManagerByChatId(chatId);
      if (!managerR.ok || !managerR.data) { await ctx.reply('⚠️ Siz menejer sifatida topilmadingiz.'); return; }
      const alertsR = await telegramRepo.getManagerAlerts(managerR.data['id'] as number);
      const alerts = alertsR.ok ? alertsR.data : [];
      if (!alerts.length) { await ctx.reply('✅ Joriy ogohlantirishlar yo\'q.'); return; }
      const lines = alerts.slice(0, 15).map(a => {
        const icon = a['type'] === 'late' ? '⏰' : a['type'] === 'absent' ? '❌' : a['type'] === 'doc_overdue' ? '📄' : '⚠️';
        return `${icon} ${String(a['message'] ?? '')}`;
      });
      await ctx.reply(`🚨 <b>Joriy ogohlantirishlar</b>\n\n${lines.join('\n')}`, { parse_mode: 'HTML' });
    } catch (err) {
      logger.error(`/alerts error: ${errMsg(err)}`);
      await ctx.reply('Xatolik yuz berdi, iltimos qayta urinib ko\'ring').catch(() => undefined);
    }
  });
}
