/**
 * @module hr-bot.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Result, AppError, safeCall } from '@common/result';
import { errMsg } from "../hr-v2-error";
import { TelegramBotsRepository } from './telegram-bots.repository';
import type { Telegraf, Context } from 'telegraf';
import {
  HrSession, SickSession, LeaveSession,
  MENU_TEXT,
  getEmployeeInfo, getLeaveBalance, saveSickReport, getDailyReportStatus,
  handleSickFlow, handleLeaveFlow,
} from './hr-bot-helpers';

@Injectable()
export class HrBotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(HrBotService.name);
  private bot: Telegraf<Context> | null = null;
  private readonly token: string | undefined;
  private sessions = new Map<number, HrSession>();

  constructor(
    private readonly telegramRepo: TelegramBotsRepository,
    private readonly cfg: ConfigService,
  ) {
    this.token = this.cfg.get<string>('TELEGRAM_HR_BOT_TOKEN');
  }

  onModuleInit(): void { this._initBackground().catch((e) => this.logger.warn('[hr-bot.service] init failed: ' + e)); }
  private async _initBackground(): Promise<void> {
    return safeCall(async () => {
      if (!this.token) {
        this.logger.warn('HR Bot token not configured (TELEGRAM_HR_BOT_TOKEN missing) — skipping');
        return;
      }
      try {
        const { Telegraf: TelegrafClass } = await import('telegraf');
        this.bot = new TelegrafClass(this.token) as Telegraf<Context>;
        this.registerCommands(this.bot);
        this.bot.launch().catch((err: Error) => this.logger.error(`HR Bot launch error: ${errMsg(err)}`));
        this.logger.log('HR Bot started');
      } catch (err) {
        this.logger.error(`Failed to initialize HR Bot: ${err instanceof Error ? errMsg(err) : String(err)}`);
      }
    });
  }

  async onModuleDestroy() {
    this.bot?.stop('HR Bot stopped');
  }

  private registerCommands(bot: Telegraf<Context>) {
    bot.command('start', async (ctx: Context) => {
      const chat = (ctx as Context & { chat?: { id?: number } }).chat;
      if (chat?.id) this.sessions.delete(chat.id);
      await ctx.reply(MENU_TEXT, { parse_mode: 'HTML' });
    });

    bot.command('bekor', async (ctx: Context) => {
      const chat = (ctx as Context & { chat?: { id?: number } }).chat;
      if (chat?.id) this.sessions.delete(chat.id);
      await ctx.reply('❌ Amal bekor qilindi.\n\n' + MENU_TEXT, { parse_mode: 'HTML' });
    });

    bot.command('kasalman', async (ctx: Context) => {
      const chat = (ctx as Context & { chat?: { id?: number } }).chat;
      if (!chat?.id) return;
      this.sessions.set(chat.id, { flow: 'sick', step: 'awaiting_days' });
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
      this.sessions.set(chat.id, { flow: 'leave', step: 'awaiting_start' });
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
        `📅 Sana: ${today}\n` +
        `${statusText}\n\n` +
        `Hisobot topshirish uchun:\n<a href="https://erp.europrint.uz">erp.europrint.uz</a>`,
        { parse_mode: 'HTML' }
      );
    });

    bot.command('mening_ballarim', async (ctx: Context) => {
      const chat = (ctx as Context & { chat?: { id?: number } }).chat;
      if (!chat?.id) return;

      const emp = await getEmployeeInfo(chat.id);
      if (!emp) {
        await ctx.reply('🎮 Ballaringizni ko\'rish uchun: <a href="https://erp.europrint.uz">erp.europrint.uz</a>', { parse_mode: 'HTML' });
        return;
      }

      try {
        const data = await this.telegramRepo.getGamificationPoints(emp.id);
        if (data && data.ok && data.data !== null) {
          await ctx.reply(
            `🎮 <b>Gamifikatsiya ballarim</b>\n\n` +
            `👤 ${emp.first_name} ${emp.last_name}\n` +
            `⭐ Umumiy ball: <b>${data.data?.total_points ?? 0}</b>\n` +
            `📅 Bu oy: <b>${data.data?.monthly_points ?? 0}</b>\n\n` +
            `Batafsil: <a href="https://erp.europrint.uz">erp.europrint.uz</a>`,
            { parse_mode: 'HTML' }
          );
        } else {
          await ctx.reply('🎮 Hozircha ballaringiz yo\'q.\n\nHar kunlik hisobot topshirish orqali ball to\'plang!');
        }
      } catch {
        await ctx.reply('🎮 Ballaringizni ko\'rish uchun: <a href="https://erp.europrint.uz">erp.europrint.uz</a>', { parse_mode: 'HTML' });
      }
    });

    // ── /profil ───────────────────────────────────────────────────────────
    bot.command('profil', async (ctx: Context) => {
      const chat = (ctx as Context & { chat?: { id?: number } }).chat;
      if (!chat?.id) return;
      try {
        const r = await this.telegramRepo.getEmployeeProfileByChatId(chat.id);
        if (!r.ok || !r.data) {
          await ctx.reply('⚠️ Siz ERP tizimida topilmadingiz. Telegram chat ID ni HR bo\'limiga yuboring.');
          return;
        }
        const e = r.data;
        const hireDate = e['hire_date'] ? new Date(e['hire_date'] as string).toLocaleDateString('uz-UZ') : '—';
        await ctx.reply(
          `👤 <b>Mening Profilim</b>\n\n` +
          `📛 F.I.O: <b>${String(e['last_name'])} ${String(e['first_name'])} ${String(e['middle_name'] ?? '')}</b>\n` +
          `🆔 Xodim kodi: <b>${String(e['employee_code'] ?? '—')}</b>\n` +
          `💼 Lavozim: ${String(e['position_name'] ?? '—')}\n` +
          `🏢 Bo'lim: ${String(e['department_name'] ?? '—')}\n` +
          `📅 Ish boshlagan sana: ${hireDate}\n` +
          `📊 Holat: ${String(e['status'] ?? '—')}\n\n` +
          `🎮 Ball (jami): <b>${String(e['total_points'] ?? 0)}</b>\n` +
          `📅 Ball (bu oy): <b>${String(e['monthly_points'] ?? 0)}</b>\n\n` +
          `Batafsil: <a href="https://erp.europrint.uz">erp.europrint.uz</a>`,
          { parse_mode: 'HTML' },
        );
      } catch {
        await ctx.reply('⚠️ Ma\'lumot olishda xatolik. Qayta urinib ko\'ring.');
      }
    });

    // ── /reyting ─────────────────────────────────────────────────────────
    bot.command('reyting', async (ctx: Context) => {
      const chat = (ctx as Context & { chat?: { id?: number } }).chat;
      if (!chat?.id) return;
      try {
        const r = await this.telegramRepo.getLeaderboard(10);
        if (!r.ok || r.data.length === 0) {
          await ctx.reply('🏆 Liderlar jadvali hali to\'ldirilmagan.');
          return;
        }
        const MEDALS = ['🥇', '🥈', '🥉'];
        const lines = (Array.isArray(r.data) ? r.data : []).map((e, i) => {
          const medal = MEDALS[i] ?? `${i + 1}.`;
          return `${medal} <b>${String(e['last_name'])} ${String(e['first_name'])}</b> — ${String(e['department_name'] ?? '—')}\n   ⭐ ${String(e['monthly_points'])} ball (oy)`;
        }).join('\n\n');
        await ctx.reply(
          `🏆 <b>Top-10 Liderlar Jadvali</b> (joriy oy)\n\n${lines}\n\nBatafsil: <a href="https://erp.europrint.uz">erp.europrint.uz</a>`,
          { parse_mode: 'HTML' },
        );
      } catch {
        await ctx.reply('⚠️ Reytingni olishda xatolik. Qayta urinib ko\'ring.');
      }
    });

    // ── /baholash ─────────────────────────────────────────────────────────
    bot.command('baholash', async (ctx: Context) => {
      const chat = (ctx as Context & { chat?: { id?: number } }).chat;
      if (!chat?.id) return;
      const emp = await getEmployeeInfo(chat.id);
      if (!emp) {
        await ctx.reply('⭐ Baholash natijalarini ko\'rish uchun: <a href="https://erp.europrint.uz">erp.europrint.uz</a>', { parse_mode: 'HTML' });
        return;
      }
      try {
        const r = await this.telegramRepo.getEmployeeEvaluations(emp.id);
        if (!r.ok || r.data.length === 0) {
          await ctx.reply('⭐ Hozircha baholash natijalari yo\'q.\n\nBatafsil: <a href="https://erp.europrint.uz">erp.europrint.uz</a>', { parse_mode: 'HTML' });
          return;
        }
        const lines = (Array.isArray(r.data) ? r.data : []).map(ev =>
          `📅 ${String(ev['period'] ?? '—')}:\n   Ball: <b>${String(ev['score'] ?? '—')}</b> | Daraja: ${String(ev['grade'] ?? '—')}`,
        ).join('\n\n');
        await ctx.reply(
          `⭐ <b>Baholash Natijalari</b>\n\n${emp.first_name} ${emp.last_name}\n\n${lines}\n\nBatafsil: <a href="https://erp.europrint.uz">erp.europrint.uz</a>`,
          { parse_mode: 'HTML' },
        );
      } catch {
        await ctx.reply('⚠️ Ma\'lumot olishda xatolik. Qayta urinib ko\'ring.');
      }
    });

    // ── /oqish ────────────────────────────────────────────────────────────
    bot.command('oqish', async (ctx: Context) => {
      const chat = (ctx as Context & { chat?: { id?: number } }).chat;
      if (!chat?.id) return;
      const emp = await getEmployeeInfo(chat.id);
      if (!emp) {
        await ctx.reply('📚 Kurslaringizni ko\'rish uchun: <a href="https://erp.europrint.uz">erp.europrint.uz</a>', { parse_mode: 'HTML' });
        return;
      }
      try {
        const r = await this.telegramRepo.getEmployeeCourses(emp.id);
        if (!r.ok || r.data.length === 0) {
          await ctx.reply('📚 Hozircha tayinlangan kurslar yo\'q.\n\nBatafsil: <a href="https://erp.europrint.uz">erp.europrint.uz</a>', { parse_mode: 'HTML' });
          return;
        }
        const lines = (Array.isArray(r.data) ? r.data : []).map(c => {
          const deadline = c['deadline'] ? `Deadline: ${new Date(c['deadline'] as string).toLocaleDateString('uz-UZ')}` : '';
          const status = c['status'] === 'completed' ? '✅' : c['status'] === 'in_progress' ? '📖' : '⏳';
          return `${status} <b>${String(c['title'] ?? '—')}</b>\n   Taraqqiyot: ${String(c['progress'] ?? 0)}% ${deadline}`;
        }).join('\n\n');
        await ctx.reply(
          `📚 <b>Mening Kurslarim</b>\n\n${lines}\n\nBatafsil: <a href="https://erp.europrint.uz">erp.europrint.uz</a>`,
          { parse_mode: 'HTML' },
        );
      } catch {
        await ctx.reply('⚠️ Ma\'lumot olishda xatolik. Qayta urinib ko\'ring.');
      }
    });

    // ── /inventar ─────────────────────────────────────────────────────────
    bot.command('inventar', async (ctx: Context) => {
      const chat = (ctx as Context & { chat?: { id?: number } }).chat;
      if (!chat?.id) return;
      const emp = await getEmployeeInfo(chat.id);
      if (!emp) {
        await ctx.reply('📦 Inventaringizni ko\'rish uchun: <a href="https://erp.europrint.uz">erp.europrint.uz</a>', { parse_mode: 'HTML' });
        return;
      }
      try {
        const r = await this.telegramRepo.getEmployeeInventory(emp.id);
        if (!r.ok || r.data.length === 0) {
          await ctx.reply('📦 Hozircha inventar biriktirilmagan.\n\nBatafsil: <a href="https://erp.europrint.uz">erp.europrint.uz</a>', { parse_mode: 'HTML' });
          return;
        }
        const lines = (Array.isArray(r.data) ? r.data : []).map(item =>
          `• <b>${String(item['item_name'] ?? '—')}</b> [${String(item['item_code'] ?? '')}]\n   Miqdor: ${String(item['quantity'] ?? 0)} ${String(item['unit'] ?? '')}`,
        ).join('\n');
        await ctx.reply(
          `📦 <b>Mening Inventarim</b>\n\n${emp.first_name} ${emp.last_name}\n\n${lines}\n\nBatafsil: <a href="https://erp.europrint.uz">erp.europrint.uz</a>`,
          { parse_mode: 'HTML' },
        );
      } catch {
        await ctx.reply('⚠️ Ma\'lumot olishda xatolik. Qayta urinib ko\'ring.');
      }
    });

    bot.command('skip', async (ctx: Context) => {
      type TCtx = Context & { chat?: { id?: number } };
      const chatId = (ctx as TCtx).chat?.id;
      if (!chatId) return;

      const session = this.sessions.get(chatId);
      if (!session || session.flow !== 'sick' || session.step !== 'awaiting_document') {
        await ctx.reply('⚠️ /skip faqat hujjat yuklash bosqichida ishlaydi.');
        return;
      }

      const empSkip = await getEmployeeInfo(chatId);
      if (!empSkip) {
        await ctx.reply('⚠️ Siz ERP tizimida topilmadingiz. HR bo\'limiga murojaat qiling.');
        this.sessions.delete(chatId);
        return;
      }
      const savedSkip = await saveSickReport(empSkip.id, (session as SickSession).days ?? 0, (session as SickSession).reason ?? '');
      if (!savedSkip) {
        await ctx.reply('⚠️ Texnik xatolik yuz berdi. Iltimos, qayta urinib ko\'ring yoki HR bo\'limiga murojaat qiling.');
        return;
      }
      this.sessions.delete(chatId);
      await ctx.reply(
        `✅ <b>Kasallik ma'lumoti qabul qilindi!</b>\n\n` +
        `📅 Kun soni: ${(session as SickSession).days}\n` +
        `📝 Sabab: ${(session as SickSession).reason}\n` +
        `📄 Hujjat: Yuklanmagan\n\n` +
        `HR bo'limi ko'rib chiqadi.`,
        { parse_mode: 'HTML' }
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
      if (!session || session.flow !== 'sick' || session.step !== 'awaiting_document') {
        return;
      }

      const doc = docCtx.message?.document;
      const fileId = doc?.file_id;
      const fileName = doc?.file_name ?? 'hujjat';

      const emp = await getEmployeeInfo(chatId);
      if (!emp) {
        await ctx.reply('⚠️ Siz ERP tizimida topilmadingiz. HR bo\'limiga murojaat qiling.');
        this.sessions.delete(chatId);
        return;
      }

      const savedDoc = await saveSickReport(emp.id, (session as SickSession).days ?? 0, (session as SickSession).reason ?? '', fileId);
      if (!savedDoc) {
        await ctx.reply('⚠️ Texnik xatolik yuz berdi. Iltimos, qayta urinib ko\'ring yoki HR bo\'limiga murojaat qiling.');
        return;
      }

      this.sessions.delete(chatId);
      await ctx.reply(
        `✅ <b>Kasallik varaqasi qabul qilindi!</b>\n\n` +
        `📄 Hujjat: ${fileName}\n` +
        `📅 Kun soni: ${(session as SickSession).days}\n` +
        `📝 Sabab: ${(session as SickSession).reason}\n\n` +
        `HR bo'limi ko'rib chiqadi va tasdiqlaydi.`,
        { parse_mode: 'HTML' }
      );
    });

    bot.on('text', async (ctx: Context) => {
      type TxtCtx = Context & { chat?: { id?: number }; message?: { text?: string } };
      const tCtx = ctx as TxtCtx;
      const chatId = tCtx.chat?.id;
      const text = tCtx.message?.text ?? '';

      if (!chatId || text.startsWith('/')) return;

      const session = this.sessions.get(chatId);
      if (!session) {
        await ctx.reply('Buyruq tanlang:\n\n' + MENU_TEXT, { parse_mode: 'HTML' });
        return;
      }

      if (session.flow === 'sick') {
        await handleSickFlow(ctx, chatId, text, session as SickSession, this.sessions);
      } else if (session.flow === 'leave') {
        await handleLeaveFlow(ctx, chatId, text, session as LeaveSession, this.sessions);
      }
    });
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
