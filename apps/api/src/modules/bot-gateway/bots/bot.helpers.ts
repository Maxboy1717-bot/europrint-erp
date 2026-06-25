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

export interface BotReply {
  text:    string;
  parse:   'HTML' | 'Markdown' | 'plain';
  success: boolean;
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
// JONLI sxemaga moslangan: zvs / cash_registers / cash_transactions / purchase_invoices.
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
 * /company_state — kassa balansi (cash_registers), 30-kunlik kirim/chiqim
 * (cash_transactions), muddati o'tgan qarzlar soni (purchase_invoices).
 */
export async function buildCompanyStateReply(): Promise<BotReply> {
  const regR = await execSqlResult<{ name: string; current_balance: string }>(drizzleSql`
    SELECT name, current_balance::text FROM cash_registers
    WHERE is_active = true ORDER BY name LIMIT 5
  `, '/company_state:registers');

  const flowR = await execSqlResult<{ total_in: string; total_out: string }>(drizzleSql`
    SELECT
      COALESCE(SUM(CASE WHEN transaction_type='inflow'  THEN amount ELSE 0 END), 0)::text AS total_in,
      COALESCE(SUM(CASE WHEN transaction_type='outflow' THEN amount ELSE 0 END), 0)::text AS total_out
    FROM cash_transactions
    WHERE created_at >= NOW() - INTERVAL '30 days'
  `, '/company_state:flow');

  const overdueR = await execSqlResult<{ cnt: string }>(drizzleSql`
    SELECT COUNT(*)::text AS cnt FROM purchase_invoices
    WHERE payment_status != 'paid' AND due_date < CURRENT_DATE::text
  `, '/company_state:overdue');

  if (!regR.ok || !flowR.ok || !overdueR.ok) {
    return dbErrorReply('Bir yoki bir nechta so\'rov muvaffaqiyatsiz');
  }

  const kassaLines = (Array.isArray(regR.rows) ? regR.rows : []).map((row) =>
    `  💵 ${row.name}: <b>${Number(row.current_balance).toLocaleString('uz')} UZS</b>`
  ).join('\n') || '  (kassalar topilmadi)';

  const flow = flowR.rows[0] ?? { total_in: '0', total_out: '0' };
  const sof = Number(flow.total_in) - Number(flow.total_out);
  const overdue = overdueR.rows[0]?.cnt ?? '0';

  return helpReply(
    `🏢 <b>Kompaniya Holati</b>\n\n` +
    `<b>Kassalar:</b>\n${kassaLines}\n\n` +
    `<b>30-kunlik pul oqimi:</b>\n` +
    `  📥 Kirim: <b>${Number(flow.total_in).toLocaleString('uz')} UZS</b>\n` +
    `  📤 Chiqim: <b>${Number(flow.total_out).toLocaleString('uz')} UZS</b>\n` +
    `  💵 Sof: <b>${sof.toLocaleString('uz')} UZS</b>\n\n` +
    `⚠️ Muddati o'tgan qarzlar: <b>${overdue} ta faktura</b>`
  );
}

/**
 * /weekly_digest — 7 kunlik moliyaviy xulosa: kirim, chiqim, sof, top-3 xarajat kategoriyasi.
 */
export async function buildWeeklyDigestReply(): Promise<BotReply> {
  const summaryR = await execSqlResult<{ total_in: string; total_out: string }>(drizzleSql`
    SELECT
      COALESCE(SUM(CASE WHEN transaction_type='inflow'  THEN amount ELSE 0 END), 0)::text AS total_in,
      COALESCE(SUM(CASE WHEN transaction_type='outflow' THEN amount ELSE 0 END), 0)::text AS total_out
    FROM cash_transactions
    WHERE created_at >= NOW() - INTERVAL '7 days'
  `, '/weekly_digest:summary');

  const catR = await execSqlResult<{ category_id: string; total: string }>(drizzleSql`
    SELECT category_id::text AS category_id, SUM(amount)::text AS total
    FROM cash_transactions
    WHERE created_at >= NOW() - INTERVAL '7 days'
      AND transaction_type = 'outflow'
      AND category_id IS NOT NULL
    GROUP BY category_id
    ORDER BY SUM(amount) DESC
    LIMIT 3
  `, '/weekly_digest:categories');

  if (!summaryR.ok) return dbErrorReply(summaryR.error);

  const s = summaryR.rows[0] ?? { total_in: '0', total_out: '0' };
  const sof = Number(s.total_in) - Number(s.total_out);

  const catLines = catR.ok && Array.isArray(catR.rows) && catR.rows.length
    ? catR.rows.map((cRow, i) =>
        `  ${i + 1}. Kategoriya #${cRow.category_id ?? 'Boshqa'}: <b>${Number(cRow.total).toLocaleString('uz')} UZS</b>`
      ).join('\n')
    : '  (ma\'lumot yo\'q)';

  return helpReply(
    `📊 <b>7-Kunlik Moliyaviy Xulosa</b>\n\n` +
    `  📥 Kirim: <b>${Number(s.total_in).toLocaleString('uz')} UZS</b>\n` +
    `  📤 Chiqim: <b>${Number(s.total_out).toLocaleString('uz')} UZS</b>\n` +
    `  💵 Sof: <b>${sof.toLocaleString('uz')} UZS</b>\n\n` +
    `<b>Top-3 Xarajat Kategoriyasi:</b>\n${catLines}`
  );
}
