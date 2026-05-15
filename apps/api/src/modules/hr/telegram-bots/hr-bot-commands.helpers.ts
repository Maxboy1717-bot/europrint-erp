/**
 * @module hr-bot-commands.helpers
 * @description Command registration helpers split from hr-bot.service.ts (Rule 16).
 * Profile commands live in hr-bot-profile.helpers.ts (re-exported below).
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import type { Telegraf, Context } from 'telegraf';
import { message } from 'telegraf/filters';
import {
  HrSession, SickSession, LeaveSession, MENU_TEXT,
  getEmployeeInfo, getLeaveBalance, saveSickReport, getDailyReportStatus,
  handleSickFlow, handleLeaveFlow,
} from './hr-bot-helpers';

export { registerProfileCommands } from './hr-bot-profile.helpers';

type Sessions = Map<number, HrSession>;

export function registerBasicCommands(bot: Telegraf<Context>, sessions: Sessions): void {
  bot.command('start', async (ctx: Context) => {
    const chat = (ctx as Context & { chat?: { id?: number } }).chat;
    if (chat?.id) sessions.delete(chat.id);
    await ctx.reply(MENU_TEXT, { parse_mode: 'HTML' });
  });

  bot.command('bekor', async (ctx: Context) => {
    const chat = (ctx as Context & { chat?: { id?: number } }).chat;
    if (chat?.id) sessions.delete(chat.id);
    await ctx.reply('❌ Amal bekor qilindi.\n\n' + MENU_TEXT, { parse_mode: 'HTML' });
  });

  bot.command('kasalman', async (ctx: Context) => {
    const chat = (ctx as Context & { chat?: { id?: number } }).chat;
    if (!chat?.id) return;
    sessions.set(chat.id, { flow: 'sick', step: 'awaiting_days' });
    await ctx.reply(
      '🏥 <b>Kasallik varaqasi topshirish</b>\n\n' +
      'Qancha kun kasal bo\'ldingiz? (raqam kiriting, masalan: 3)\n\n' +
      '/bekor — bekor qilish',
      { parse_mode: 'HTML' }
    );
  });

  bot.command('tatil', async (ctx: Context) => {
    const chat = (ctx as Context & { chat?: { id?: number } }).chat;
    if (!chat?.id) return;
    const emp = await getEmployeeInfo(chat.id);
    if (!emp) {
      await ctx.reply('⚠️ Siz ERP tizimida topilmadingiz. Telegram chat ID ni HR bo\'limiga yuboring.');
      return;
    }
    const balance = await getLeaveBalance(emp.id);
    sessions.set(chat.id, { flow: 'leave', step: 'awaiting_start' });
    await ctx.reply(
      `🌴 <b>Ta'til ma'lumotlari</b>\n\n` +
      `📅 Qolgan ta'til kuningiz: <b>${balance} kun</b>\n\n` +
      `Ta'til boshlanish sanasini kiriting (YYYY-MM-DD):\n` +
      `Masalan: ${_time.now().toISOString().split('T')[0]}\n\n/bekor — bekor qilish`,
      { parse_mode: 'HTML' }
    );
  });

  bot.command('hisobot', async (ctx: Context) => {
    const chat = (ctx as Context & { chat?: { id?: number } }).chat;
    if (!chat?.id) return;
    const emp = await getEmployeeInfo(chat.id);
    if (!emp) {
      const today = _time.now().toISOString().split('T')[0];
      await ctx.reply(
        `📊 <b>Kunlik hisobot (${today})</b>\n\nHisobot topshirish uchun: <a href="https://erp.europrint.uz">erp.europrint.uz</a>`,
        { parse_mode: 'HTML' }
      );
      return;
    }
    const status = await getDailyReportStatus(emp.id);
    const today = _time.now().toISOString().split('T')[0];
    const statusText = status === 'submitted'
      ? '✅ Bugun topshirilgan'
      : status === 'absent'
        ? '❌ O\'tkazib yuborilgan (auto-absent)'
        : '⏳ Hali topshirilmagan (20:00 gacha)';
    await ctx.reply(
      `📊 <b>Kunlik hisobot holati</b>\n\n` +
      `📅 Sana: ${today}\n${statusText}\n\n` +
      `Hisobot topshirish uchun:\n<a href="https://erp.europrint.uz">erp.europrint.uz</a>`,
      { parse_mode: 'HTML' }
    );
  });
}

export function registerSickFlowHandlers(bot: Telegraf<Context>, sessions: Sessions): void {
  bot.command('skip', async (ctx: Context) => {
    type TCtx = Context & { chat?: { id?: number } };
    const chatId = (ctx as TCtx).chat?.id;
    if (!chatId) return;

    const session = sessions.get(chatId);
    if (!session || session.flow !== 'sick' || session.step !== 'awaiting_document') {
      await ctx.reply('⚠️ /skip faqat hujjat yuklash bosqichida ishlaydi.');
      return;
    }

    const empSkip = await getEmployeeInfo(chatId);
    if (!empSkip) {
      await ctx.reply('⚠️ Siz ERP tizimida topilmadingiz. HR bo\'limiga murojaat qiling.');
      sessions.delete(chatId);
      return;
    }
    const savedSkip = await saveSickReport(empSkip.id, (session as SickSession).days ?? 0, (session as SickSession).reason ?? '');
    if (!savedSkip) {
      await ctx.reply('⚠️ Texnik xatolik yuz berdi. Iltimos, qayta urinib ko\'ring yoki HR bo\'limiga murojaat qiling.');
      return;
    }
    sessions.delete(chatId);
    await ctx.reply(
      `✅ <b>Kasallik ma'lumoti qabul qilindi!</b>\n\n` +
      `📅 Kun soni: ${(session as SickSession).days}\n` +
      `📝 Sabab: ${(session as SickSession).reason}\n` +
      `📄 Hujjat: Yuklanmagan\n\n` +
      `HR bo'limi ko'rib chiqadi.`,
      { parse_mode: 'HTML' }
    );
  });

  bot.on(message('document' as never), async (ctx: Context) => {
    type DocCtx = Context & {
      chat?: { id?: number };
      message?: { document?: { file_name?: string; file_id?: string } };
    };
    const docCtx = ctx as DocCtx;
    const chatId = docCtx.chat?.id;
    if (!chatId) return;
    const session = sessions.get(chatId);
    if (!session || session.flow !== 'sick' || session.step !== 'awaiting_document') return;

    const doc = docCtx.message?.document;
    const fileId = doc?.file_id;
    const fileName = doc?.file_name ?? 'hujjat';

    const emp = await getEmployeeInfo(chatId);
    if (!emp) {
      await ctx.reply('⚠️ Siz ERP tizimida topilmadingiz. HR bo\'limiga murojaat qiling.');
      sessions.delete(chatId);
      return;
    }
    const savedDoc = await saveSickReport(emp.id, (session as SickSession).days ?? 0, (session as SickSession).reason ?? '', fileId);
    if (!savedDoc) {
      await ctx.reply('⚠️ Texnik xatolik yuz berdi. Iltimos, qayta urinib ko\'ring yoki HR bo\'limiga murojaat qiling.');
      return;
    }
    sessions.delete(chatId);
    await ctx.reply(
      `✅ <b>Kasallik varaqasi qabul qilindi!</b>\n\n` +
      `📄 Hujjat: ${fileName}\n` +
      `📅 Kun soni: ${(session as SickSession).days}\n` +
      `📝 Sabab: ${(session as SickSession).reason}\n\n` +
      `HR bo'limi ko'rib chiqadi va tasdiqlaydi.`,
      { parse_mode: 'HTML' }
    );
  });

  bot.on(message('text' as never), async (ctx: Context) => {
    type TxtCtx = Context & { chat?: { id?: number }; message?: { text?: string } };
    const tCtx = ctx as TxtCtx;
    const chatId = tCtx.chat?.id;
    const text = tCtx.message?.text ?? '';
    if (!chatId || text.startsWith('/')) return;
    const session = sessions.get(chatId);
    if (!session) {
      await ctx.reply('Buyruq tanlang:\n\n' + MENU_TEXT, { parse_mode: 'HTML' });
      return;
    }
    if (session.flow === 'sick') {
      await handleSickFlow(ctx, chatId, text, session as SickSession, sessions);
    } else if (session.flow === 'leave') {
      await handleLeaveFlow(ctx, chatId, text, session as LeaveSession, sessions);
    }
  });
}
