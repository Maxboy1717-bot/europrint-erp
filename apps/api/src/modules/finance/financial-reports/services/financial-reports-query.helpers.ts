/**
 * NOTE: Raw SQL retained intentionally (CTE chain, DISTINCT ON, period-window aggregates).
 * See financial-reports-query.service.ts header and ARCHITECTURE_RULES.md Rule 4.
 *
 * @module financial-reports-query.helpers
 * @description Per-method query helpers split from financial-reports-query.service.ts (Rule 16).
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { db } from '@shared/db';
import {
  warehouseTransactions, invoicePayments,
  accounts, entries,
} from '@europrint/schemas';
import { cashierMovements } from '@workspace/db';
import { customer_payments as customerPayments } from '@shared/db/schema-compat-5';
import { sql, count, and, eq } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { MS_PER_DAY } from '@common/constants/app.constants';
import type { CashSummary, WarehouseBalance, AgingBucket, BalanceSheet, ProductionMetrics } from './financial-reports-query.types';

export async function queryCashSummary(date?: string): Promise<Result<CashSummary>> {
  try {
    const targetDate = date ?? _time.now().toISOString().slice(0, 10);
    // Retired cash_transactions o'rniga cashier_movements (fi-cashier-hub kanonik):
    // kirim = type='cash_in'; chiqim = cash_out/salary_payout/advance/expense.
    const rows = await db.select({
      type: cashierMovements.type,
      total: sql<number>`COALESCE(SUM(${cashierMovements.amount}::numeric), 0)`,
    })
      .from(cashierMovements)
      .where(sql`DATE(${cashierMovements.createdAt}) = ${targetDate}`)
      .groupBy(cashierMovements.type);

    let inflow = 0;
    let outflow = 0;
    for (const row of rows) {
      if (row.type === 'cash_in') inflow += Number(row.total);
      else outflow += Number(row.total);
    }

    return Ok({
      totalInflow: inflow,
      totalOutflow: outflow,
      netCashFlow: inflow - outflow,
      openingBalance: 0,
      closingBalance: inflow - outflow,
      date: targetDate,
    });
  } catch (e: unknown) {
    return Err((e as Error).message || 'Kassa ma\'lumotlari topilmadi');
  }
}

export async function queryWarehouseBalance(warehouseId?: number): Promise<Result<WarehouseBalance>> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * MS_PER_DAY).toISOString().slice(0, 10);

    const [currentRows, avg30Rows] = await Promise.all([
      db.select({
        totalItems: count(),
        totalQuantity: sql<number>`COALESCE(SUM(${warehouseTransactions.quantity}::numeric), 0)`,
      })
        .from(warehouseTransactions)
        .where(warehouseId ? eq(warehouseTransactions.warehouseId, warehouseId) : sql`1=1`),

      db.select({
        avgBalance: sql<number>`COALESCE(AVG(${warehouseTransactions.balanceAfter}::numeric), 0)`,
      })
        .from(warehouseTransactions)
        .where(
          and(
            sql`DATE(${warehouseTransactions.createdAt}) >= ${thirtyDaysAgo}`,
            warehouseId ? eq(warehouseTransactions.warehouseId, warehouseId) : sql`1=1`,
          )
        ),
    ]);

    return Ok({
      totalItems: Number(currentRows[0]?.totalItems ?? 0),
      totalQuantity: Number(currentRows[0]?.totalQuantity ?? 0),
      totalValue: 0,
      averageValue30d: Number(avg30Rows[0]?.avgBalance ?? 0),
      warehouseId,
    });
  } catch (e: unknown) {
    return Err((e as Error).message || 'Ombor ma\'lumotlari topilmadi');
  }
}

export async function queryReceivables(date: string | undefined, overdueThreshold: number): Promise<Result<AgingBucket[]>> {
  try {
    const targetDate = date ?? _time.now().toISOString().slice(0, 10);
    const rows = await db.select({
      total: sql<number>`COALESCE(SUM(${customerPayments.amount}::numeric), 0)`,
      overdueAmount: sql<number>`COALESCE(SUM(CASE WHEN ${customerPayments.payment_date}::date < ${targetDate}::date - (${overdueThreshold} * INTERVAL '1 day') THEN ${customerPayments.amount}::numeric ELSE 0 END), 0)`,
    }).from(customerPayments);

    const total = Number(rows[0]?.total ?? 0);
    const overdue = Number(rows[0]?.overdueAmount ?? 0);
    return Ok([{
      total,
      current: total - overdue,
      // NOTE: single overdue-threshold bucket only (real SUM, not fabricated) --
      // sub-bucketing into 30/60/90-day ages would need 3 separate cutoffs,
      // out of scope for this fix (M3: replace the fabricated total*0.3, not
      // add a full aging-bucket feature).
      overdue30: overdue,
      overdue60: 0,
      overdue90plus: 0,
    }]);
  } catch (e: unknown) {
    return Err((e as Error).message || 'Debitorlar topilmadi');
  }
}

export async function queryPayables(_date?: string): Promise<Result<AgingBucket[]>> {
  try {
    const rows = await db.select({
      total: sql<number>`COALESCE(SUM(${invoicePayments.amount}::numeric), 0)`,
    }).from(invoicePayments);

    const total = Number(rows[0]?.total ?? 0);
    return Ok([{ total, current: total, overdue30: 0, overdue60: 0, overdue90plus: 0 }]);
  } catch (e: unknown) {
    return Err((e as Error).message || 'Kreditorlar topilmadi');
  }
}

export async function queryBalanceSheet(date?: string): Promise<Result<BalanceSheet>> {
  try {
    const targetDate = date ?? _time.now().toISOString().slice(0, 10);
    const rows = await db.select({
      type: accounts.accountType,
      total: sql<number>`COALESCE(SUM(${entries.amount}::numeric), 0)`,
    })
      .from(accounts)
      // NOTE: both accounts.id and entries.debit_account_id are INTEGER in the live DB
      // (the Drizzle schema types debit_account_id as varchar — historical drift). The
      // prior `${accounts.id}::varchar` cast threw `operator does not exist:
      // integer = character varying` at runtime, so this query always errored and
      // rpt_balans was never fed. Compare the columns natively (integer = integer) via
      // raw SQL — this both typechecks and runs against the real integer columns.
      .leftJoin(entries, and(
        sql`${entries.debitAccountId} = ${accounts.id}`,
        sql`DATE(${entries.createdAt}) <= ${targetDate}`,
      ))
      .where(eq(accounts.isActive, true))
      .groupBy(accounts.accountType);

    // account_type is stored UPPERCASE (ASSET/LIABILITY/EQUITY/REVENUE/EXPENSE);
    // normalise to lowercase so the lookups below match.
    const byType: Record<string, number> = {};
    for (const row of rows) byType[(row.type ?? '').toLowerCase()] = Number(row.total ?? 0);

    const currentAssets = byType['asset'] ?? 0;
    const totalLiabilities = byType['liability'] ?? 0;
    const equity = byType['equity'] ?? 0;

    return Ok({
      totalAssets: currentAssets,
      currentAssets,
      nonCurrentAssets: 0,
      totalLiabilities,
      currentLiabilities: totalLiabilities,
      nonCurrentLiabilities: 0,
      equity,
      retainedEarnings: (byType['revenue'] ?? 0) - (byType['expense'] ?? 0),
      date: targetDate,
    });
  } catch (e: unknown) {
    return Err((e as Error).message || 'Balans topilmadi');
  }
}

export async function queryProductionMetrics(date?: string): Promise<Result<ProductionMetrics>> {
  try {
    const targetDate = date ?? _time.now().toISOString().slice(0, 10);
    const rows = await db.execute(
      sql`SELECT
        COALESCE(SUM(fact_quantity), 0)  AS actual_quantity,
        COALESCE(SUM(good_quantity), 0)  AS good_quantity,
        COALESCE(SUM(scrap_quantity), 0) AS scrap_quantity
      FROM production_fact
      WHERE DATE(fact_date) = ${targetDate}`
    );

    const row = rows.rows?.[0] as Record<string, string> | undefined ?? {};
    const actual = Number(row['actual_quantity'] ?? 0);
    const good   = Number(row['good_quantity'] ?? 0);
    const scrap  = Number(row['scrap_quantity'] ?? 0);
    const efficiency = actual > 0 ? Math.min(100, Math.round((good / actual) * 100)) : 0;
    const scrapRate  = actual > 0 ? Math.min(100, Math.round((scrap / actual) * 100)) : 0;

    return Ok({
      plannedQuantity: actual,
      actualQuantity: actual,
      goodQuantity: good,
      scrapQuantity: scrap,
      efficiencyPct: efficiency,
      scrapRatePct: scrapRate,
      downtimeMinutes: 0,
      date: targetDate,
    });
  } catch (e: unknown) {
    return Err((e as Error).message || 'Ishlab chiqarish ma\'lumotlari topilmadi');
  }
}

export async function queryOverstockAlerts(threshold: number): Promise<Result<{ warehouseId?: number; currentValue: number; avgValue: number; pct: number }[]>> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * MS_PER_DAY).toISOString().slice(0, 10);

    const rows = await db.execute(sql`
      WITH avg_balances AS (
        SELECT warehouse_id,
               AVG(balance_after::numeric) AS avg_balance
        FROM warehouse_transactions
        WHERE created_at >= ${thirtyDaysAgo}::date
        GROUP BY warehouse_id
      ),
      current_balances AS (
        SELECT DISTINCT ON (warehouse_id)
               warehouse_id,
               balance_after::numeric AS current_balance
        FROM warehouse_transactions
        ORDER BY warehouse_id, created_at DESC
      )
      SELECT cb.warehouse_id,
             cb.current_balance,
             ab.avg_balance,
             CASE WHEN ab.avg_balance > 0
                  THEN ROUND((cb.current_balance / ab.avg_balance) * 100)
                  ELSE 0 END AS pct
      FROM current_balances cb
      JOIN avg_balances ab ON ab.warehouse_id = cb.warehouse_id
      WHERE ab.avg_balance > 0
        AND (cb.current_balance / ab.avg_balance) * 100 > ${threshold}
    `);

    const alerts = (Array.isArray(rows.rows) ? rows.rows : []).map((r: Record<string, unknown>) => ({
      warehouseId: r['warehouse_id'] as number | undefined,
      currentValue: Number(r['current_balance'] ?? 0),
      avgValue: Number(r['avg_balance'] ?? 0),
      pct: Number(r['pct'] ?? 0),
    }));

    return Ok(alerts);
  } catch (e: unknown) {
    return Err((e as Error).message || 'Overstock alert xatolik');
  }
}

export async function queryOverdueDebtAlerts(overdueDays: number): Promise<Result<{ customerId?: number; amount: number; daysOverdue: number }[]>> {
  try {
    const rows = await db.execute(sql`
      SELECT customer_id,
             SUM(amount::numeric) AS total_amount,
             MAX(CURRENT_DATE - payment_date::date) AS days_overdue
      FROM customer_payments
      WHERE payment_date < CURRENT_DATE - (${overdueDays} * INTERVAL '1 day')
        AND status != 'paid'
      GROUP BY customer_id
      HAVING SUM(amount::numeric) > 0
      ORDER BY total_amount DESC
    `);

    const alerts = (Array.isArray(rows.rows) ? rows.rows : []).map((r: Record<string, unknown>) => ({
      customerId: r['customer_id'] as number | undefined,
      amount: Number(r['total_amount'] ?? 0),
      daysOverdue: Number(r['days_overdue'] ?? 0),
    }));

    return Ok(alerts);
  } catch (e: unknown) {
    return Err((e as Error).message || 'Overdue debts alert xatolik');
  }
}

export async function queryOutOfStockAlerts(): Promise<Result<{ warehouseId?: number; materialName?: string; currentQty: number }[]>> {
  try {
    const rows = await db.execute(sql`
      SELECT warehouse_id,
             material_name,
             SUM(quantity::numeric) AS current_qty
      FROM warehouse_transactions
      GROUP BY warehouse_id, material_name
      HAVING SUM(quantity::numeric) <= 0
      LIMIT 50
    `);
    const alerts = (Array.isArray(rows.rows) ? rows.rows : []).map((r: Record<string, unknown>) => ({
      warehouseId:  r['warehouse_id'] as number | undefined,
      materialName: r['material_name'] as string | undefined,
      currentQty:   Number(r['current_qty'] ?? 0),
    }));
    return Ok(alerts);
  } catch (e: unknown) {
    return Err((e as Error).message || 'Out-of-stock alert xatolik');
  }
}
