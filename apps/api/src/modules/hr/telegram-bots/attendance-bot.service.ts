/**
 * @module attendance-bot.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { Result, AppError, safeCall } from '@common/result';
import { errMsg } from '../hr-v2-error';
import { TelegramBotsRepository } from './telegram-bots.repository';
import { NotificationBotService } from './notification-bot.service';
import type { Telegraf, Context } from 'telegraf';

type CtxWithChat = Context & { chat?: { id?: number } };
type CtxWithMsg = CtxWithChat & { message?: { text?: string } };

type AttendanceStep = 'awaiting_phone' | 'awaiting_absence_reason' | 'awaiting_departure_reason';

interface AttendanceSession {
  step: AttendanceStep;
  employeeId?: number;
}

@Injectable()
export class AttendanceBotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AttendanceBotService.name);
  private bot: Telegraf<Context> | null = null;
  private readonly token: string | undefined;
  private sessions = new Map<number, AttendanceSession>();
  private pendingLateReasons = new Map<number, number>();

  constructor(
    private readonly telegramRepo: TelegramBotsRepository,
    private readonly cfg: ConfigService,
    private readonly notifBot: NotificationBotService,
  ) {
    this.token = this.cfg.get<string>('TELEGRAM_ATTENDANCE_BOT_TOKEN');
  }

  onModuleInit(): void { this._initBackground().catch((e) => this.logger.warn('[attendance-bot.service] init failed: ' + e)); }
  private async _initBackground(): Promise<void> {
    return safeCall(async () => {
      if (!this.token) {
        this.logger.warn('Attendance Bot token not configured (TELEGRAM_ATTENDANCE_BOT_TOKEN missing) — skipping');
        return;
      }
      try {
        const { Telegraf: TelegrafClass } = await import('telegraf');
        this.bot = new TelegrafClass(this.token) as Telegraf<Context>;
        this.registerCommands(this.bot);
        this.bot.launch().catch((err: Error) => this.logger.error(`Attendance Bot launch error: ${errMsg(err)}`));
        this.logger.log('Attendance Bot started');
      } catch (err) {
        this.logger.error(`Failed to initialize Attendance Bot: ${err instanceof Error ? errMsg(err) : String(err)}`);
      }
    });
  }

  async onModuleDestroy(): Promise<void> {
    this.bot?.stop('Attendance Bot stopped');
  }

  private registerCommands(bot: Telegraf<Context>): void {
    bot.command('start', async (ctx: Context) => {
      try {
        const chatId = (ctx as CtxWithChat).chat?.id;
        if (!chatId) return;
        this.sessions.delete(chatId);

        const existingR = await this.telegramRepo.getEmployeeByChatId(chatId);
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
          this.sessions.set(chatId, { step: 'awaiting_phone' });
          await ctx.reply(
            '📅 <b>EuroPrint Davomat Bot</b>\n\n' +
            'Hisobingizni ulash uchun telefon raqamingizni yuboring:\n' +
            '(Masalan: +998901234567)',
            { parse_mode: 'HTML' },
          );
        }
      } catch (err) {
        this.logger.error(`/start error: ${errMsg(err)}`);
        await ctx.reply('Xatolik yuz berdi, iltimos qayta urinib ko\'ring').catch(() => undefined);
      }
    });

    bot.action('present_yes', async (ctx) => {
      try {
        const chatId = (ctx as CtxWithChat).chat?.id;
        if (!chatId) return;
        await this.telegramRepo.recordManualAttendance(chatId, 'present');
        await ctx.answerCbQuery('✅ Qayd etildi!');
        await ctx.editMessageText('✅ Siz bugun ishda ekanligingiz qayd etildi.');
      } catch (err) {
        this.logger.error(`present_yes error: ${errMsg(err)}`);
        await ctx.answerCbQuery('Xatolik yuz berdi').catch(() => undefined);
      }
    });

    bot.action('present_no', async (ctx) => {
      try {
        const chatId = (ctx as CtxWithChat).chat?.id;
        if (!chatId) return;
        const empR = await this.telegramRepo.getEmployeeByChatId(chatId);
        if (empR.ok && empR.data) {
          this.sessions.set(chatId, { step: 'awaiting_absence_reason', employeeId: empR.data['id'] as number });
        }
        await ctx.answerCbQuery('Sabab kiriting');
        await ctx.editMessageText('❓ Nima sababdan kela olmadingiz? Iltimos, sababni yozing:');
      } catch (err) {
        this.logger.error(`present_no error: ${errMsg(err)}`);
        await ctx.answerCbQuery('Xatolik yuz berdi').catch(() => undefined);
      }
    });

    bot.action('absent_sick', async (ctx) => {
      try {
        const chatId = (ctx as CtxWithChat).chat?.id;
        if (!chatId) return;
        await this.telegramRepo.recordManualAttendance(chatId, 'absent', 'Kasal');
        await ctx.answerCbQuery('Qayd etildi');
        await ctx.editMessageText('🏥 Kasallik sababli yo\'qligingiz qayd etildi. Tezroq tuzalib keting!');
      } catch (err) {
        this.logger.error(`absent_sick error: ${errMsg(err)}`);
        await ctx.answerCbQuery('Xatolik').catch(() => undefined);
      }
    });

    bot.action('absent_other', async (ctx) => {
      try {
        const chatId = (ctx as CtxWithChat).chat?.id;
        if (!chatId) return;
        const empR = await this.telegramRepo.getEmployeeByChatId(chatId);
        if (empR.ok && empR.data) {
          this.sessions.set(chatId, { step: 'awaiting_absence_reason', employeeId: empR.data['id'] as number });
        }
        await ctx.answerCbQuery('Sabab kiriting');
        await ctx.editMessageText('📝 Sababni yozing:');
      } catch (err) {
        this.logger.error(`absent_other error: ${errMsg(err)}`);
        await ctx.answerCbQuery('Xatolik').catch(() => undefined);
      }
    });

    bot.action('absent_forgot', async (ctx) => {
      try {
        const chatId = (ctx as CtxWithChat).chat?.id;
        if (!chatId) return;
        await this.telegramRepo.recordManualAttendance(chatId, 'absent', 'Esdan chiqdi');
        await ctx.answerCbQuery('Qayd etildi');
        await ctx.editMessageText('⚠️ Yo\'qligingiz qayd etildi. Keyingi safar HR bilan oldindan kelishib oling.');
      } catch (err) {
        this.logger.error(`absent_forgot error: ${errMsg(err)}`);
        await ctx.answerCbQuery('Xatolik').catch(() => undefined);
      }
    });

    bot.on('text', async (ctx: Context) => {
      try {
        const chatId = (ctx as CtxWithChat).chat?.id;
        const text = ((ctx as CtxWithMsg).message?.text ?? '').trim();
        if (!chatId || text.startsWith('/')) return;

        const session = this.sessions.get(chatId);

        if (session?.step === 'awaiting_phone') {
          await this.handlePhoneLink(ctx, chatId, text);
          return;
        }

        const lateEmpId = this.pendingLateReasons.get(chatId);
        if (lateEmpId !== undefined) {
          if (text.length < 30) {
            await ctx.reply(`❌ Sabab juda qisqa (${text.length} ta belgi). Kamida 30 ta belgi yozing:`);
            return;
          }
          this.pendingLateReasons.delete(chatId);
          await this.telegramRepo.recordLateReason(lateEmpId, text);
          await ctx.reply('✅ Kechikish sababingiz qayd etildi. Rahmat!');
          return;
        }

        if (!session) return;

        if (session.step === 'awaiting_absence_reason') {
          if (text.length < 5) {
            await ctx.reply('⚠️ Sabab juda qisqa. Batafsilroq yozing:');
            return;
          }
          await this.telegramRepo.recordManualAttendance(chatId, 'absent', text);
          this.sessions.delete(chatId);
          await ctx.reply('✅ Yo\'qligingiz sababi qayd etildi.');
        } else if (session.step === 'awaiting_departure_reason') {
          await this.telegramRepo.recordDepartureReason(chatId, text);
          this.sessions.delete(chatId);
          await ctx.reply('✅ Chiqish sababingiz qayd etildi.');
        }
      } catch (err) {
        this.logger.error(`text handler error: ${errMsg(err)}`);
        await ctx.reply('Xatolik yuz berdi, iltimos qayta urinib ko\'ring').catch(() => undefined);
      }
    });
  }

  private async handlePhoneLink(ctx: Context, chatId: number, phone: string): Promise<void> {
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
    await this.telegramRepo.linkEmployeeChatId(emp['id'] as number, chatId);
    this.sessions.delete(chatId);
    await ctx.reply(
      `✅ <b>Muvaffaqiyatli ulandi!</b>\n\n` +
      `👤 ${String(emp['first_name'])} ${String(emp['last_name'])}\n\n` +
      'Davomat ma\'lumotlaringiz endi ushbu bot orqali yetkaziladi.',
      { parse_mode: 'HTML' },
    );
  }

  async sendMorningCheckQuery(chatId: number | string): Promise<Result<void, AppError>> {
    return safeCall(async () => {
      if (!this.bot) return;
      const { Markup } = await import('telegraf');
      const today = _time.now().toISOString().split('T')[0];
      await this.bot.telegram.sendMessage(
        chatId,
        `☀️ <b>Bugungi davomat tekshiruvi</b>\n📅 ${today}\n\nSiz bugun keldingizmi?`,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('✅ Ha, keldim', 'present_yes'), Markup.button.callback('❌ Yo\'q — sabab', 'present_no')],
          ]),
        },
      );
    });
  }

  async sendAbsenceDay1(chatId: number | string, date: string): Promise<Result<void, AppError>> {
    return safeCall(async () => {
      if (!this.bot) return;
      const { Markup } = await import('telegraf');
      await this.bot.telegram.sendMessage(
        chatId,
        `❓ <b>Siz bugun kelmadingiz</b>\n📅 Sana: ${date}\n\nNega kelmadingiz?`,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🏥 Kasal', 'absent_sick'), Markup.button.callback('📝 Boshqa sabab', 'absent_other')],
            [Markup.button.callback('😔 Esdan chiqdi', 'absent_forgot')],
          ]),
        },
      );
    });
  }

  async sendAbsenceDay2(chatId: number | string, hrPhone: string): Promise<Result<void, AppError>> {
    return safeCall(async () => {
      if (!this.bot) return;
      await this.bot.telegram.sendMessage(
        chatId,
        `⚠️ <b>Ikkinchi kun yo'qlik</b>\n\nSiz ketma-ket 2 kun ishga kelmadingiz.\n\nBu oxirgi ogohlantirish — HR bilan bog'laning: ${hrPhone}\nYoki ERP orqali: https://erp.europrint.uz`,
        { parse_mode: 'HTML' },
      );
    });
  }

  async sendAbsenceBlocked(chatId: number | string, hrPhone: string): Promise<Result<void, AppError>> {
    return safeCall(async () => {
      if (!this.bot) return;
      await this.bot.telegram.sendMessage(
        chatId,
        `⛔ <b>Siz bloklangansiz</b>\n\n3 va undan ortiq kun ishga kelmadingiz.\nERP kirishingiz vaqtincha bloklandi.\n\nHR bo'limi bilan bog'laning: ${hrPhone}`,
        { parse_mode: 'HTML' },
      );
    });
  }

  async sendLateArrivalPrompt(chatId: number | string, employeeId: number, lateMinutes: number): Promise<Result<void, AppError>> {
    return safeCall(async () => {
      if (!this.bot) return;
      const chatIdNum = typeof chatId === 'string' ? parseInt(chatId, 10) : chatId;
      this.pendingLateReasons.set(chatIdNum, employeeId);
      await this.bot.telegram.sendMessage(
        chatId,
        `⏰ <b>Kechikish qayd etildi</b>\n\nSiz ${lateMinutes} daqiqa kech keldingiz.\n\n❓ Kechikish sababini yozing (kamida 30 ta belgi):`,
        { parse_mode: 'HTML' },
      );
    });
  }

  async sendDeparturePrompt(chatId: number | string): Promise<Result<void, AppError>> {
    return safeCall(async () => {
      if (!this.bot) return;
      const chatIdNum = typeof chatId === 'string' ? parseInt(chatId, 10) : chatId;
      this.sessions.set(chatIdNum, { step: 'awaiting_departure_reason' });
      await this.bot.telegram.sendMessage(
        chatId,
        '🚶 <b>Ish vaqtida chiqish</b>\n\nQayerga ketdingiz? Taxminiy qaytish vaqtini ham yozing:',
        { parse_mode: 'HTML' },
      );
    });
  }

  @OnEvent('attendance.late_arrival')
  async onLateArrival(payload: { employeeId: number; lateMinutes: number; arrivalTime: string }): Promise<void> {
    try {
      await this.notifBot.sendNotification({
        userId: payload.employeeId,
        templateKey: 'LATE_ARRIVAL_REASON',
        params: {
          late_minutes: String(payload.lateMinutes),
          arrival_time: payload.arrivalTime ?? '',
          date: new Date().toLocaleDateString('uz'),
        },
      });
      const chatIdR = await this.telegramRepo.getEmployeeTelegramChatId(payload.employeeId);
      const chatId = chatIdR.ok ? chatIdR.data : null;
      if (chatId) await this.sendLateArrivalPrompt(chatId, payload.employeeId, payload.lateMinutes);
    } catch (err) {
      this.logger.warn(`onLateArrival error: ${errMsg(err)}`);
    }
  }

  @OnEvent('attendance.early_departure')
  async onEarlyDeparture(payload: { employeeId: number }): Promise<void> {
    try {
      const chatIdR = await this.telegramRepo.getEmployeeTelegramChatId(payload.employeeId);
      const chatId = chatIdR.ok ? chatIdR.data : null;
      if (!chatId) return;
      await this.sendDeparturePrompt(chatId);
    } catch (err) {
      this.logger.warn(`onEarlyDeparture error: ${errMsg(err)}`);
    }
  }

  @OnEvent('attendance.employee_blocked')
  async onEmployeeBlocked(payload: { employeeId: number }): Promise<void> {
    try {
      const hrPhone = this.cfg.get<string>('HR_PHONE') ?? '+998900000000';
      await this.notifBot.sendNotification({
        userId: payload.employeeId,
        templateKey: 'ABSENCE_BLOCKED',
        params: { hr_phone: hrPhone },
      });
      const chatIdR = await this.telegramRepo.getEmployeeTelegramChatId(payload.employeeId);
      const chatId = chatIdR.ok ? chatIdR.data : null;
      if (chatId) await this.sendAbsenceBlocked(chatId, hrPhone);
    } catch (err) {
      this.logger.warn(`onEmployeeBlocked error: ${errMsg(err)}`);
    }
  }

  async sendMessage(chatId: number | string, message: string): Promise<boolean> {
    return safeCall(async () => {
      if (!this.bot) return false;
      await this.bot.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' });
      return true;
    }).then(r => (r.ok ? r.data : false));
  }

  getInstance(): Telegraf<Context> | null {
    return this.bot;
  }
}
