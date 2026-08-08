/**
 * @module bot.helpers
 * @description Source module. See exports for details.
 */

import { Logger } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { sql as drizzleSql, SQL } from 'drizzle-orm';
export { drizzleSql as sql };

const helperLogger = new Logger('BotHelpers');

export type Row = Record<string, unknown>;

/**
 * Telegram inline-keyboard button. `callback_data` re-invokes the same bot
 * webhook with the button payload as the message text (item 18-notif#17 —
 * bot inline keyboard is the PRIMARY channel at night). `url` opens a link.
 */
export interface InlineKeyboardButton {
  text:           string;
  callback_data?: string;
  url?:           string;
}

/** Rows of inline buttons — maps 1:1 to Telegram's reply_markup.inline_keyboard. */
export type InlineKeyboard = InlineKeyboardButton[][];

export interface BotReply {
  text:    string;
  parse:   'HTML' | 'Markdown' | 'plain';
  success: boolean;
  /** Optional inline keyboard; controller emits it as reply_markup.inline_keyboard. */
  replyMarkup?: InlineKeyboard;
}

export interface BotMessage {
  chatId:      string;
  userId?:     string;
  text:        string;
  command?:    string;
  employeeId?: number;
  role?:       string;
}

/**
 * SQL query result wrapper. Either `ok` with `rows`, or `error` with the
 * underlying message so the bot can show a user-friendly DB-error reply
 * instead of silently returning [].
 */
export type SqlOk<T> = { ok: true; rows: T[] };
export type SqlErr   = { ok: false; error: string };
export type SqlResult<T> = SqlOk<T> | SqlErr;

/**
 * Execute a query and return a Result-pattern wrapper.
 * Use this for any command where the user must distinguish between
 * "no data" (rows: []) and "DB error" (ok: false).
 */
export async function execSqlResult<T extends Row = Row>(
  q: SQL,
  context?: string,
): Promise<SqlResult<T>> {
  try {
    const r = await runQuery<T>(q);
    return { ok: true, rows: r.rows as T[] };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    helperLogger.error({ msg: 'execSql failed', context, err: message });
    return { ok: false, error: message };
  }
}

/**
 * Legacy helper — returns rows[] or empty fallback. Kept for backwards
 * compatibility. DEPRECATED: prefer execSqlResult() so bots can show
 * "DB error" replies instead of silently rendering "no data".
 *
 * Callers that pass a hardcoded fallback like [{ cnt: '0' }] mask DB
 * failures from the user. Migrate to execSqlResult().
 */
export async function execSql<T extends Row = Row>(q: SQL, fallback?: T[]): Promise<T[]> {
  return runQuery<T>(q).then((r) => r.rows as T[]).catch((err: unknown) => {
    helperLogger.error({ msg: 'execSql failed', err });
    return fallback ?? [];
  });
}

/**
 * Reply used when a SQL query failed. Renders a consistent "DB error" message
 * to the user (Uzbek) so they don't mistake it for "no data".
 */
export function dbErrorReply(detail?: string): BotReply {
  const tail = detail ? `\n<code>${detail.slice(0, 120)}</code>` : '';
  return {
    text: `❌ <b>Maʼlumotlar bazasi xatosi</b>. Birozdan keyin qayta urinib koʻring.${tail}`,
    parse: 'HTML',
    success: false,
  };
}

export function helpReply(text: string): BotReply {
  return { text, parse: 'HTML', success: true };
}

/**
 * Reply that renders inline-keyboard action buttons (item 18-notif#17). Each
 * button's callback_data re-enters the bot handler, so a night-shift user can
 * tap instead of typing the command.
 */
export function keyboardReply(text: string, replyMarkup: InlineKeyboard): BotReply {
  return { text, parse: 'HTML', success: true, replyMarkup };
}

export function deniedReply(role?: string): BotReply {
  return {
    text: `🚫 <b>Ruxsat yo'q</b>. Bu buyruq uchun sizning rolingiz (<code>${role ?? 'unknown'}</code>) yetarli emas.`,
    parse: 'HTML',
    success: false,
  };
}

/**
 * Centralized permission registry for all Telegram bots.
 * Each key is the bot slug; values are the allowed ERP roles (lowercase).
 * super_admin always bypasses this check inside hasPermission().
 */
export const BOT_PERMISSIONS: Record<string, readonly string[]> = {
  crm:      ['crm_manager', 'sales_manager', 'sales_rep', 'director'],
  director: ['director', 'ceo', 'cfo', 'coo'],
  fin:      ['finance_manager', 'accountant', 'chief_accountant', 'director'],
  hr:       ['hr_manager', 'hr_specialist', 'director'],
  logistics:['logistics_manager', 'logistics_specialist', 'driver', 'director'],
  mes:      ['mes_operator', 'production_manager', 'shift_supervisor', 'director'],
  ombor:    ['warehouse_manager', 'storekeeper', 'procurement_manager', 'director'],
  pos:      ['cashier', 'pos_manager', 'store_manager', 'director'],
  qc:       ['qc_inspector', 'qc_manager', 'production_manager', 'director'],
} as const;

export type BotSlug = keyof typeof BOT_PERMISSIONS;

/**
 * Returns true if the user's role is in the allowed list.
 * Comparison is case-insensitive — DB may store 'super_admin' or 'SUPER_ADMIN'.
 * super_admin/SUPER_ADMIN always passes.
 */
export function hasPermission(role: string | undefined, allowed: readonly string[]): boolean {
  if (!role) return false;
  const normalised = role.toLowerCase();
  if (normalised === 'super_admin') return true;
  return allowed.some((a) => a.toLowerCase() === normalised);
}

/**
 * Convenience: check permission using the centralized BOT_PERMISSIONS registry.
 */
export function hasBotPermission(slug: BotSlug, role: string | undefined): boolean {
  return hasPermission(role, BOT_PERMISSIONS[slug]);
}

// ============================================================
// EP-FIN-028: ShVB Telegram bot komandalar (Finance) — helper funksiyalar.
// fin.bot.ts ulardan foydalanadi (bu fayl boshqa paket — bu yerda faqat eksport).
// execSqlResult<T> ishlatiladi (deprecated execSql EMAS — Q-40). Barcha so'rovlar
// JONLI sxemaga moslangan: zvs / cashier_shifts / cashier_movements / finance_invoices.
// ============================================================

// type (interface emas) — execSqlResult<T> ning Row (Record<string, unknown>) constraint'ini qondiradi.
export type ZvsStatusRow = {
  status: string;
  count: string;
  total_amount: string;
};

/**
 * /zvs_status — joriy oy ZVS so'rovlari: status bo'yicha soni + umumiy summa.
 * `zvs` jadvali (status, amount, created_at). DB xatosida graceful dbErrorReply.
 */
export async function buildZvsStatusReply(): Promise<BotReply> {
  const r = await execSqlResult<ZvsStatusRow>(drizzleSql`
    SELECT
      status,
      COUNT(*)::text                 AS count,
      COALESCE(SUM(amount), 0)::text AS total_amount
    FROM zvs
    WHERE created_at >= date_trunc('month', NOW())
    GROUP BY status
    ORDER BY status
  `, '/zvs_status');

  if (!r.ok) return dbErrorReply(r.error);
  if (!r.rows.length) {
    return helpReply('📋 <b>ZVS holati</b>\nBu oyda hech qanday so\'rov yo\'q.');
  }

  const lines = (Array.isArray(r.rows) ? r.rows : []).map((row) =>
    `  • <b>${row.status}</b>: ${row.count} ta — ${Number(row.total_amount).toLocaleString('uz')} UZS`
  );
  return helpReply(`📋 <b>Bu Oy ZVS Holati</b>\n\n${lines.join('\n')}`);
}

/**
 * /company_state — ochiq kassir smenalari balansi (cashier_shifts + cashier_movements,
 * fi-cashier-hub kanonik), 30-kunlik kirim/chiqim (cashier_movements), muddati
 * o'tgan qarzlar soni (finance_invoices). Retired cash_registers/cash_transactions
 * o'rniga cashier-hub'dan o'qiydi (retail-kassa retiring, egasi 2026-07-01).
 */
export async function buildCompanyStateReply(): Promise<BotReply> {
  // Ochiq smena kassasi = opened_amount + Σ(cash_in) − Σ(cash_out/salary_payout/advance/expense).
  const regR = await execSqlResult<{ name: string; current_balance: string }>(drizzleSql`
    SELECT
      COALESCE(u.full_name, u.username) AS name,
      (cs.opened_amount
        + COALESCE(SUM(CASE WHEN cm.type = 'cash_in' THEN cm.amount ELSE -cm.amount END), 0)
      )::text AS current_balance
    FROM cashier_shifts cs
    JOIN users u ON u.id = cs.cashier_user_id
    LEFT JOIN cashier_movements cm ON cm.shift_id = cs.id
    WHERE cs.status = 'open'
    GROUP BY cs.id, u.full_name, u.username, cs.opened_amount
    ORDER BY name
    LIMIT 5
  `, '/company_state:shifts');

  const flowR = await execSqlResult<{ total_in: string; total_out: string }>(drizzleSql`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'cash_in' THEN amount ELSE 0 END), 0)::text AS total_in,
      COALESCE(SUM(CASE WHEN type <> 'cash_in' THEN amount ELSE 0 END), 0)::text AS total_out
    FROM cashier_movements
    WHERE created_at >= NOW() - INTERVAL '30 days'
  `, '/company_state:flow');

  // finance_invoices (invoice_type='purchase') = kanonik AP invoice-manba, OWNER QARORI
  // 2026-07-02 (purchase_invoices endi yozuvchisiz — commit d6286993).
  const overdueR = await execSqlResult<{ cnt: string }>(drizzleSql`
    SELECT COUNT(*)::text AS cnt FROM finance_invoices
    WHERE invoice_type = 'purchase' AND payment_status != 'paid' AND due_date < CURRENT_DATE
  `, '/company_state:overdue');

  if (!regR.ok || !flowR.ok || !overdueR.ok) {
    return dbErrorReply('Bir yoki bir nechta so\'rov muvaffaqiyatsiz');
  }

  const kassaLines = (Array.isArray(regR.rows) ? regR.rows : []).map((row) =>
    `  💵 ${row.name}: <b>${Number(row.current_balance).toLocaleString('uz')} UZS</b>`
  ).join('\n') || '  (ochiq kassir smenasi yo\'q)';

  const flow = flowR.rows[0] ?? { total_in: '0', total_out: '0' };
  const sof = Number(flow.total_in) - Number(flow.total_out);
  const overdue = overdueR.rows[0]?.cnt ?? '0';

  return helpReply(
    `🏢 <b>Kompaniya Holati</b>\n\n` +
    `<b>Ochiq kassir smenalari:</b>\n${kassaLines}\n\n` +
    `<b>30-kunlik pul oqimi:</b>\n` +
    `  📥 Kirim: <b>${Number(flow.total_in).toLocaleString('uz')} UZS</b>\n` +
    `  📤 Chiqim: <b>${Number(flow.total_out).toLocaleString('uz')} UZS</b>\n` +
    `  💵 Sof: <b>${sof.toLocaleString('uz')} UZS</b>\n\n` +
    `⚠️ Muddati o'tgan qarzlar: <b>${overdue} ta faktura</b>`
  );
}

/** Kassir harakat turi → o'zbekcha yorliq (weekly digest top-xarajat qatorlari). */
const CASHIER_MOVEMENT_LABELS: Record<string, string> = {
  cash_out:      'Naqd chiqim',
  salary_payout: 'Ish haqi to\'lovi',
  advance:       'Avans',
  expense:       'Xarajat',
};

/**
 * /weekly_digest — 7 kunlik moliyaviy xulosa: kirim, chiqim, sof, top-3 xarajat turi.
 * Retired cash_transactions o'rniga cashier_movements (fi-cashier-hub kanonik)dan o'qiydi.
 */
export async function buildWeeklyDigestReply(): Promise<BotReply> {
  const summaryR = await execSqlResult<{ total_in: string; total_out: string }>(drizzleSql`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'cash_in' THEN amount ELSE 0 END), 0)::text AS total_in,
      COALESCE(SUM(CASE WHEN type <> 'cash_in' THEN amount ELSE 0 END), 0)::text AS total_out
    FROM cashier_movements
    WHERE created_at >= NOW() - INTERVAL '7 days'
  `, '/weekly_digest:summary');

  const catR = await execSqlResult<{ category: string; total: string }>(drizzleSql`
    SELECT type AS category, SUM(amount)::text AS total
    FROM cashier_movements
    WHERE created_at >= NOW() - INTERVAL '7 days'
      AND type <> 'cash_in'
    GROUP BY type
    ORDER BY SUM(amount) DESC
    LIMIT 3
  `, '/weekly_digest:categories');

  if (!summaryR.ok) return dbErrorReply(summaryR.error);

  const s = summaryR.rows[0] ?? { total_in: '0', total_out: '0' };
  const sof = Number(s.total_in) - Number(s.total_out);

  const catLines = catR.ok && Array.isArray(catR.rows) && catR.rows.length
    ? catR.rows.map((cRow, i) =>
        `  ${i + 1}. ${CASHIER_MOVEMENT_LABELS[cRow.category] ?? cRow.category ?? 'Boshqa'}: <b>${Number(cRow.total).toLocaleString('uz')} UZS</b>`
      ).join('\n')
    : '  (ma\'lumot yo\'q)';

  return helpReply(
    `📊 <b>7-Kunlik Moliyaviy Xulosa</b>\n\n` +
    `  📥 Kirim: <b>${Number(s.total_in).toLocaleString('uz')} UZS</b>\n` +
    `  📤 Chiqim: <b>${Number(s.total_out).toLocaleString('uz')} UZS</b>\n` +
    `  💵 Sof: <b>${sof.toLocaleString('uz')} UZS</b>\n\n` +
    `<b>Top-3 Xarajat Turi:</b>\n${catLines}`
  );
}
