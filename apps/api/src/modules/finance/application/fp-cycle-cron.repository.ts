import { Injectable, Logger } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';

interface EmployeeRow { id: number; [key: string]: unknown; }
interface ZvsStatsRow { pending: string; approved: string; approved_total: string; [key: string]: unknown; }

type Row = Record<string, unknown>;
const exec = async (q: Parameters<typeof db.execute>[0]): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
export class FpCycleCronRepository {
  private readonly logger = new Logger(FpCycleCronRepository.name);

  async getEmployeeIdsByRoles(roles: string[]): Promise<Result<number[]>> {
    return safeCall(async () => {
      const rows = castTo<EmployeeRow[]>(await exec(sql`SELECT id FROM employees WHERE role = ANY(${roles}::text[]) AND status = 'active' LIMIT 100`));
      return (rows ?? []).map((r) => r.id).filter(Boolean);
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
