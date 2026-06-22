/**
 * @module report-bot.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Result, AppError, safeCall } from '@common/result';
import { errMsg } from '../hr-v2-error';
import { ReportBotDataService } from './report-bot-data.service';
import type { Telegraf, Context } from 'telegraf';
import { message } from 'telegraf/filters';
import { ReportBotDataRepository } from './report-bot-data.repository';

type ReportStep = 'awaiting_q1' | 'awaiting_q2' | 'awaiting_q3';

interface ReportSession {
  employeeId: number;
  reportDate: string;
  step: ReportStep;
  q1?: string;
  q2?: string;
}

@Injectable()
export class ReportBotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReportBotService.name);
  private bot: Telegraf<Context> | null = null;
  private readonly token: string | undefined;
  private sessions = new Map<number, ReportSession>();

  constructor(
    private readonly dataSvc: ReportBotDataService,
    private readonly repo: ReportBotDataRepository,
    private readonly cfg: ConfigService,
  ) {
    this.token = this.cfg.get<string>('TELEGRAM_REPORT_BOT_TOKEN');
  }

  onModuleInit(): void { this._initBackground().catch((e) => this.logger.warn('[report-bot.service] init failed: ' + e)); }
  private async _initBackground(): Promise<void> {
    await safeCall(async () => {
      if (!this.token) {
        this.logger.warn('Report Bot token not configured (TELEGRAM_REPORT_BOT_TOKEN missing) — skipping');
        return;
      }
      try {
        const { Telegraf: TelegrafClass } = await import('telegraf');
        this.bot = new TelegrafClass(this.token) as Telegraf<Context>;
        this.registerCommands(this.bot);
        this.bot.launch().catch((err: Error) => this.logger.error(`Report Bot launch error: ${errMsg(err)}`));
        this.logger.log('Report Bot started');
      } catch (err) {
        this.logger.error(`Failed to initialize Report Bot: ${err instanceof Error ? errMsg(err) : String(err)}`);
      }
    });
  }

  async onModuleDestroy() {
    this.bot?.stop('Report Bot stopped');
  }

  private registerCommands(bot: Telegraf<Context>) {
    bot.command('start', async (ctx: Context) => {
      await ctx.reply(
        '📊 <b>EuroPrint Report Bot</b>\n\n' +
        'Buyruqlar:\n' +
        '/hisobot — Kunlik hisobot topshirish\n' +
        '/statistika — Bugungi statistika',
        { parse_mode: 'HTML' }
      );
    });

    bot.command('hisobot', async (ctx: Context) => {
      type TCtx = Context & { chat?: { id?: number } };
      const chatId = (ctx as TCtx).chat?.id;
      if (!chatId) return;

      // Hard deadline check: no new submissions after 16:00
      if (this.dataSvc.isDeadlinePassed()) {
        await ctx.reply(
          '⛔ Hisobot topshirish muddati tugadi (soat 16:00).\n\n' +
          'Ertaga 15:30 dan keyin topshirishingiz mumkin.'
        );
        return;
      }

      const emp = await this.dataSvc.getEmployeeInfo(chatId);
      if (!emp) {
        await ctx.reply(
          '⚠️ Siz ERP tizimida faol xodim sifatida topilmadingiz.\n' +
          'Telegram chat ID ni HR bo\'limiga yuboring yoki: <a href="https://erp.europrint.uz">erp.europrint.uz</a>',
          { parse_mode: 'HTML' }
        );
        return;
      }

      const alreadySubmitted = await this.dataSvc.hasSubmittedToday(emp.id);
      if (alreadySubmitted) {
        await ctx.reply(
          '✅ Bugun hisobotingizni allaqachon topshirgansiz (yoki avtomatik belgilangan)!\n\n' +
          'Ertaga 15:30 dan keyin qayta yuborishingiz mumkin.'
        );
        return;
      }

      const today = _time.now().toISOString().split('T')[0];
      this.sessions.set(chatId, {
        employeeId: emp.id,
        reportDate: today,
        step: 'awaiting_q1',
      });

      await ctx.reply(
        `📝 <b>Kunlik hisobot — ${today}</b>\n\n` +
        `⏰ Deadline: bugun soat 16:00\n\n` +
        `<b>1-savol:</b> Bugun qanday ishlarni bajardingiz? (kamida 30 ta belgi)`,
        { parse_mode: 'HTML' }
      );
    });

    bot.command('statistika', async (ctx: Context) => {
      type TCtx = Context & { chat?: { id?: number } };
      const chatId = (ctx as TCtx).chat?.id;
      if (!chatId) return;

      try {
        const today = _time.now().toISOString().split('T')[0];
        const data = await this.repo.getDailyStatistics(today);
        const stats = data.ok ? data.data : { total_active_employees: 0, submitted_count: 0, absent_count: 0 };
        await ctx.reply(
          `📊 <b>Bugungi statistika (${today})</b>\n\n` +
          `👥 Faol xodimlar: <b>${stats.total_active_employees ?? 0}</b>\n` +
          `✅ Hisobot topshirganlar: <b>${stats.submitted_count ?? 0}</b>\n` +
          `❌ O'tkazib yuborganlar: <b>${stats.absent_count ?? 0}</b>`,
          { parse_mode: 'HTML' }
        );
      } catch {
        await ctx.reply('📊 Statistikani yuklab bo\'lmadi.');
      }
    });

    bot.on(message('text' as never), async (ctx: Context) => {
      type TxtCtx = Context & {
        chat?: { id?: number };
        message?: { text?: string };
      };
      const tCtx = ctx as TxtCtx;
      const chatId = tCtx.chat?.id;
      const text = tCtx.message?.text ?? '';

      if (!chatId || text.startsWith('/')) return;

      const session = this.sessions.get(chatId);
      if (!session) {
        await ctx.reply(
          'Hisobot topshirish uchun /hisobot buyrug\'ini yuboring.'
        );
        return;
      }

      // If deadline has passed while user was mid-conversation, abort
      if (this.dataSvc.isDeadlinePassed()) {
        this.sessions.delete(chatId);
        await ctx.reply(
          '⛔ Hisobot topshirish muddati tugadi (soat 16:00).\n\n' +
          'Avtomatik "yo\'q" belgisi qo\'yildi.\nErtaga 15:30 dan keyin topshirishingiz mumkin.'
        );
        return;
      }

      await this.handleReportFlow(ctx, chatId, text, session);
    });
  }

  private async handleReportFlow(ctx: Context, chatId: number, text: string, session: ReportSession) {
    if (session.step === 'awaiting_q1') {
      if (text.trim().length < 30) {
        await ctx.reply('⚠️ Kamida 30 ta belgi kiriting. Iltimos batafsilroq yozing:');
        return;
      }
      session.q1 = text.trim();
      session.step = 'awaiting_q2';
      this.sessions.set(chatId, session);
      await ctx.reply(
        `✅ Qabul qilindi.\n\n` +
        `<b>2-savol:</b> Ertanga qanday rejalar bor?`,
        { parse_mode: 'HTML' }
      );

    } else if (session.step === 'awaiting_q2') {
      if (text.trim().length < 10) {
        await ctx.reply('⚠️ Kamida 10 ta belgi kiriting:');
        return;
      }
      session.q2 = text.trim();
      session.step = 'awaiting_q3';
      this.sessions.set(chatId, session);
      await ctx.reply(
        `✅ Qabul qilindi.\n\n` +
        `<b>3-savol:</b> Muammolar yoki qiyinchiliklar bor edi? (yo'q bo'lsa "yo'q" deb yozing)`,
        { parse_mode: 'HTML' }
      );

    } else if (session.step === 'awaiting_q3') {
      const metrics = text.trim();
      await this.dataSvc.saveReport(session.employeeId, session.reportDate, session.q1 ?? '', session.q2 ?? '', metrics);
      this.sessions.delete(chatId);

      const hour = _time.now().getHours();
      const pointsMsg = hour < 16 ? '\n\n⭐ +5 ball berildi (o\'z vaqtida topshirganingiz uchun)' : '';

      await ctx.reply(
        `✅ <b>Hisobotingiz qabul qilindi!</b>\n\n` +
        `📅 Sana: ${session.reportDate}\n` +
        `✅ Bajarilgan ishlar: saqlandi\n` +
        `📋 Ertangi rejalar: saqlandi\n` +
        `🔧 Muammolar: ${metrics}` +
        pointsMsg,
        { parse_mode: 'HTML' }
      );
      this.logger.log(`Daily report saved via bot: employeeId=${session.employeeId}, date=${session.reportDate}`);
    }
  }

  async initiateReportRequest(chatId: number | string, employeeId: number, reportDate: string) {
    if (!this.bot) return false;

    // Only initiate before deadline (15:30 cron triggers this; deadline is 16:00)
    if (this.dataSvc.isDeadlinePassed()) return false;

    try {
      const chatIdNum = typeof chatId === 'string' ? parseInt(chatId, 10) : chatId;

      const alreadySubmitted = await this.dataSvc.hasSubmittedToday(employeeId);
      if (alreadySubmitted) return true;

      this.sessions.set(chatIdNum, {
        employeeId,
        reportDate,
        step: 'awaiting_q1',
      });

      await this.bot.telegram.sendMessage(
        chatId,
        `📊 <b>Kunlik hisobot eslatmasi!</b>\n\n` +
        `📅 Sana: ${reportDate}\n` +
        `⏰ Deadline: soat 16:00\n\n` +
        `<b>1-savol:</b> Bugun qanday ishlarni bajardingiz? (kamida 30 ta belgi)`,
        { parse_mode: 'HTML' }
      );
      return true;
    } catch (err) {
      this.logger.error(`initiateReportRequest error: ${errMsg(err)}`);
      return false;
    }
  }

  async sendMessage(chatId: number | string, message: string): Promise<boolean> {
    if (!this.bot) return false;
    try {
      await this.bot.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' });
      return true;
    } catch (err) {
      this.logger.error(`sendMessage error: ${err instanceof Error ? errMsg(err) : String(err)}`);
      return false;
    }
  }

  getInstance(): Telegraf<Context> | null {
    return this.bot;
  }
}
