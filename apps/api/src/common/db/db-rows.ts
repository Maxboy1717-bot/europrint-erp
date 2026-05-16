/**
 * @module common/db/db-rows
 * @description DB row helpers (formerly trapped inside the HR bounded context).
 * Provides small utilities for handling raw SQL result shapes returned by Drizzle:
 *   - `dbRows<T>(result)` / `rows`  → coerce result to T[] regardless of whether
 *     the driver returned a bare array or `{ rows: T[] }`.
 *   - `dbRow<T>(result)`            → first row helper.
 *   - `dbCatch(context)`            → safe catch handler that logs and returns
 *     `{ rows: [] }` so the caller can keep .rows access uniform.
 *   - `unwrapError(err)`            → stringify unknown error.
 *   - `safeInt(val, fallback)`      → parseInt with fallback.
 *   - `castTo<T>(v)`                → boundary cast helper.
 *
 * NOTE (PA2-15): This file is the canonical location. A back-compat shim lives
 * at `apps/api/src/modules/hr/common/db-rows.ts` re-exporting from here so the
 * 42 existing import sites continue to work until they are migrated.
 */

import { Logger } from '@nestjs/common';

export type DbRow = Record<string, unknown>;

export function dbRows<T extends DbRow = DbRow>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  const r = result as { rows?: T[] };
  return r.rows ?? [];
}

export const rows = dbRows;

export function dbRow<T extends DbRow = DbRow>(result: unknown): T | undefined {
  return dbRows<T>(result)[0];
}

export function unwrapError(err: unknown): string {
  return err instanceof Error ? (err as Error).message : String(err);
}

export function safeInt(val: unknown, fallback: number): number {
  const n = parseInt(String(val), 10);
  return Number.isFinite(n) ? n : fallback;
}

const _logger = new Logger('DbRows');

export function dbCatch(context: string) {
  return (err: unknown): { rows: [] } => {
    const msg = err instanceof Error ? err.message : String(err);
    _logger.error(`[db:${context}] query failed: ${msg}`);
    return { rows: [] };
  };
}

/** Cast any value to a typed result. Use at repository/service boundary only. */
export const castTo = <T>(v: unknown): T => v as T;
