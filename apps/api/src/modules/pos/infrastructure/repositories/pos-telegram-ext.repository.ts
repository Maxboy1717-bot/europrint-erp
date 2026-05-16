/**
 * @module pos-telegram-ext.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { sql, db } from '@workspace/db';
import type { SQL, SQLWrapper } from 'drizzle-orm';

import { Injectable } from '@nestjs/common';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> => {
  return (await db.execute(q)).rows as Row[];
};

@Injectable()
export class PosTelegramExtRepository {
  async getUserTelegramId(userId: number): Promise<Result<unknown | null>> {
    return safeCall(async () => {
      const r = await exec(sql`SELECT telegram_id FROM users WHERE id = ${userId} AND telegram_id IS NOT NULL LIMIT 1`);
      return r[0]?.telegram_id ?? null;
      }, 'DB_ERROR');
  }

  async getQcInspectors(): Promise<Result<{ telegram_id: unknown }[]>> {
    return safeCall(async () => {
      const r = await exec(sql`SELECT telegram_id FROM users WHERE role = 'qc_inspector' AND telegram_id IS NOT NULL AND is_active = TRUE`);
      return r as { telegram_id: unknown }[];
      }, 'DB_ERROR');
  }
}
