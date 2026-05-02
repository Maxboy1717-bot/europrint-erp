import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { db, rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result, AppError, Ok } from '@common/result';
import { safeDiv } from '@common/math';

type Row = Record<string, unknown>;

@Injectable()
export class CfoCompatService {
  private readonly logger = new Logger(CfoCompatService.name);

  async getDashboard(): Promise<Result<object, AppError>> {
    const [glKpiR, liquidityR] = await Promise.all([
      safeCall(() => rawSql(sql`
        SELECT
          COALESCE(SUM(CASE WHEN account_code LIKE '4%' THEN credit_amount - debit_amount ELSE 0 END), 0) AS revenue,
          COALESCE(SUM(CASE WHEN account_code LIKE '5%' THEN debit_amount - credit_amount ELSE 0 END), 0) AS cogs,
          COALESCE(SUM(CASE WHEN account_code LIKE '6%' THEN debit_amount - credit_amount ELSE 0 END), 0) AS opex,
          COALESCE(SUM(CASE WHEN account_code LIKE '1%' THEN debit_amount - credit_amount ELSE 0 END), 0) AS total_assets,
          COALESCE(SUM(CASE WHEN account_code LIKE '2%' THEN debit_amount - credit_amount ELSE 0 END), 0) AS current_assets,
          COALESCE(SUM(CASE WHEN account_code LIKE '3%' THEN credit_amount - debit_amount ELSE 0 END), 0) AS current_liabilities
        FROM gl_journal_entries
        WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
      `)),
      safeCall(() => rawSql(sql`
        SELECT
          COALESCE((SELECT SUM(total_amount - COALESCE(paid_amount,0)) FROM fi_invoices WHERE status NOT IN ('paid','cancelled')), 0) AS accounts_receivable,
          COALESCE((SELECT SUM(total_amount - COALESCE(paid_amount,0)) FROM fi_invoices WHERE type='payable' AND status NOT IN ('paid','cancelled')), 0) AS accounts_payable,
          COALESCE((SELECT SUM(debit_amount - credit_amount) FROM gl_journal_entries WHERE account_code LIKE '14%'), 0) AS inventory
      `)),
    ]);

    const glRow: Row     = glKpiR.ok   ? (dbRows(glKpiR.data)[0]   ?? {}) : {};
    const liqRow: Row    = liquidityR.ok ? (dbRows(liquidityR.data)[0] ?? {}) : {};

    const revenue   = Number(glRow['revenue']   ?? 0);
    const cogs      = Number(glRow['cogs']      ?? 0);
    const opex      = Number(glRow['opex']      ?? 0);
    const assets    = Number(glRow['total_assets'] ?? 0);
    const ca        = Number(glRow['current_assets'] ?? 0);
    const cl        = Number(glRow['current_liabilities'] ?? 0);
    const ar        = Number(liqRow['accounts_receivable'] ?? 0);
    const ap        = Number(liqRow['accounts_payable']    ?? 0);
    const inventory = Number(liqRow['inventory']           ?? 0);

    const effectiveCa  = ca > 0 ? ca : ar;
    const effectiveCl  = cl > 0 ? cl : ap;
    const effectiveInv = inventory > 0 ? inventory : 0;

    const grossProfit    = revenue - cogs;
    const netIncome      = grossProfit - opex;
    const grossMarginPct = safeDiv(grossProfit, revenue) * 100;
    const netMarginPct   = safeDiv(netIncome, revenue) * 100;
    const roa            = safeDiv(netIncome * 12, assets) * 100;
    const currentRatio   = safeDiv(effectiveCa, effectiveCl);
    const quickRatio     = safeDiv(effectiveCa - effectiveInv, effectiveCl);
    const workingCapital = effectiveCa - effectiveCl;

    return Ok({
      kpis: {
        currentRatio:      +currentRatio.toFixed(2),
        quickRatio:        +quickRatio.toFixed(2),
        grossProfitMargin: +grossMarginPct.toFixed(1),
        netProfitMargin:   +netMarginPct.toFixed(1),
        returnOnAssets:    +roa.toFixed(1),
        returnOnEquity:    0,
      },
      revenue, expenses: cogs + opex, grossProfit,
      cashBalance: 0, accountsReceivable: ar, accountsPayable: ap, workingCapital,
    });
  }

  async getCashPosition(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const r = await safeCall(() => rawSql(sql`
      SELECT
        source_type AS account_name,
        SUM(total_debit) AS total_debit,
        SUM(total_credit) AS total_credit,
        SUM(total_debit) - SUM(total_credit) AS balance
      FROM gl_journal_entries
      GROUP BY source_type
      ORDER BY balance DESC
      LIMIT 50
    `));
    const accounts: Row[] = r.ok ? dbRows(r.data) : [];
    const totalBalance = (accounts ?? []).reduce((s, a) => s + Number(a['balance'] ?? 0), 0);
    return { accounts, summary: { totalBalance, accountCount: accounts.length, lastUpdated: _time.now() } };
    });
  }

  async getProfitability(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const [byProductR, byCustomerR, glCostR] = await Promise.all([
      safeCall(() => rawSql(sql`
        SELECT
          product_category AS name,
          SUM(total_amount)::numeric(15,2) AS revenue,
          COUNT(*)::int AS order_count
        FROM fi_invoices
        WHERE status = 'paid'
        GROUP BY product_category
        ORDER BY revenue DESC
        LIMIT 20
      `)),
      safeCall(() => rawSql(sql`
        SELECT
          customer_name AS name,
          SUM(total_amount)::numeric(15,2) AS revenue,
          COUNT(*)::int AS invoice_count
        FROM fi_invoices
        WHERE status = 'paid'
        GROUP BY customer_name
        ORDER BY revenue DESC
        LIMIT 20
      `)),
      safeCall(() => rawSql(sql`
        SELECT
          COALESCE(SUM(CASE WHEN account_code LIKE '4%' THEN credit_amount - debit_amount ELSE 0 END), 0) AS gl_revenue,
          COALESCE(SUM(CASE WHEN account_code LIKE '5%' THEN debit_amount - credit_amount ELSE 0 END), 0) AS gl_cogs
        FROM gl_journal_entries
        WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
      `)),
    ]);

    const byProduct: Row[]  = byProductR.ok  ? dbRows(byProductR.data)  : [];
    const byCustomer: Row[] = byCustomerR.ok ? dbRows(byCustomerR.data) : [];
    const glCostRow: Row    = glCostR.ok     ? (dbRows(glCostR.data)[0] ?? {}) : {};

    const invoiceRevenue = (byCustomer ?? []).reduce((s, r) => s + Number(r['revenue'] ?? 0), 0);
    const glRevenue  = Number(glCostRow['gl_revenue'] ?? 0);
    const glCogs     = Number(glCostRow['gl_cogs']    ?? 0);

    const totalRevenue = glRevenue > 0 ? glRevenue : invoiceRevenue;
    const totalCost    = glRevenue > 0 ? glCogs : 0;
    const grossProfit  = totalRevenue - totalCost;

    return {
      byProduct,
      byCustomer,
      summary: {
        totalRevenue,
        totalCost,
        grossProfit,
        margin: +(safeDiv(grossProfit, totalRevenue) * 100).toFixed(1),
      },
    };
    });
  }

  async getProfitabilityTrend(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const r = await safeCall(() => rawSql(sql`
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') AS month,
        COALESCE(SUM(CASE WHEN account_code LIKE '4%' THEN credit_amount - debit_amount ELSE 0 END), 0) AS revenue,
        COALESCE(SUM(CASE WHEN account_code LIKE '5%' THEN debit_amount - credit_amount ELSE 0 END), 0) AS expenses,
        COALESCE(SUM(CASE WHEN account_code LIKE '4%' THEN credit_amount - debit_amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN account_code LIKE '5%' THEN debit_amount - credit_amount ELSE 0 END), 0) AS gross_profit
      FROM gl_journal_entries
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY 1, DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
      LIMIT 6
    `));

    const rows: Row[] = r.ok ? dbRows(r.data) : [];
    return (Array.isArray(rows) ? rows : []).map(row => ({
      month:       row['month'],
      revenue:     Number(row['revenue']      ?? 0),
      expenses:    Number(row['expenses']     ?? 0),
      grossProfit: Number(row['gross_profit'] ?? 0),
      margin:      +(safeDiv(Number(row['gross_profit'] ?? 0), Number(row['revenue'] ?? 1)) * 100).toFixed(1),
    }));
    });
  }

  async getFinancialRisk(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const r = await safeCall(() => rawSql(sql`
        SELECT
          COALESCE(SUM(total_amount - COALESCE(paid_amount,0)), 0) AS overdue_amount,
          COUNT(*) AS overdue_count
        FROM fi_invoices
        WHERE status = 'overdue'
      `));
      if (!r.ok) this.logger.warn(`getFinancialRisk: ${r.error}`);
      const row: Row = r.ok ? (dbRows(r.data)[0] ?? {}) : {};
      const overdueRows: Row[] = r.ok ? dbRows(r.data) : [];
      return {
        overdueReceivables: Number(row['overdue_amount'] ?? 0),
        overdueCount:       Number(row['overdue_count']  ?? 0),
        concentrationRisk:  'MEDIUM',
        liquidityRisk:      'LOW',
        creditRisk:         'MEDIUM',
        risks: overdueRows,
      };
    });
  }
}
