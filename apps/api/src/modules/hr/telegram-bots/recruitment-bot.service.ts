/**
 * @module recruitment-bot.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Result, AppError, safeCall } from '@common/result';
import { errMsg } from "../hr-v2-error";
import type { Telegraf, Context } from 'telegraf';
import {
  Lang, RecruitStep, RecruitSession, MAX_ATTEMPTS, I18N,
} from './recruitment-bot.i18n';
import {
  getVacancyInfo, saveCandidateApplication, checkAttempts, incrementAttempts,
} from './recruitment-bot-helpers';

@Injectable()
export class RecruitmentBotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RecruitmentBotService.name);
  private bot: Telegraf<Context> | null = null;
  private readonly token: string | undefined;
  private sessions = new Map<number, RecruitSession>();

  constructor(private readonly cfg: ConfigService) {
    this.token = this.cfg.get<string>('TELEGRAM_RECRUITMENT_BOT_TOKEN');
  }

  onModuleInit(): void { this._initBackground().catch((e) => this.logger.warn('[recruitment-bot.service] init failed: ' + e)); }
  private async _initBackground(): Promise<void> {
    return safeCall(async () => {
      if (!this.token) {
        this.logger.warn('Recruitment Bot token not configured (TELEGRAM_RECRUITMENT_BOT_TOKEN missing) — skipping');
        return;
      }
      try {
        const { Telegraf: TelegrafClass } = await import('telegraf');
        this.bot = new TelegrafClass(this.token) as Telegraf<Context>;
        this.registerCommands(this.bot);
        this.bot.launch().catch((err: Error) => this.logger.error(`Recruitment Bot launch error: ${errMsg(err)}`));
        this.logger.log('Recruitment Bot started');
      } catch (err) {
        this.logger.error(`Failed to initialize Recruitment Bot: ${err instanceof Error ? errMsg(err) : String(err)}`);
      }
    });
  }

  async onModuleDestroy() {
    this.bot?.stop('Recruitment Bot stopped');
  }

  private t(lang: Lang, key: string): string {
    return I18N[lang]?.[key] ?? I18N.uz[key] ?? key;
  }

  private registerCommands(bot: Telegraf<Context>) {
    bot.command('start', async (ctx: Context) => {
      type StartCtx = Context & {
        chat?: { id?: number };
        message?: { text?: string };
      };
      const sCtx = ctx as StartCtx;
      const chatId = sCtx.chat?.id;
      if (!chatId) return;

      const text = sCtx.message?.text ?? '/start';
      const parts = text.split(' ');
      const param = parts[1] ?? '';
      let vacancyId: number | null = null;

      if (param) {
        const parsed = parseInt(param, 10);
        if (!isNaN(parsed)) vacancyId = parsed;
      }

      const attempts = await checkAttempts(chatId, vacancyId);
      if (attempts >= MAX_ATTEMPTS) {
        await ctx.reply('⛔ Siz ushbu vakansiyaga maksimal urinishlar soniga yetdingiz (3/3).\n\nBoshqa vakansiyalarga murojaat qilishingiz mumkin.');
        return;
      }

      await incrementAttempts(chatId, vacancyId);

      const session: RecruitSession = {
        vacancyId,
        lang: 'uz',
        step: 'awaiting_lang',
        answers: [],
        attempts: attempts + 1,
      };

      if (vacancyId) {
        const vacancy = await getVacancyInfo(vacancyId);
        session.vacancyTitle = vacancy?.title;
      }

      this.sessions.set(chatId, session);

      const { Markup } = await import('telegraf');
      await ctx.reply(
        I18N.uz.selectLang,
        Markup.keyboard([['🇺🇿 O\'zbekcha', '🇷🇺 Русский', '🇬🇧 English']]).oneTime().resize()
      );
    });

    bot.on('document', async (ctx: Context) => {
      type DocCtx = Context & {
        chat?: { id?: number };
        message?: { document?: { file_name?: string; file_id?: string } };
      };
      const docCtx = ctx as DocCtx;
      const chatId = docCtx.chat?.id;
      if (!chatId) return;

      const session = this.sessions.get(chatId);
      if (!session || session.step !== 'awaiting_cv') return;

      const doc = docCtx.message?.document;
      session.cvFileId = doc?.file_id;
      session.cvFileName = doc?.file_name ?? 'CV';
      session.step = 'awaiting_q1';
      this.sessions.set(chatId, session);

      await ctx.reply(
        `${this.t(session.lang, 'cvReceived')}\n\n${this.t(session.lang, 'q1')}`
      );
    });

    bot.on('text', async (ctx: Context) => {
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
        await ctx.reply('Boshlash uchun /start ni bosing.');
        return;
      }

      await this.handleConversation(ctx, chatId, text, session);
    });
  }

  private async handleConversation(ctx: Context, chatId: number, text: string, session: RecruitSession) {
    const { Markup } = await import('telegraf');

    switch (session.step) {
      case 'awaiting_lang': {
        if (text.includes('Русский') || text.toLowerCase() === 'ru') {
          session.lang = 'ru';
        } else if (text.includes('English') || text.toLowerCase() === 'en') {
          session.lang = 'en';
        } else {
          session.lang = 'uz';
        }
        session.step = 'awaiting_name';
        this.sessions.set(chatId, session);

        let welcomeMsg = this.t(session.lang, 'welcome');
        if (session.vacancyTitle) {
          welcomeMsg = `${this.t(session.lang, 'vacancy')} <b>${session.vacancyTitle}</b>\n\n${welcomeMsg}`;
        }
        await ctx.reply(welcomeMsg, { parse_mode: 'HTML', ...Markup.removeKeyboard() });
        break;
      }

      case 'awaiting_name': {
        const trimmed = text.trim();
        if (trimmed.length < 3 || !trimmed.includes(' ')) {
          await ctx.reply(this.t(session.lang, 'nameRequired'));
          return;
        }
        session.name = trimmed;
        session.step = 'awaiting_cv';
        this.sessions.set(chatId, session);
        await ctx.reply(this.t(session.lang, 'uploadCv'));
        break;
      }

      case 'awaiting_cv': {
        await ctx.reply('📎 Iltimos, CV faylini yuboring (PDF yoki DOCX formatida):');
        break;
      }

      case 'awaiting_q1': {
        session.answers[0] = text.trim();
        session.step = 'awaiting_q2';
        this.sessions.set(chatId, session);
        await ctx.reply(this.t(session.lang, 'q2'));
        break;
      }

      case 'awaiting_q2': {
        session.answers[1] = text.trim();
        session.step = 'awaiting_q3';
        this.sessions.set(chatId, session);
        await ctx.reply(this.t(session.lang, 'q3'));
        break;
      }

      case 'awaiting_q3': {
        session.answers[2] = text.trim();
        session.step = 'awaiting_q4';
        this.sessions.set(chatId, session);
        await ctx.reply(this.t(session.lang, 'q4'));
        break;
      }

      case 'awaiting_q4': {
        session.answers[3] = text.trim();
        session.step = 'awaiting_q5';
        this.sessions.set(chatId, session);
        await ctx.reply(this.t(session.lang, 'q5'));
        break;
      }

      case 'awaiting_q5': {
        session.answers[4] = text.trim();
        const saved = await saveCandidateApplication(session, chatId);
        if (!saved) {
          await ctx.reply(
            '⚠️ Texnik xatolik yuz berdi. Iltimos, bir ozdan keyin qayta urinib ko\'ring yoki HR bo\'limiga murojaat qiling.',
            { parse_mode: 'HTML' }
          );
          return;
        }
        this.sessions.delete(chatId);
        await ctx.reply(this.t(session.lang, 'submitted'), { parse_mode: 'HTML' });
        this.logger.log(`Recruitment application saved: chatId=${chatId}, vacancy=${session.vacancyId}, name=${session.name}`);
        break;
      }
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
