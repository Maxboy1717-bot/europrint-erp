/**
 * @module attendance-bot-commands.helpers
 * @description Command/action registration helpers split from attendance-bot.service.ts (Rule 16).
 */

import type { Telegraf, Context } from 'telegraf';
import { message } from 'telegraf/filters';
import { errMsg } from '../hr-v2-error';
import type { Logger } from '@nestjs/common';
import type { TelegramBotsRepository } from './telegram-bots.repository';

type CtxWithChat = Context & { chat?: { id?: number } };
type CtxWithMsg = CtxWithChat & { message?: { text?: string } };

export type AttendanceStep = 'awaiting_phone' | 'awaiting_absence_reason' | 'awaiting_departure_reason';

export interface AttendanceSession {
  step: AttendanceStep;
  employeeId?: number;
}

export type Sessions = Map<number, AttendanceSession>;
export type PendingLate = Map<number, number>;

export async function handlePhoneLink(
  ctx: Context,
  chatId: number,
  phone: string,
  repo: TelegramBotsRepository,
  sessions: Sessions,
): Promise<void> {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 9) {
    await ctx.reply('⚠️ Noto\'g\'ri telefon raqami. Masalan: +998901234567');
    return;
  }
  const empR = await repo.findEmployeeByPhone(digits);
  if (!empR.ok || !empR.data) {
    await ctx.reply('⚠️ Bu raqam tizimda topilmadi. HR bo\'limiga murojaat qiling.');
    return;
  }
  const emp = empR.data;
  if (emp['status'] !== 'active') {
    await ctx.reply('⚠️ Siz faol xodim sifatida topilmadingiz.');
    return;
  }
  await repo.linkEmployeeChatId(emp['id'] as number, chatId);
  sessions.delete(chatId);
  await ctx.reply(
    `✅ <b>Muvaffaqiyatli ulandi!</b>\n\n` +
    `👤 ${String(emp['first_name'])} ${String(emp['last_name'])}\n\n` +
    'Davomat ma\'lumotlaringiz endi ushbu bot orqali yetkaziladi.',
    { parse_mode: 'HTML' },
  );
}

export function registerStartAndActions(
  bot: Telegraf<Context>,
  sessions: Sessions,
  repo: TelegramBotsRepository,
  logger: Logger,
): void {
  bot.command('start', async (ctx: Context) => {
    try {
      const chatId = (ctx as CtxWithChat).chat?.id;
      if (!chatId) return;
      sessions.delete(chatId);
      const existingR = await repo.getEmployeeByChatId(chatId);
      if (existingR.ok && existingR.data) {
        const emp = existingR.data;
        await ctx.reply(
          `📅 <b>EuroPrint Davomat Bot</b>\n\n` +
          `Xush kelibsiz, ${String(emp['first_name'])} ${String(emp['last_name'])}!\n\n` +
          'Davomat ma\'lumotlaringiz avtomatik yuboriladi.\n' +
          'Kechikish yoki yo\'qlik haqida xabar kelsa, javob bering.',
          { parse_mode: 'HTML' },
        );
      } else {
        sessions.set(chatId, { step: 'awaiting_phone' });
        await ctx.reply(
          '📅 <b>EuroPrint Davomat Bot</b>\n\n' +
          'Hisobingizni ulash uchun telefon raqamingizni yuboring:\n' +
          '(Masalan: +998901234567)',
          { parse_mode: 'HTML' },
        );
      }
    } catch (err) {
      logger.error(`/start error: ${errMsg(err)}`);
      await ctx.reply('Xatolik yuz berdi, iltimos qayta urinib ko\'ring').catch(() => undefined);
    }
  });

  bot.action('present_yes', async (ctx) => {
    try {
      const chatId = (ctx as CtxWithChat).chat?.id;
      if (!chatId) return;
      await repo.recordManualAttendance(chatId, 'present');
      await ctx.answerCbQuery('✅ Qayd etildi!');
      await ctx.editMessageText('✅ Siz bugun ishda ekanligingiz qayd etildi.');
    } catch (err) {
      logger.error(`present_yes error: ${errMsg(err)}`);
      await ctx.answerCbQuery('Xatolik yuz berdi').catch(() => undefined);
    }
  });

  bot.action('present_no', async (ctx) => {
    try {
      const chatId = (ctx as CtxWithChat).chat?.id;
      if (!chatId) return;
      const empR = await repo.getEmployeeByChatId(chatId);
      if (empR.ok && empR.data) {
        sessions.set(chatId, { step: 'awaiting_absence_reason', employeeId: empR.data['id'] as number });
      }
      await ctx.answerCbQuery('Sabab kiriting');
      await ctx.editMessageText('❓ Nima sababdan kela olmadingiz? Iltimos, sababni yozing:');
    } catch (err) {
      logger.error(`present_no error: ${errMsg(err)}`);
      await ctx.answerCbQuery('Xatolik yuz berdi').catch(() => undefined);
    }
  });

  bot.action('absent_sick', async (ctx) => {
    try {
      const chatId = (ctx as CtxWithChat).chat?.id;
      if (!chatId) return;
      await repo.recordManualAttendance(chatId, 'absent', 'Kasal');
      await ctx.answerCbQuery('Qayd etildi');
      await ctx.editMessageText('🏥 Kasallik sababli yo\'qligingiz qayd etildi. Tezroq tuzalib keting!');
    } catch (err) {
      logger.error(`absent_sick error: ${errMsg(err)}`);
      await ctx.answerCbQuery('Xatolik').catch(() => undefined);
    }
  });

  bot.action('absent_other', async (ctx) => {
    try {
      const chatId = (ctx as CtxWithChat).chat?.id;
      if (!chatId) return;
      const empR = await repo.getEmployeeByChatId(chatId);
      if (empR.ok && empR.data) {
        sessions.set(chatId, { step: 'awaiting_absence_reason', employeeId: empR.data['id'] as number });
      }
      await ctx.answerCbQuery('Sabab kiriting');
      await ctx.editMessageText('📝 Sababni yozing:');
    } catch (err) {
      logger.error(`absent_other error: ${errMsg(err)}`);
      await ctx.answerCbQuery('Xatolik').catch(() => undefined);
    }
  });

  bot.action('absent_forgot', async (ctx) => {
    try {
      const chatId = (ctx as CtxWithChat).chat?.id;
      if (!chatId) return;
      await repo.recordManualAttendance(chatId, 'absent', 'Esdan chiqdi');
      await ctx.answerCbQuery('Qayd etildi');
      await ctx.editMessageText('⚠️ Yo\'qligingiz qayd etildi. Keyingi safar HR bilan oldindan kelishib oling.');
    } catch (err) {
      logger.error(`absent_forgot error: ${errMsg(err)}`);
      await ctx.answerCbQuery('Xatolik').catch(() => undefined);
    }
  });
}

export function registerTextHandler(
  bot: Telegraf<Context>,
  sessions: Sessions,
  pendingLateReasons: PendingLate,
  repo: TelegramBotsRepository,
  logger: Logger,
): void {
  bot.on(message('text' as never), async (ctx: Context) => {
    try {
      const chatId = (ctx as CtxWithChat).chat?.id;
      const text = ((ctx as CtxWithMsg).message?.text ?? '').trim();
      if (!chatId || text.startsWith('/')) return;

      const session = sessions.get(chatId);

      if (session?.step === 'awaiting_phone') {
        await handlePhoneLink(ctx, chatId, text, repo, sessions);
        return;
      }

      const lateEmpId = pendingLateReasons.get(chatId);
      if (lateEmpId !== undefined) {
        if (text.length < 30) {
          await ctx.reply(`❌ Sabab juda qisqa (${text.length} ta belgi). Kamida 30 ta belgi yozing:`);
          return;
        }
        pendingLateReasons.delete(chatId);
        await repo.recordLateReason(lateEmpId, text);
        await ctx.reply('✅ Kechikish sababingiz qayd etildi. Rahmat!');
        return;
      }

      if (!session) return;

      if (session.step === 'awaiting_absence_reason') {
        if (text.length < 5) {
          await ctx.reply('⚠️ Sabab juda qisqa. Batafsilroq yozing:');
          return;
        }
        await repo.recordManualAttendance(chatId, 'absent', text);
        sessions.delete(chatId);
        await ctx.reply('✅ Yo\'qligingiz sababi qayd etildi.');
      } else if (session.step === 'awaiting_departure_reason') {
        await repo.recordDepartureReason(chatId, text);
        sessions.delete(chatId);
        await ctx.reply('✅ Chiqish sababingiz qayd etildi.');
      }
    } catch (err) {
      logger.error(`text handler error: ${errMsg(err)}`);
      await ctx.reply('Xatolik yuz berdi, iltimos qayta urinib ko\'ring').catch(() => undefined);
    }
  });
}
