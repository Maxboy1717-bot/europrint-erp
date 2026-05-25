/**
 * @module pos-lifecycle-block.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { sql, db } from '@workspace/db';
import type { SQL, SQLWrapper } from 'drizzle-orm';

import { Injectable } from '@nestjs/common';
import { execEmployeeIssuanceLogInsert } from '@common/database/queries-remaining';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> => {
  return (await db.execute(q)).rows as Row[];
};

@Injectable()
export class PosLifecycleBlockRepository {
  async getLifecycleRule(userId: number, materialCardId: number): Promise<Result<{ min_interval_days: number; max_qty_per_issue: number; is_indivisible: boolean; last_issued_at: string | null }>> {
    return safeCall(async () => {
      const r = await exec(sql`SELECT mc.min_interval_days, mc.max_qty_per_issue, mc.is_indivisible, COALESCE((SELECT issued_at FROM employee_issuance_log WHERE user_id = ${userId} AND material_card_id = ${materialCardId} ORDER BY issued_at DESC LIMIT 1), NULL) AS last_issued_at FROM material_cards mc WHERE mc.id = ${materialCardId} LIMIT 1`);
      const row = r[0] ?? {};
      return { min_interval_days: Number(row.min_interval_days ?? 0), max_qty_per_issue: Number(row.max_qty_per_issue ?? 0), is_indivisible: Boolean(row.is_indivisible ?? false), last_issued_at: (row.last_issued_at as string) ?? null };
      }, 'DB_ERROR');
  }

  async recordIssuance(userId: number, materialCardId: number): Promise<void> {
    await execEmployeeIssuanceLogInsert(userId, materialCardId);
  }
}
