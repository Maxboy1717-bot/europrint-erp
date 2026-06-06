/**
 * @module learning-bot.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { Result, AppError, safeCall } from '@common/result';
import { errMsg } from '../hr-v2-error';
import { TelegramBotsRepository } from './telegram-bots.repository';
import { NotificationBotService } from './notification-bot.service';
import type { Telegraf, Context } from 'telegraf';
import { message } from 'telegraf/filters';

type CtxWithChat = Context & { chat?: { id?: number } };
type CtxWithMsg = CtxWithChat & { message?: { text?: string } };

interface LinkSession {
  step: 'awaiting_phone';
}

@Injectable()
export class LearningBotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(LearningBotService.name);
  private bot: Telegraf<Context> | null = null;
  private readonly token: string | undefined;
  private linkSessions = new Map<number, LinkSession>();

  constructor(
    private readonly telegramRepo: TelegramBotsRepository,
    private readonly cfg: ConfigService,
    private readonly notifBot: NotificationBotService,
  ) {
    this.token = this.cfg.get<string>('TELEGRAM_LEARNING_BOT_TOKEN');
  }

  onModuleInit(): void { this._initBackground().catch((e) => this.logger.warn('[learning-bot.service] init failed: ' + e)); }
  private async _initBackground(): Promise<void> {
    await safeCall(async () => {
      if (!this.token) {
        this.logger.warn('Learning Bot token not configured (TELEGRAM_LEARNING_BOT_TOKEN missing) — skipping');
        return;
      }
      try {
        const { Telegraf: TelegrafClass } = await import('telegraf');
        this.bot = new TelegrafClass(this.token) as Telegraf<Context>;
        this.registerCommands(this.bot);
        this.bot.launch().catch((err: Error) => this.logger.error(`Learning Bot launch error: ${errMsg(err)}`));
        this.logger.log('Learning Bot started');
      } catch (err) {
        this.logger.error(`Failed to initialize Learning Bot: ${err instanceof Error ? errMsg(err) : String(err)}`);
      }
    });
  }

  async onModuleDestroy(): Promise<void> {
    this.bot?.stop('Learning Bot stopped');
  }

  private registerCommands(bot: Telegraf<Context>): void {
    bot.command('start', async (ctx: Context) => {
      try {
        const chatId = (ctx as CtxWithChat).chat?.id;
        if (!chatId) return;
        this.linkSessions.delete(chatId);

        const existingR = await this.telegramRepo.getEmployeeByChatId(chatId);
        if (existingR.ok && existingR.data) {
          const emp = existingR.data;
          await ctx.reply(
            `📚 <b>EuroPrint Learning Bot</b>\n\n` +
            `Xush kelibsiz, ${String(emp['first_name'])} ${String(emp['last_name'])}!\n\n` +
            'Buyruqlar:\n' +
            '/mycourses — Mening kurslarim\n' +
            '/certificates — Sertifikatlarim\n' +
            '/help — Yordam',
            { parse_mode: 'HTML' },
          );
        } else {
          this.linkSessions.set(chatId, { step: 'awaiting_phone' });
          await ctx.reply(
            '📚 <b>EuroPrint Learning Bot</b>\n\n' +
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

    bot.command('mycourses', async (ctx: Context) => {
      try {
        const chatId = (ctx as CtxWithChat).chat?.id;
        if (!chatId) return;
        const empR = await this.telegramRepo.getEmployeeByChatId(chatId);
        if (!empR.ok || !empR.data) {
          await ctx.reply('⚠️ Siz ERP tizimida topilmadingiz. HR bo\'limiga murojaat qiling yoki /start orqali ulaning.');
          return;
        }
        const coursesR = await this.telegramRepo.getEmployeeCourses(empR.data['id'] as number);
        const courses = coursesR.ok ? coursesR.data : [];
        if (!courses.length) {
          await ctx.reply('📚 Hozircha tayinlangan kurslar yo\'q.\n\nKurslar uchun: <a href="https://erp.europrint.uz">erp.europrint.uz</a>', { parse_mode: 'HTML' });
          return;
        }
        const lines = courses.map(c => {
          const progress = c['progress'] as number ?? 0;
          const icon = progress >= 100 ? '✅' : progress > 0 ? '🔄' : '📖';
          return `${icon} <b>${String(c['title'])}</b> — ${progress}%\nDeadline: ${String(c['deadline'] ?? 'Belgilanmagan')}`;
        });
        await ctx.reply(
          `📚 <b>Mening kurslarim</b>\n\n${lines.join('\n\n')}\n\nBatafsil: <a href="https://erp.europrint.uz">erp.europrint.uz</a>`,
          { parse_mode: 'HTML' },
        );
      } catch (err) {
        this.logger.error(`/mycourses error: ${errMsg(err)}`);
        await ctx.reply('Xatolik yuz berdi, iltimos qayta urinib ko\'ring').catch(() => undefined);
      }
    });

    bot.command('certificates', async (ctx: Context) => {
      try {
        const chatId = (ctx as CtxWithChat).chat?.id;
        if (!chatId) return;
        const empR = await this.telegramRepo.getEmployeeByChatId(chatId);
        if (!empR.ok || !empR.data) {
          await ctx.reply('⚠️ Siz ERP tizimida topilmadingiz. HR bo\'limiga murojaat qiling yoki /start orqali ulaning.');
          return;
        }
        const certsR = await this.telegramRepo.getEmployeeCertificates(empR.data['id'] as number);
        const certs = certsR.ok ? certsR.data : [];
        if (!certs.length) {
          await ctx.reply('🎓 Hozircha sertifikatlar yo\'q.\n\nKurslarni yakunlang va sertifikat oling!');
          return;
        }
        const lines = certs.map(c =>
          `🎓 <b>${String(c['name'])}</b>\nBerilgan: ${String(c['issued_at'] ?? '')}\n${c['pdf_url'] ? `PDF: <a href="${String(c['pdf_url'])}">Yuklab olish</a>` : ''}`,
        );
        await ctx.reply(
          `🎓 <b>Mening sertifikatlarim</b>\n\n${lines.join('\n\n')}`,
          { parse_mode: 'HTML' },
        );
      } catch (err) {
        this.logger.error(`/certificates error: ${errMsg(err)}`);
        await ctx.reply('Xatolik yuz berdi, iltimos qayta urinib ko\'ring').catch(() => undefined);
      }
    });

    bot.command('help', async (ctx: Context) => {
      try {
        await ctx.reply(
          '❓ <b>Yordam menyusi</b>\n\n' +
          '/start — Botni boshlash va hisobni ulash\n' +
          '/mycourses — Tayinlangan kurslaringiz va progres\n' +
          '/certificates — Olingan sertifikatlar ro\'yxati\n\n' +
          '📌 Yangi kurs tayinlanganda yoki sertifikat berilganda avtomatik xabar olasiz.\n\n' +
          'ERP tizimi: <a href="https://erp.europrint.uz">erp.europrint.uz</a>',
          { parse_mode: 'HTML' },
        );
      } catch (err) {
        this.logger.error(`/help error: ${errMsg(err)}`);
        await ctx.reply('Xatolik yuz berdi, iltimos qayta urinib ko\'ring').catch(() => undefined);
      }
    });

    bot.on(message('text' as never), async (ctx: Context) => {
      try {
        const chatId = (ctx as CtxWithChat).chat?.id;
        const text = ((ctx as CtxWithMsg).message?.text ?? '').trim();
        if (!chatId || text.startsWith('/')) return;

        const linkSession = this.linkSessions.get(chatId);
        if (linkSession) {
          await this.handlePhoneLink(ctx, chatId, text);
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
    this.linkSessions.delete(chatId);
    await ctx.reply(
      `✅ <b>Muvaffaqiyatli ulandi!</b>\n\n` +
      `👤 ${String(emp['first_name'])} ${String(emp['last_name'])}\n\n` +
      'Kurs va sertifikat bildirishnomalari endi ushbu bot orqali yetkaziladi.\n\n' +
      '/mycourses — Kurslaringizni ko\'rish',
      { parse_mode: 'HTML' },
    );
  }

  async notifyCourseAssigned(chatId: number | string, courseTitle: string, deadline: string, url: string): Promise<Result<void, AppError>> {
    return safeCall(async () => {
      if (!this.bot) return;
      await this.bot.telegram.sendMessage(
        chatId,
        `📚 <b>Yangi majburiy kurs tayinlandi!</b>\n\n<b>${courseTitle}</b>\nDeadline: ${deadline}\n\nBoshlash uchun: <a href="${url}">${url}</a>`,
        { parse_mode: 'HTML' },
      );
    });
  }

  async notifyCourseDeadlineReminder(chatId: number | string, courseTitle: string, daysLeft: number, deadline: string, progress: number, url: string): Promise<Result<void, AppError>> {
    return safeCall(async () => {
      if (!this.bot) return;
      await this.bot.telegram.sendMessage(
        chatId,
        `⏰ <b>Kurs muddati yaqinlashmoqda!</b>\n\n<b>${courseTitle}</b>\n${daysLeft} kun qoldi — Deadline: ${deadline}\nTugallanganlik: ${progress}%\n\nDavom ettirish: <a href="${url}">${url}</a>`,
        { parse_mode: 'HTML' },
      );
    });
  }

  async notifyCertificateIssued(chatId: number | string, certName: string, pdfUrl: string): Promise<Result<void, AppError>> {
    return safeCall(async () => {
      if (!this.bot) return;
      await this.bot.telegram.sendMessage(
        chatId,
        `🎓 <b>Tabriklaymiz!</b>\n\nSertifikat olindi: <b>${certName}</b>\nPDF: <a href="${pdfUrl}">Yuklab olish</a>`,
        { parse_mode: 'HTML' },
      );
    });
  }

  @OnEvent('lms.course.enrolled')
  async onCourseAssigned(payload: { employeeId: number; courseTitle: string; deadline: string; url: string; employeeName?: string }): Promise<void> {
    try {
      await this.notifBot.sendNotification({
        userId: payload.employeeId,
        templateKey: 'TRAINING_MANDATORY',
        params: {
          name: payload.employeeName ?? 'Xodim',
          course_title: payload.courseTitle,
          deadline: payload.deadline,
          url: payload.url,
        },
      });
    } catch (err) {
      this.logger.warn(`onCourseAssigned error: ${errMsg(err)}`);
    }
  }

  @OnEvent('lms.certificate.issued')
  async onCertificateIssued(payload: { employeeId: number; certName: string; pdfUrl: string }): Promise<void> {
    try {
      const chatIdR = await this.telegramRepo.getEmployeeTelegramChatId(payload.employeeId);
      const chatId = chatIdR.ok ? chatIdR.data : null;
      if (!chatId) return;
      await this.notifBot.sendNotificationRaw(
        chatId,
        `🎓 <b>Tabriklaymiz!</b>\n\nSertifikat olindi: <b>${payload.certName}</b>\nPDF: <a href="${payload.pdfUrl}">Yuklab olish</a>`,
      );
    } catch (err) {
      this.logger.warn(`onCertificateIssued error: ${errMsg(err)}`);
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
