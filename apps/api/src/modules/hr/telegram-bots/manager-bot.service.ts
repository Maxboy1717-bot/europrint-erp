import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentWorkflowService } from '../document-workflow/document-workflow.service';
import { Result, AppError, safeCall } from '@common/result';
import { errMsg } from '../hr-v2-error';
import { TelegramBotsRepository } from './telegram-bots.repository';
import type { Telegraf, Context } from 'telegraf';

type CtxWithChat = Context & { chat?: { id?: number } };
type CtxWithMsg = CtxWithChat & { message?: { text?: string } };

interface PendingReject {
  documentId: number;
  stepId: number;
  step: 'awaiting_reason';
}

interface LinkSession {
  step: 'awaiting_phone';
}

type ManagerSession = PendingReject | LinkSession;

@Injectable()
export class ManagerBotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ManagerBotService.name);
  private bot: Telegraf<Context> | null = null;
  private readonly token: string | undefined;
  private pendingRejects = new Map<number, PendingReject>();
  private linkSessions = new Map<number, LinkSession>();

  constructor(
    private readonly telegramRepo: TelegramBotsRepository,
    private readonly cfg: ConfigService,
    private readonly documentWorkflow: DocumentWorkflowService,
  ) {
    this.token = this.cfg.get<string>('TELEGRAM_MANAGER_BOT_TOKEN');
  }

  onModuleInit(): void { this._initBackground().catch((e) => this.logger.warn('[manager-bot.service] init failed: ' + e)); }
  private async _initBackground(): Promise<void> {
    return safeCall(async () => {
      if (!this.token) {
        this.logger.warn('Manager Bot token not configured (TELEGRAM_MANAGER_BOT_TOKEN missing) — skipping');
        return;
      }
      try {
        const { Telegraf: TelegrafClass } = await import('telegraf');
        this.bot = new TelegrafClass(this.token) as Telegraf<Context>;
        this.registerCommands(this.bot);
        this.bot.launch().catch((err: Error) => this.logger.error(`Manager Bot launch error: ${errMsg(err)}`));
        this.logger.log('Manager Bot started');
      } catch (err) {
        this.logger.error(`Failed to initialize Manager Bot: ${err instanceof Error ? errMsg(err) : String(err)}`);
      }
    });
  }

  async onModuleDestroy(): Promise<void> {
    this.bot?.stop('Manager Bot stopped');
  }

  private registerCommands(bot: Telegraf<Context>): void {
    bot.command('start', async (ctx: Context) => {
      try {
        const chatId = (ctx as CtxWithChat).chat?.id;
        if (!chatId) return;
        this.pendingRejects.delete(chatId);
        this.linkSessions.delete(chatId);

        const existingR = await this.telegramRepo.getManagerByChatId(chatId);
        if (existingR.ok && existingR.data) {
          const manager = existingR.data;
          await ctx.reply(
            `👔 <b>EuroPrint Manager Bot</b>\n\n` +
            `Xush kelibsiz, ${String(manager['first_name'])} ${String(manager['last_name'])}!\n\n` +
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
          this.linkSessions.set(chatId, { step: 'awaiting_phone' });
          await ctx.reply(
            '👔 <b>EuroPrint Manager Bot</b>\n\n' +
            'Hisobingizni ulash uchun telefon raqamingizni yuboring:\n' +
            '(Masalan: +998901234567)\n\n' +
            'Agar siz menejer bo\'lmasangiz, HR bo\'limiga murojaat qiling.',
            { parse_mode: 'HTML' },
          );
        }
      } catch (err) {
        this.logger.error(`/start error: ${errMsg(err)}`);
        await ctx.reply('Xatolik yuz berdi, iltimos qayta urinib ko\'ring').catch(() => undefined);
      }
    });

    bot.command('pending', async (ctx: Context) => {
      try {
        const chatId = (ctx as CtxWithChat).chat?.id;
        if (!chatId) return;
        const managerR = await this.telegramRepo.getManagerByChatId(chatId);
        if (!managerR.ok || !managerR.data) {
          await ctx.reply('⚠️ Siz menejer sifatida topilmadingiz. HR bo\'limiga murojaat qiling.');
          return;
        }
        const manager = managerR.data;
        const docsR = await this.telegramRepo.getPendingDocumentsForManager(manager['id'] as number);
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
        this.logger.error(`/pending error: ${errMsg(err)}`);
        await ctx.reply('Xatolik yuz berdi, iltimos qayta urinib ko\'ring').catch(() => undefined);
      }
    });

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
        const managerR = await this.telegramRepo.getManagerByChatId(chatId);
        if (!managerR.ok || !managerR.data) {
          await ctx.reply('⚠️ Siz menejer sifatida topilmadingiz.');
          return;
        }
        await this.documentWorkflow.approveStep(stepId, managerR.data['id'] as number);
        await ctx.reply(`✅ Hujjat #${stepId} tasdiqlandi!`);
      } catch (err) {
        this.logger.error(`/approve error: ${errMsg(err)}`);
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
        const managerR = await this.telegramRepo.getManagerByChatId(chatId);
        if (!managerR.ok || !managerR.data) {
          await ctx.reply('⚠️ Siz menejer sifatida topilmadingiz.');
          return;
        }
        const stepIdR = await this.telegramRepo.getCurrentPendingStepId(docId, managerR.data['id'] as number);
        const stepId = stepIdR.ok ? stepIdR.data : null;
        if (!stepId) {
          await ctx.reply('⚠️ Bu hujjat sizga tayinlanmagan yoki allaqachon qayta ishlangan.');
          return;
        }
        this.pendingRejects.set(chatId, { documentId: docId, stepId, step: 'awaiting_reason' });
        await ctx.reply(`📝 Hujjat #${docId} rad etish sababi uchun yozing:`);
      } catch (err) {
        this.logger.error(`/reject error: ${errMsg(err)}`);
        await ctx.reply('Xatolik yuz berdi, iltimos qayta urinib ko\'ring').catch(() => undefined);
      }
    });

    bot.command('team', async (ctx: Context) => {
      try {
        const chatId = (ctx as CtxWithChat).chat?.id;
        if (!chatId) return;
        const managerR = await this.telegramRepo.getManagerByChatId(chatId);
        if (!managerR.ok || !managerR.data) {
          await ctx.reply('⚠️ Siz menejer sifatida topilmadingiz.');
          return;
        }
        const teamR = await this.telegramRepo.getTeamForManager(managerR.data['id'] as number);
        const team = teamR.ok ? teamR.data : [];
        if (!team.length) {
          await ctx.reply('👥 Bo\'limingizda xodimlar topilmadi.');
          return;
        }
        const lines = team.map(m => {
          const statusIcon = m['attendance_today'] === 'present' ? '🟢' : m['attendance_today'] === 'late' ? '🟡' : '🔴';
          return `${statusIcon} ${String(m['first_name'])} ${String(m['last_name'])} — ${String(m['position'] ?? 'Lavozim yo\'q')}`;
        });
        await ctx.reply(`👥 <b>Bo\'lim xodimlari</b>\n\n${lines.join('\n')}`, { parse_mode: 'HTML' });
      } catch (err) {
        this.logger.error(`/team error: ${errMsg(err)}`);
        await ctx.reply('Xatolik yuz berdi, iltimos qayta urinib ko\'ring').catch(() => undefined);
      }
    });

    bot.command('reports', async (ctx: Context) => {
      try {
        const chatId = (ctx as CtxWithChat).chat?.id;
        if (!chatId) return;
        const managerR = await this.telegramRepo.getManagerByChatId(chatId);
        if (!managerR.ok || !managerR.data) {
          await ctx.reply('⚠️ Siz menejer sifatida topilmadingiz.');
          return;
        }
        const reportsR = await this.telegramRepo.getDailyReportStatusForManager(managerR.data['id'] as number);
        const data = reportsR.ok ? reportsR.data : { submitted: 0, missing: 0, total: 0 };
        await ctx.reply(
          `📊 <b>Kundalik hisobot holati</b>\n\n` +
          `✅ Topshirganlar: ${String(data['submitted'] ?? 0)}\n` +
          `❌ Topshirmaganlar: ${String(data['missing'] ?? 0)}\n` +
          `👥 Jami: ${String(data['total'] ?? 0)}`,
          { parse_mode: 'HTML' },
        );
      } catch (err) {
        this.logger.error(`/reports error: ${errMsg(err)}`);
        await ctx.reply('Xatolik yuz berdi, iltimos qayta urinib ko\'ring').catch(() => undefined);
      }
    });

    bot.command('kpi', async (ctx: Context) => {
      try {
        const chatId = (ctx as CtxWithChat).chat?.id;
        if (!chatId) return;
        const managerR = await this.telegramRepo.getManagerByChatId(chatId);
        if (!managerR.ok || !managerR.data) {
          await ctx.reply('⚠️ Siz menejer sifatida topilmadingiz.');
          return;
        }
        const kpiR = await this.telegramRepo.getDepartmentKpi(managerR.data['department_id'] as number);
        const kpi = kpiR.ok ? kpiR.data : null;
        if (!kpi) {
          await ctx.reply('📈 KPI ma\'lumotlari hozircha mavjud emas.');
          return;
        }
        await ctx.reply(
          `📈 <b>Bo\'lim KPI (oxirgi 30 kun)</b>\n\n` +
          `⏰ O\'rtacha kechikish: ${String(kpi['avg_late_minutes'] ?? 0)} daqiqa\n` +
          `📊 Hisobot to\'ldirish darajasi: ${String(kpi['report_rate'] ?? 0)}%\n` +
          `✅ Davomat darajasi: ${String(kpi['attendance_rate'] ?? 0)}%\n` +
          `🎯 Maqsadlar bajarilishi: ${String(kpi['goals_completion'] ?? 0)}%`,
          { parse_mode: 'HTML' },
        );
      } catch (err) {
        this.logger.error(`/kpi error: ${errMsg(err)}`);
        await ctx.reply('Xatolik yuz berdi, iltimos qayta urinib ko\'ring').catch(() => undefined);
      }
    });

    bot.command('alerts', async (ctx: Context) => {
      try {
        const chatId = (ctx as CtxWithChat).chat?.id;
        if (!chatId) return;
        const managerR = await this.telegramRepo.getManagerByChatId(chatId);
        if (!managerR.ok || !managerR.data) {
          await ctx.reply('⚠️ Siz menejer sifatida topilmadingiz.');
          return;
        }
        const alertsR = await this.telegramRepo.getManagerAlerts(managerR.data['id'] as number);
        const alerts = alertsR.ok ? alertsR.data : [];
        if (!alerts.length) {
          await ctx.reply('✅ Joriy ogohlantirishlar yo\'q.');
          return;
        }
        const lines = alerts.slice(0, 15).map(a => {
          const icon = a['type'] === 'late' ? '⏰' : a['type'] === 'absent' ? '❌' : a['type'] === 'doc_overdue' ? '📄' : '⚠️';
          return `${icon} ${String(a['message'] ?? '')}`;
        });
        await ctx.reply(`🚨 <b>Joriy ogohlantirishlar</b>\n\n${lines.join('\n')}`, { parse_mode: 'HTML' });
      } catch (err) {
        this.logger.error(`/alerts error: ${errMsg(err)}`);
        await ctx.reply('Xatolik yuz berdi, iltimos qayta urinib ko\'ring').catch(() => undefined);
      }
    });

    bot.action(/^approve:(\d+)$/, async (ctx) => {
      try {
        const match = (ctx as Context & { match?: RegExpMatchArray }).match;
        const stepId = match ? parseInt(match[1], 10) : NaN;
        if (isNaN(stepId)) return;
        const chatId = (ctx as CtxWithChat).chat?.id;
        if (!chatId) return;
        const managerR = await this.telegramRepo.getManagerByChatId(chatId);
        if (!managerR.ok || !managerR.data) {
          await ctx.answerCbQuery('Siz menejer sifatida topilmadingiz');
          return;
        }
        await this.documentWorkflow.approveStep(stepId, managerR.data['id'] as number);
        await ctx.answerCbQuery('✅ Tasdiqlandi!');
        await ctx.editMessageText(`✅ Hujjat #${stepId} tasdiqlandi!`);
      } catch (err) {
        this.logger.error(`approve action error: ${errMsg(err)}`);
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
        const managerR = await this.telegramRepo.getManagerByChatId(chatId);
        if (!managerR.ok || !managerR.data) {
          await ctx.answerCbQuery('Siz menejer sifatida topilmadingiz');
          return;
        }
        const stepIdR = await this.telegramRepo.getCurrentPendingStepId(docId, managerR.data['id'] as number);
        const stepId = stepIdR.ok ? stepIdR.data : null;
        if (!stepId) {
          await ctx.answerCbQuery('Hujjat sizga tayinlanmagan yoki allaqachon qayta ishlangan');
          return;
        }
        this.pendingRejects.set(chatId, { documentId: docId, stepId, step: 'awaiting_reason' });
        await ctx.answerCbQuery('Sabab kiriting', { show_alert: false });
        await ctx.reply(`📝 Hujjat #${docId} rad etish sababini yozing:`);
      } catch (err) {
        this.logger.error(`reject action error: ${errMsg(err)}`);
        await ctx.answerCbQuery('Xatolik yuz berdi').catch(() => undefined);
      }
    });

    bot.on('text', async (ctx: Context) => {
      try {
        const chatId = (ctx as CtxWithChat).chat?.id;
        const text = ((ctx as CtxWithMsg).message?.text ?? '').trim();
        if (!chatId || text.startsWith('/')) return;

        const linkSession = this.linkSessions.get(chatId);
        if (linkSession) {
          await this.handleLinkSession(ctx, chatId, text);
          return;
        }

        const pending = this.pendingRejects.get(chatId);
        if (!pending) return;

        if (text.length < 5) {
          await ctx.reply('⚠️ Sabab juda qisqa. Kamida 5 ta belgi kiriting:');
          return;
        }

        const managerR = await this.telegramRepo.getManagerByChatId(chatId);
        if (!managerR.ok || !managerR.data) {
          this.pendingRejects.delete(chatId);
          await ctx.reply('⚠️ Siz menejer sifatida topilmadingiz.');
          return;
        }
        const rejectR = await this.documentWorkflow.rejectStep(pending.stepId, managerR.data['id'] as number, text);
        if (!rejectR.ok) {
          await ctx.reply('⚠️ Hujjatni rad etishda xatolik yuz berdi. Qayta urinib ko\'ring.');
          return;
        }
        this.pendingRejects.delete(chatId);
        await ctx.reply(`❌ Hujjat #${pending.documentId} rad etildi.\nSabab: ${text}`);
      } catch (err) {
        this.logger.error(`text handler error: ${errMsg(err)}`);
        await ctx.reply('Xatolik yuz berdi, iltimos qayta urinib ko\'ring').catch(() => undefined);
      }
    });
  }

  private async handleLinkSession(ctx: Context, chatId: number, phone: string): Promise<void> {
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
    const isManager = emp['is_department_head'] === true;
    if (!isManager) {
      await ctx.reply('⚠️ Siz menejer huquqiga ega emassiz. HR bo\'limiga murojaat qiling.');
      return;
    }
    await this.telegramRepo.linkEmployeeChatId(emp['id'] as number, chatId);
    this.linkSessions.delete(chatId);
    await ctx.reply(
      `✅ <b>Muvaffaqiyatli ulandi!</b>\n\n` +
      `👤 ${String(emp['first_name'])} ${String(emp['last_name'])}\n\n` +
      'Endi barcha menejer funksiyalaridan foydalanishingiz mumkin:\n' +
      '/pending — Tasdiqlash kutayotgan hujjatlar\n' +
      '/team — Bo\'lim xodimlari\n' +
      '/alerts — Ogohlantirishlar',
      { parse_mode: 'HTML' },
    );
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
