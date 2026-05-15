/**
 * @module attendance-bot.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 *
 * Rule 16: Command/action handlers live in attendance-bot-commands.helpers.ts.
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
import {
  AttendanceSession, Sessions, PendingLate,
  registerStartAndActions, registerTextHandler,
} from './attendance-bot-commands.helpers';

@Injectable()
export class AttendanceBotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AttendanceBotService.name);
  private bot: Telegraf<Context> | null = null;
  private readonly token: string | undefined;
  private sessions: Sessions = new Map<number, AttendanceSession>();
  private pendingLateReasons: PendingLate = new Map<number, number>();

  constructor(
    private readonly telegramRepo: TelegramBotsRepository,
    private readonly cfg: ConfigService,
    private readonly notifBot: NotificationBotService,
  ) {
    this.token = this.cfg.get<string>('TELEGRAM_ATTENDANCE_BOT_TOKEN');
  }

  onModuleInit(): void {
    this._initBackground().catch((e) => this.logger.warn('[attendance-bot.service] init failed: ' + e));
  }

  private async _initBackground(): Promise<void> {
    await safeCall(async () => {
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
    registerStartAndActions(bot, this.sessions, this.telegramRepo, this.logger);
    registerTextHandler(bot, this.sessions, this.pendingLateReasons, this.telegramRepo, this.logger);
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
