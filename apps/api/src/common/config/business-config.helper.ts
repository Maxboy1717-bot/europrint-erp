/**
 * @module business-config.helper
 * @description Shared lookup for business thresholds that should be adjustable
 * without a code deploy (HITL amounts, variance tolerances, etc.), backed by the
 * existing generic key-value `settings` table. Falls back to the caller-supplied
 * default when no row exists for the key -- mirrors the DB-first/constant-fallback
 * pattern already used for exchange_rates (M2, 2026-07-05).
 */
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';

export async function getConfigNumber(key: string, fallback: number): Promise<number> {
  try {
    const r = await rawSql(sql`SELECT value FROM settings WHERE key = ${key} LIMIT 1`);
    const rows = (r as { rows?: Record<string, unknown>[] }).rows ?? [];
    const raw = rows[0]?.['value'];
    if (raw === undefined || raw === null) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
}

export async function getConfigString(key: string, fallback: string): Promise<string> {
  try {
    const r = await rawSql(sql`SELECT value FROM settings WHERE key = ${key} LIMIT 1`);
    const rows = (r as { rows?: Record<string, unknown>[] }).rows ?? [];
    const raw = rows[0]?.['value'];
    if (raw === undefined || raw === null || String(raw).trim() === '') return fallback;
    return String(raw);
  } catch {
    return fallback;
  }
}
