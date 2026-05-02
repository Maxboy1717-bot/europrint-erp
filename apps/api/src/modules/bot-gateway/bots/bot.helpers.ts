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

export async function execSql<T extends Row = Row>(q: SQL, fallback?: T[]): Promise<T[]> {
  return runQuery<T>(q).then((r) => r.rows as T[]).catch((err: unknown) => {
    helperLogger.error({ msg: 'execSql failed', err });
    return fallback ?? [];
  });
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
