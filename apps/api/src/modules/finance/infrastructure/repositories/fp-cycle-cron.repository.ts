/**
 * @module fp-cycle-cron.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (Finance)
 */

import { Injectable, Logger } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db , runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';
import type { IFpCycleCronRepo, ZvsStatsRow } from '../../domain/repositories/i-fp-cycle-cron.repo';

interface EmployeeRow { id: number; [key: string]: unknown; }

export type { ZvsStatsRow };

type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
export class FpCycleCronRepository implements IFpCycleCronRepo {
  private readonly logger = new Logger(FpCycleCronRepository.name);

  async getEmployeeIdsByRoles(roles: string[]): Promise<Result<number[]>> {
    return safeCall(async () => {
      const rows = castTo<EmployeeRow[]>(await exec(sql`SELECT id FROM employees WHERE role = ANY(${roles}::text[]) AND status = 'active' LIMIT 100`));
      return (Array.isArray(rows) ? rows : []).map((r) => r.id).filter(Boolean);
    }, 'DB_ERROR');
  }

  async getPendingZvsCount(weekStart: string): Promise<Result<number>> {
    return safeCall(async () => {
      const rows = await exec(sql`SELECT COUNT(*) AS cnt FROM zvs WHERE status = 'pending' AND week_date = ${weekStart}`);
      return parseInt(String(rows[0]?.cnt ?? '0'));
    }, 'DB_ERROR');
  }

  async getZvsStats(weekStart: string): Promise<Result<ZvsStatsRow>> {
    return safeCall(async () => {
      const rows = await exec(sql`SELECT COUNT(*) FILTER (WHERE status = 'pending') AS pending, COUNT(*) FILTER (WHERE status = 'approved') AS approved, COALESCE(SUM(amount) FILTER (WHERE status = 'approved'), 0) AS approved_total FROM zvs WHERE week_date = ${weekStart}`);
      return (rows[0] as ZvsStatsRow) ?? { pending: '0', approved: '0', approved_total: '0' };
    }, 'DB_ERROR');
  }
}
