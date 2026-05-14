/**
 * @module drizzle-finance-report.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { safeNum } from '@common/math';
import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Result, Err, Ok } from '@common/types/result.type';
import { FinanceRow } from '../../domain/repositories/i-finance.repo';

type Row = Record<string, unknown>;
const exec = async (q: Parameters<typeof db.execute>[0]): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
export class FinanceReportRepo {
  private readonly logger = new Logger(FinanceReportRepo.name);

  async getArAging(): Promise<Result<FinanceRow[]>> {
    try {
      // Bucketing is done in SQL to avoid fetching all rows into memory and to correctly
      // exclude not-yet-overdue invoices (negative daysOverdue) from the 0-30 bucket.
      const rows = await exec(sql`
        SELECT
          customer_id,
          customer_name,
          SUM(CASE WHEN CURRENT_DATE <= due_date
                THEN total_amount - COALESCE(paid_amount, 0) ELSE 0 END)::numeric AS current_amount,
          SUM(CASE WHEN CURRENT_DATE - due_date BETWEEN 1 AND 30
                THEN total_amount - COALESCE(paid_amount, 0) ELSE 0 END)::numeric AS days_1_30,
          SUM(CASE WHEN CURRENT_DATE - due_date BETWEEN 31 AND 60
                THEN total_amount - COALESCE(paid_amount, 0) ELSE 0 END)::numeric AS days_31_60,
          SUM(CASE WHEN CURRENT_DATE - due_date BETWEEN 61 AND 90
                THEN total_amount - COALESCE(paid_amount, 0) ELSE 0 END)::numeric AS days_61_90,
          SUM(CASE WHEN CURRENT_DATE - due_date > 90
                THEN total_amount - COALESCE(paid_amount, 0) ELSE 0 END)::numeric AS days_over_90,
          SUM(total_amount - COALESCE(paid_amount, 0))::numeric AS total_outstanding
        FROM fi_invoices
        WHERE payment_status != 'paid' OR status != 'paid'
        GROUP BY customer_id, customer_name
        ORDER BY total_outstanding DESC
        LIMIT 100
      `);
      return Ok(castTo<FinanceRow[]>(rows));
    } catch (error: unknown) { return Err((error as Error).message); }
  }

  async getCashFlow(from: Date, to: Date): Promise<Result<{ inflows: number; outflows: number; netFlow: number; from: Date; to: Date }>> {
    try {
      const [receiptRows, expenseRows, payrollRows] = await Promise.all([
        // Inflows: paid invoices filtered by payment_date (actual cash receipt date)
        exec(sql`SELECT COALESCE(SUM(total_amount), 0) AS total FROM fi_invoices WHERE status = 'paid' AND payment_date BETWEEN ${from} AND ${to}`),
        // Outflows part 1: expense GL entries — exclude payroll/advance source_type to
        // avoid double-counting with the payroll_advances query below.
        exec(sql`
          SELECT COALESCE(SUM(total_debit), 0) AS total
          FROM gl_journal_entries
          WHERE entry_date BETWEEN ${from} AND ${to}
            AND source_type NOT IN ('payroll', 'advance', 'salary')
            AND (
              account_type = 'expense'
              OR account_code LIKE '6%'
              OR account_code LIKE '7%'
              OR source_type IN ('expense', 'procurement')
            )
        `),
        // Outflows part 2: payroll advances (actual cash paid out)
        exec(sql`
          SELECT COALESCE(SUM(amount), 0) AS total
          FROM payroll_advances
          WHERE status = 'approved'
            AND approved_at BETWEEN ${from} AND ${to}
        `),
      ]);
      const totalInflows = safeNum(receiptRows[0]?.total || '0');
      const totalOutflows = safeNum(expenseRows[0]?.total || '0') + safeNum(payrollRows[0]?.total || '0');
      return { ok: true, data: { inflows: totalInflows, outflows: totalOutflows, netFlow: totalInflows - totalOutflows, from, to } };
    } catch (error: unknown) { return Err((error as Error).message); }
  }

  async getAdvanceSummary(): Promise<Result<FinanceRow[]>> {
    try {
      const orders = await exec(sql`SELECT id, order_number, customer_name, total_amount, advance_percent, status FROM sales_orders WHERE CAST(advance_percent AS NUMERIC) < 70 AND status NOT IN ('cancelled', 'completed')`);
      const summary = (Array.isArray(orders) ? orders : []).map((order) => ({ id: order['id'], order_number: order['order_number'], customer_name: order['customer_name'], total_amount: order['total_amount'], advance_percent: order['advance_percent'], advance_due: safeNum(order['total_amount'] ?? '0') * (1 - safeNum(order['advance_percent'] ?? '0') / 100), status: order['status'] }));
      return Ok(castTo<FinanceRow[]>(summary));
    } catch (error: unknown) { return Err((error as Error).message); }
  }
}
