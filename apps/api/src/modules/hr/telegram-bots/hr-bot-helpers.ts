import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Logger } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { errMsg } from '../hr-v2-error';
import { execHrSickReportInsert, execHrLeaveRequestInsert } from '@common/database/queries-bots';
import type { Context } from 'telegraf';

type Row = Record<string, unknown>;

export type SickStep = 'awaiting_days' | 'awaiting_reason' | 'awaiting_document';
export type SickSession = { flow: 'sick'; step: SickStep; days?: number; reason?: string };
export type LeaveStep = 'awaiting_start' | 'awaiting_end' | 'awaiting_reason';
export type LeaveSession = { flow: 'leave'; step: LeaveStep; startDate?: string; endDate?: string };
export type HrSession = SickSession | LeaveSession;

export const MENU_TEXT =
  '👋 <b>EuroPrint HR Bot</b>\n\n' +
  'Quyidagilardan birini tanlang:\n\n' +
  '/kasalman — 🏥 Kasallik varaqasi topshirish\n' +
  '/tatil — 🌴 Ta\'til qoldig\'ini va so\'rovini ko\'rish\n' +
  '/hisobot — 📊 Kunlik hisobot holati\n' +
  '/mening_ballarim — 🎮 Gamifikatsiya ballarim\n' +
  '/bekor — ❌ Amalni bekor qilish';

const log = new Logger('HrBotHelpers');

export async function getEmployeeInfo(chatId: number): Promise<{ id: number; first_name: string; last_name: string } | null> {
  try {
    const rows = await runQuery<Row>(sql`SELECT * FROM employees WHERE telegram_chat_id = ${String(chatId)} AND status = 'active' LIMIT 1`);
    return (rows.rows[0] ?? null) as { id: number; first_name: string; last_name: string } | null;
  } catch (e) { log.warn('[HrBot] getEmployeeInfo failed', String(e)); return null; }
}

export async function getLeaveBalance(employeeId: number): Promise<number> {
  try {
    const rows = await runQuery<{ remaining_days: number }>(sql`
      SELECT remaining_days FROM hr_leave_balances
      WHERE employee_id = ${employeeId} AND leave_type = 'annual' AND year = EXTRACT(YEAR FROM CURRENT_DATE) LIMIT 1
    `);
    return Number(rows.rows[0]?.remaining_days ?? 0);
  } catch { return 0; }
}

export async function saveSickReport(employeeId: number, days: number, reason: string, documentFileId?: string): Promise<boolean> {
  try {
    await execHrSickReportInsert(employeeId, days, reason, documentFileId ?? null);
    return true;
  } catch (err) { log.error(`saveSickReport error: ${errMsg(err as Error)}`); return false; }
}

export async function saveLeaveRequest(employeeId: number, startDate: string, endDate: string, reason: string): Promise<boolean> {
  try {
    await execHrLeaveRequestInsert(employeeId, startDate, endDate, reason);
    return true;
  } catch (err) { log.error(`saveLeaveRequest error: ${errMsg(err as Error)}`); return false; }
}

export async function getDailyReportStatus(employeeId: number): Promise<string> {
  try {
    const today = _time.now().toISOString().split('T')[0];
    const rows = await runQuery<{ status: string }>(sql`SELECT status FROM hr_daily_reports WHERE employee_id = ${employeeId} AND report_date::date = ${today}::date LIMIT 1`);
    if (!rows.rows[0]) return 'not_submitted';
    return String(rows.rows[0].status);
  } catch { return 'unknown'; }
}

export async function handleSickFlow(ctx: Context, chatId: number, text: string, session: SickSession, sessions: Map<number, HrSession>): Promise<void> {
  if (session.step === 'awaiting_days') {
    const days = parseInt(text, 10);
    if (isNaN(days) || days < 1 || days > 60) { await ctx.reply('⚠️ Iltimos, to\'g\'ri kun sonini kiriting (1-60 orasida):'); return; }
    session.days = days; session.step = 'awaiting_reason'; sessions.set(chatId, session);
    await ctx.reply(`✅ ${days} kun qabul qilindi.\n\nKasallik sababini yozing (masalan: Gripp, harorat):`, { parse_mode: 'HTML' });
  } else if (session.step === 'awaiting_reason') {
    if (text.trim().length < 3) { await ctx.reply('⚠️ Sabab kamida 3 ta belgi bo\'lishi kerak:'); return; }
    session.reason = text.trim(); session.step = 'awaiting_document'; sessions.set(chatId, session);
    await ctx.reply('📎 Kasallik hujjatini (varaq/sertifikat) yuboring.\n\nHujjat yo\'q bo\'lsa /skip ni bosing.');
  } else if (session.step === 'awaiting_document') {
    if (text.trim().toLowerCase() === '/skip' || text.trim().toLowerCase() === 'skip') {
      const emp = await getEmployeeInfo(chatId);
      if (!emp) { await ctx.reply('⚠️ Siz ERP tizimida topilmadingiz. HR bo\'limiga murojaat qiling.'); sessions.delete(chatId); return; }
      const saved = await saveSickReport(emp.id, session.days ?? 0, session.reason ?? '');
      if (!saved) { await ctx.reply('⚠️ Texnik xatolik yuz berdi. Iltimos, qayta urinib ko\'ring yoki HR bo\'limiga murojaat qiling.'); return; }
      sessions.delete(chatId);
      await ctx.reply(`✅ <b>Kasallik ma'lumoti qabul qilindi!</b>\n\n📅 Kun soni: ${session.days}\n📝 Sabab: ${session.reason}\n📄 Hujjat: Yuklanmagan\n\nHR bo'limi ko'rib chiqadi.`, { parse_mode: 'HTML' });
    } else { await ctx.reply('📎 Iltimos, hujjat faylini yuboring yoki /skip kiriting (hujjatsiz):'); }
  }
}

export async function handleLeaveFlow(ctx: Context, chatId: number, text: string, session: LeaveSession, sessions: Map<number, HrSession>): Promise<void> {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (session.step === 'awaiting_start') {
    if (!dateRegex.test(text.trim())) { await ctx.reply('⚠️ Format noto\'g\'ri. YYYY-MM-DD formatida kiriting:\nMasalan: 2025-07-01'); return; }
    session.startDate = text.trim(); session.step = 'awaiting_end'; sessions.set(chatId, session);
    await ctx.reply(`✅ Boshlanish: ${session.startDate}\n\nTugash sanasini kiriting (YYYY-MM-DD):`);
  } else if (session.step === 'awaiting_end') {
    if (!dateRegex.test(text.trim())) { await ctx.reply('⚠️ Format noto\'g\'ri. YYYY-MM-DD formatida kiriting:'); return; }
    if (text.trim() <= (session.startDate ?? '')) { await ctx.reply('⚠️ Tugash sanasi boshlanish sanasidan keyin bo\'lishi kerak:'); return; }
    session.endDate = text.trim(); session.step = 'awaiting_reason'; sessions.set(chatId, session);
    await ctx.reply(`✅ Tugash: ${session.endDate}\n\nTa'til sababini yozing:`);
  } else if (session.step === 'awaiting_reason') {
    if (text.trim().length < 3) { await ctx.reply('⚠️ Sabab kamida 3 ta belgi bo\'lishi kerak:'); return; }
    const reason = text.trim();
    const emp = await getEmployeeInfo(chatId);
    if (!emp) { await ctx.reply('⚠️ Siz ERP tizimida topilmadingiz. HR bo\'limiga murojaat qiling.'); sessions.delete(chatId); return; }
    const saved = await saveLeaveRequest(emp.id, String(session.startDate ?? ''), String(session.endDate ?? ''), reason);
    if (!saved) { await ctx.reply('⚠️ Texnik xatolik yuz berdi. Iltimos, qayta urinib ko\'ring yoki HR bo\'limiga murojaat qiling.'); return; }
    sessions.delete(chatId);
    await ctx.reply(`✅ <b>Ta'til so'rovi yuborildi!</b>\n\n📅 ${session.startDate} dan ${session.endDate} gacha\n📝 Sabab: ${reason}\n\nHR bo'limi ko'rib chiqadi va javob beradi.`, { parse_mode: 'HTML' });
  }
}
