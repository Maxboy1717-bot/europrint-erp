import { safeNum } from '@common/math';
import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { execIdealRasmTargetInsert } from '@common/database/queries-remaining';

type Row = Record<string, unknown>;
const exec = (q: Parameters<typeof db.execute>[0]): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

const DEFAULT_TARGETS = [
  { targetName: 'Haftalik Foyda', targetKey: 'weekly_profit', targetValue: '100000000', unit: 'UZS', horizonYears: 3, description: 'Haftalik sof foyda maqsadi' },
  { targetName: 'Haftalik Daromad', targetKey: 'weekly_revenue', targetValue: '800000000', unit: 'UZS', horizonYears: 3, description: 'Haftalik brutto daromad maqsadi' },
  { targetName: 'Filiallar Soni', targetKey: 'branches_count', targetValue: '15', unit: 'ta', horizonYears: 3, description: 'Jami filiallar soni' },
  { targetName: 'Xodimlar Soni', targetKey: 'employees_count', targetValue: '500', unit: 'kishi', horizonYears: 3, description: 'Shtab xodimlari soni' },
  { targetName: 'Bozor Ulushi', targetKey: 'market_share', targetValue: '30', unit: '%', horizonYears: 3, description: "O'zbekiston bozorida ulush" },
];

@Injectable()
export class IdealRasmRepository {
  async ensureSeeded(): Promise<Result<void>>  {
    try {
      const r = await exec(sql`SELECT COUNT(*) AS cnt FROM ideal_rasm_targets`);
      const seedRows = r.ok ? r.data : [];
      if (Number(seedRows[0]?.cnt ?? 0) > 0) return Ok();
      for (const t of DEFAULT_TARGETS) {
        await execIdealRasmTargetInsert(t);
      }
      return Ok();
    } catch { /* table may not exist */ }
    return Ok();
  }

  async getAll(): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT * FROM ideal_rasm_targets ORDER BY id`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getWeeklyRevenue(): Promise<Result<number>>  {
    try {
      const r = await exec(sql`SELECT COALESCE(SUM(amount), 0) AS revenue FROM income_expense_transactions WHERE created_at >= date_trunc('week', CURRENT_DATE)`);
      const rows = r.ok ? r.data : [];
      return Ok(safeNum(rows[0]?.revenue ?? 0));
    } catch { return Ok(0); }
  }

  async getActiveEmployeesCount(): Promise<Result<number>>  {
    try {
      const r = await exec(sql`SELECT COUNT(*) AS cnt FROM employees WHERE status = 'active'`);
      const rows = r.ok ? r.data : [];
      return Ok(parseInt(String(rows[0]?.cnt ?? 0), 10));
    } catch { return Ok(0); }
  }

  async updateTarget(key: string, targetValue: string, horizonYears: number, description: string | null): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`UPDATE ideal_rasm_targets SET target_value = ${targetValue}, horizon_years = ${horizonYears}, description = ${description}, updated_at = NOW() WHERE target_key = ${key} RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }
}
