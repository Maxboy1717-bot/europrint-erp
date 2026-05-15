/**
 * @module hr-bot-profile.helpers
 * @description Profile/leaderboard/evaluation/courses/inventory commands for HrBotService.
 * Split from hr-bot-commands.helpers.ts (Rule 16).
 */

import type { Telegraf, Context } from 'telegraf';
import { getEmployeeInfo } from './hr-bot-helpers';
import type { TelegramBotsRepository } from './telegram-bots.repository';

export function registerProfileCommands(bot: Telegraf<Context>, repo: TelegramBotsRepository): void {
  bot.command('mening_ballarim', async (ctx: Context) => {
    const chat = (ctx as Context & { chat?: { id?: number } }).chat;
    if (!chat?.id) return;
    const emp = await getEmployeeInfo(chat.id);
    if (!emp) {
      await ctx.reply('🎮 Ballaringizni ko\'rish uchun: <a href="https://erp.europrint.uz">erp.europrint.uz</a>', { parse_mode: 'HTML' });
      return;
    }
    try {
      const data = await repo.getGamificationPoints(emp.id);
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

  bot.command('profil', async (ctx: Context) => {
    const chat = (ctx as Context & { chat?: { id?: number } }).chat;
    if (!chat?.id) return;
    try {
      const r = await repo.getEmployeeProfileByChatId(chat.id);
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

  bot.command('reyting', async (ctx: Context) => {
    const chat = (ctx as Context & { chat?: { id?: number } }).chat;
    if (!chat?.id) return;
    try {
      const r = await repo.getLeaderboard(10);
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

  bot.command('baholash', async (ctx: Context) => {
    const chat = (ctx as Context & { chat?: { id?: number } }).chat;
    if (!chat?.id) return;
    const emp = await getEmployeeInfo(chat.id);
    if (!emp) {
      await ctx.reply('⭐ Baholash natijalarini ko\'rish uchun: <a href="https://erp.europrint.uz">erp.europrint.uz</a>', { parse_mode: 'HTML' });
      return;
    }
    try {
      const r = await repo.getEmployeeEvaluations(emp.id);
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

  bot.command('oqish', async (ctx: Context) => {
    const chat = (ctx as Context & { chat?: { id?: number } }).chat;
    if (!chat?.id) return;
    const emp = await getEmployeeInfo(chat.id);
    if (!emp) {
      await ctx.reply('📚 Kurslaringizni ko\'rish uchun: <a href="https://erp.europrint.uz">erp.europrint.uz</a>', { parse_mode: 'HTML' });
      return;
    }
    try {
      const r = await repo.getEmployeeCourses(emp.id);
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

  bot.command('inventar', async (ctx: Context) => {
    const chat = (ctx as Context & { chat?: { id?: number } }).chat;
    if (!chat?.id) return;
    const emp = await getEmployeeInfo(chat.id);
    if (!emp) {
      await ctx.reply('📦 Inventaringizni ko\'rish uchun: <a href="https://erp.europrint.uz">erp.europrint.uz</a>', { parse_mode: 'HTML' });
      return;
    }
    try {
      const r = await repo.getEmployeeInventory(emp.id);
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
}
