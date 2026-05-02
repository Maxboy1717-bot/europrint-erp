import { safeNum } from '@common/math';
import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Result, Err, Ok } from '@common/types/result.type';
import { FinanceRow } from '../../domain/repositories/i-finance.repo';

import { MS_PER_DAY } from '@common/constants/app.constants';
type Row = Record<string, unknown>;
const exec = async (q: Parameters<typeof db.execute>[0]): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
export class FinanceReportRepo {
  private readonly logger = new Logger(FinanceReportRepo.name);

  async getArAging(): Promise<Result<FinanceRow[]>> {
    try {
      const allInvoices = await exec(sql`SELECT * FROM fi_invoices WHERE status != 'paid'`);
      const today = _time.now();
      const buckets: Record<string, Row[]> = { '0-30': [], '31-60': [], '61-90': [], '90+': [] };
      for (const invoice of allInvoices) {
        if (!invoice['due_date']) continue;
        const daysOverdue = Math.floor((today.getTime() - new Date(String(invoice['due_date'])).getTime()) / MS_PER_DAY);
        if (daysOverdue <= 30) { buckets['0-30'].push(invoice); }
        else if (daysOverdue <= 60) { buckets['31-60'].push(invoice); }
        else if (daysOverdue <= 90) { buckets['61-90'].push(invoice); }
        else { buckets['90+'].push(invoice); }
      }
      const result = Object.entries(buckets).map(([bucket, items]) => ({ bucket, count: items.length, total: (items ?? []).reduce((sum, inv) => sum + safeNum(inv['total_amount'] ?? '0'), 0), items }));
      return Ok(castTo<FinanceRow[]>(result));
    } catch (error: unknown) { return Err((error as Error).message); }
  }

  async getCashFlow(from: Date, to: Date): Promise<Result<{ inflows: number; outflows: number; netFlow: number; from: Date; to: Date }>> {
    try {
      const [inflowRows, outflowRows] = await Promise.all([
        exec(sql`SELECT COALESCE(SUM(total_amount), 0) AS total FROM fi_invoices WHERE status = 'paid' AND updated_at BETWEEN ${from} AND ${to}`),
        exec(sql`SELECT COALESCE(SUM(total_credit), 0) AS total FROM gl_journal_entries WHERE created_at BETWEEN ${from} AND ${to}`),
      ]);
      const totalInflows = safeNum(inflowRows[0]?.total || '0');
      const totalOutflows = safeNum(outflowRows[0]?.total || '0');
      return { ok: true, data: { inflows: totalInflows, outflows: totalOutflows, netFlow: totalInflows - totalOutflows, from, to } };
    } catch (error: unknown) { return Err((error as Error).message); }
  }

  async getAdvanceSummary(): Promise<Result<FinanceRow[]>> {
    try {
      const orders = await exec(sql`SELECT id, order_number, customer_name, total_amount, advance_percent, status FROM sales_orders WHERE CAST(advance_percent AS NUMERIC) < 70 AND status NOT IN ('cancelled', 'completed')`);
      const summary = (orders ?? []).map((order) => ({ id: order['id'], order_number: order['order_number'], customer_name: order['customer_name'], total_amount: order['total_amount'], advance_percent: order['advance_percent'], advance_due: safeNum(order['total_amount'] ?? '0') * (1 - safeNum(order['advance_percent'] ?? '0') / 100), status: order['status'] }));
      return Ok(castTo<FinanceRow[]>(summary));
    } catch (error: unknown) { return Err((error as Error).message); }
  }
}
