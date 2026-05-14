/**
 * @module db-rows
 * @description Source module. See exports for details.
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
