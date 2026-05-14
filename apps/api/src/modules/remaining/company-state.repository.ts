/**
 * @module company-state.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;
const exec = async (q: Parameters<typeof db.execute>[0]): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
export class CompanyStateRepository {
  async getRevenue(): Promise<Result<number>> {
    return safeCall(async () => {
      const r = await exec(sql`SELECT COALESCE(SUM(total_amount), 0) AS total FROM sales_invoices WHERE payment_status = 'paid' AND created_at >= date_trunc('month', CURRENT_DATE)`);
      return Number(r[0]?.total ?? 0);
      }, 'DB_ERROR');
  }

  async getExpenses(): Promise<Result<number>> {
    return safeCall(async () => {
      const r = await exec(sql`SELECT COALESCE(SUM(total_amount), 0) AS total FROM purchase_invoices WHERE payment_status IN ('paid', 'partial') AND created_at >= date_trunc('month', CURRENT_DATE)`);
      return Number(r[0]?.total ?? 0);
      }, 'DB_ERROR');
  }

  async getEmployeeStats(): Promise<Result<{ total: number; active: number }>> {
    return safeCall(async () => {
      const r = await exec(sql`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status = 'active') AS active FROM employees`);
      const row = r[0];
      return { total: Math.max(1, Number(row?.total ?? 1)), active: Number(row?.active ?? 0) };
      }, 'DB_ERROR');
  }

  async getActiveOrderCount(): Promise<Result<number>> {
    return safeCall(async () => {
      const r = await exec(sql`SELECT COUNT(*) AS cnt FROM sales_orders WHERE status NOT IN ('cancelled', 'fully_paid', 'delivered')`);
      return Number(r[0]?.cnt ?? 0);
      }, 'DB_ERROR');
  }
}
