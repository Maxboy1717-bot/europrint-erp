/**
 * @module cfo.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 *
 * Financial risk computation lives in `cfo-risk.service.ts` (delegated below)
 * to keep this file under 300 lines (Rule 16). The public method
 * `getFinancialRisk()` is preserved.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result, AppError, Ok } from '@common/result';
import { safeDiv } from '@common/math';
import { COGS_MATERIAL_RATIO } from '@common/constants/business.constants';
import { CfoRiskService } from './cfo-risk.service';

type Row = Record<string, unknown>;

/**
 * Canonical GL source = `entries` table (ADR-003), NOT the dead/empty `gl_journal_entries`.
 * `entries` is double-entry: each row debits `debit_account_id` and credits
 * `credit_account_id` by `amount`. The CFO aggregations below are written against a
 * single-sided "leg" shape (account_code + debit_amount/credit_amount per row), so this
 * CTE unfolds every balanced `entries` row into two legs and resolves account_code via
 * the `accounts` FK (the text `debit_account`/`credit_account` columns are nullable, e.g.
 * payroll entries, so we join on the *_account_id FK instead).
 */
const GL_LEGS_CTE = sql`
  SELECT a.account_code AS account_code,
         e.amount       AS debit_amount,
         0::numeric     AS credit_amount,
         e.created_at   AS created_at,
         e.description  AS description
  FROM entries e
  JOIN accounts a ON a.id = e.debit_account_id
  UNION ALL
  SELECT a.account_code AS account_code,
         0::numeric     AS debit_amount,
         e.amount       AS credit_amount,
         e.created_at   AS created_at,
         e.description  AS description
  FROM entries e
  JOIN accounts a ON a.id = e.credit_account_id
`;

/** Safe percentage: returns 0 when denominator is 0 rather than a misleading ratio. */
function safePct(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : safeDiv(numerator, denominator) * 100;
}

@Injectable()
export class CfoCompatService {
  private readonly logger = new Logger(CfoCompatService.name);
  /** VAT rate read from env via ConfigService (Rule 7); defaults to 12%. */
  private readonly VAT_RATE: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly riskService: CfoRiskService,
  ) {
    this.VAT_RATE = parseFloat(this.configService.get<string>('CFO_VAT_RATE') ?? '0.12');
  }

  async getDashboard(): Promise<Result<object, AppError>> {
    const [glKpiR, liquidityR] = await Promise.all([this.fetchGlKpis(), this.fetchLiquidity()]);
    const glRow: Row  = glKpiR.ok    ? (dbRows(glKpiR.data)[0]    ?? {}) : {};
    const liqRow: Row = liquidityR.ok ? (dbRows(liquidityR.data)[0] ?? {}) : {};
    return Ok(this.buildDashboardKpis(glRow, liqRow));
  }

  private fetchGlKpis() {
    return safeCall(() => rawSql(sql`
      WITH gl_legs AS (${GL_LEGS_CTE})
      SELECT
        COALESCE(SUM(CASE WHEN account_code LIKE '4%' THEN credit_amount - debit_amount ELSE 0 END), 0) AS revenue,
        COALESCE(SUM(CASE WHEN account_code LIKE '5%' THEN debit_amount - credit_amount ELSE 0 END), 0) AS cogs,
        COALESCE(SUM(CASE WHEN account_code LIKE '6%' THEN debit_amount - credit_amount ELSE 0 END), 0) AS opex,
        COALESCE(SUM(CASE WHEN account_code LIKE '1%' THEN debit_amount - credit_amount ELSE 0 END), 0) AS total_assets,
        COALESCE(SUM(CASE WHEN account_code LIKE '2%' THEN debit_amount - credit_amount ELSE 0 END), 0) AS current_assets,
        COALESCE(SUM(CASE WHEN account_code LIKE '3%' THEN credit_amount - debit_amount ELSE 0 END), 0) AS current_liabilities
      FROM gl_legs
      WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
    `));
  }

  private fetchLiquidity() {
    return safeCall(() => rawSql(sql`
      SELECT
        COALESCE((SELECT SUM(total_amount - COALESCE(paid_amount,0)) FROM fi_invoices WHERE status NOT IN ('paid','cancelled')), 0) AS accounts_receivable,
        COALESCE((SELECT SUM(total_amount - COALESCE(paid_amount,0)) FROM fi_invoices WHERE type='payable' AND status NOT IN ('paid','cancelled')), 0) AS accounts_payable,
        COALESCE((SELECT SUM(debit_amount - credit_amount) FROM (${GL_LEGS_CTE}) gl_legs WHERE account_code LIKE '14%'), 0) AS inventory
    `));
  }

  private buildDashboardKpis(glRow: Row, liqRow: Row): object {
    const revenue = Number(glRow['revenue'] ?? 0);
    const cogs    = Number(glRow['cogs']    ?? 0);
    const opex    = Number(glRow['opex']    ?? 0);
    const assets  = Number(glRow['total_assets'] ?? 0);
    const ar = Number(liqRow['accounts_receivable'] ?? 0);
    const ap = Number(liqRow['accounts_payable']    ?? 0);
    const effectiveCa  = Number(glRow['current_assets']      ?? 0) || ar;
    const effectiveCl  = Number(glRow['current_liabilities'] ?? 0) || ap;
    const effectiveInv = Math.max(Number(liqRow['inventory'] ?? 0), 0);
    const grossProfit = revenue - cogs;
    const netIncome   = grossProfit - opex;
    return {
      kpis: {
        currentRatio:      +safeDiv(effectiveCa, effectiveCl).toFixed(2),
        quickRatio:        +safeDiv(effectiveCa - effectiveInv, effectiveCl).toFixed(2),
        grossProfitMargin: +safePct(grossProfit, revenue).toFixed(1),
        netProfitMargin:   +safePct(netIncome, revenue).toFixed(1),
        returnOnAssets:    +safePct(netIncome * 12, assets).toFixed(1),
        returnOnEquity:    0,
      },
      revenue, expenses: cogs + opex, grossProfit,
      cashBalance: 0, accountsReceivable: ar, accountsPayable: ap,
      workingCapital: effectiveCa - effectiveCl,
    };
  }

  async getCashPosition(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const rows = await this.fetchCashAccounts();
      const accounts = this.mapCashAccounts(rows);
      const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
      const byCurrency = this.groupAccountsByCurrency(accounts);
      return { accounts, summary: { totalBalance, accountCount: accounts.length }, byCurrency };
    });
  }

  private async fetchCashAccounts(): Promise<Row[]> {
    const r = await safeCall(() => rawSql(sql`
      WITH gl_legs AS (${GL_LEGS_CTE})
      SELECT
        account_code,
        description AS account_name,
        'MAIN'      AS bank_name,
        'UZS'       AS currency,
        COALESCE(SUM(debit_amount - credit_amount), 0) AS balance
      FROM gl_legs
      WHERE account_code LIKE '11%'
      GROUP BY account_code, description
      ORDER BY balance DESC
      LIMIT 20
    `));
    return r.ok ? dbRows(r.data) : [];
  }

  private mapCashAccounts(rows: Row[]): Array<{ id: string; accountName: string; accountNumber: string; bankName: string; currency: string; balance: number }> {
    return rows.map((row, idx) => ({
      id:            String(idx + 1),
      accountName:   String(row['account_name'] ?? `Hisob ${row['account_code']}`),
      accountNumber: String(row['account_code'] ?? ''),
      bankName:      String(row['bank_name']    ?? 'MAIN'),
      currency:      String(row['currency']     ?? 'UZS'),
      balance:       Number(row['balance']      ?? 0),
    }));
  }

  private groupAccountsByCurrency(accounts: Array<{ currency: string; balance: number }>): Array<{ currency: string; total: number; accountCount: number }> {
    const currMap: Record<string, { total: number; count: number }> = {};
    for (const a of accounts) {
      (currMap[a.currency] ??= { total: 0, count: 0 }).total += a.balance;
      currMap[a.currency].count++;
    }
    const byCurrency = Object.entries(currMap).map(([currency, { total, count }]) => ({
      currency, total, accountCount: count,
    }));
    if (!byCurrency.length) byCurrency.push({ currency: 'UZS', total: 0, accountCount: 0 });
    return byCurrency;
  }

  async getProfitability(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const [invoiceR, glCostR] = await Promise.all([this.fetchInvoiceRevenue(), this.fetchGlCosts()]);
      const invRow: Row = invoiceR.ok ? (dbRows(invoiceR.data)[0] ?? {}) : {};
      const glRow: Row  = glCostR.ok  ? (dbRows(glCostR.data)[0]  ?? {}) : {};
      return this.buildProfitabilityResult(invRow, glRow);
    });
  }

  private fetchInvoiceRevenue() {
    return safeCall(() => rawSql(sql`
      SELECT
        COALESCE(SUM(total_amount), 0)              AS total_revenue,
        COALESCE(SUM(total_amount * ${this.VAT_RATE}), 0) AS tax_amount,
        COUNT(*)::int                                AS invoice_count
      FROM fi_invoices
      WHERE status = 'paid'
        AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
    `));
  }

  private fetchGlCosts() {
    return safeCall(() => rawSql(sql`
      WITH gl_legs AS (${GL_LEGS_CTE})
      SELECT
        COALESCE(SUM(CASE WHEN account_code LIKE '4%'  THEN credit_amount - debit_amount ELSE 0 END), 0) AS gl_revenue,
        COALESCE(SUM(CASE WHEN account_code LIKE '5%'  THEN debit_amount - credit_amount ELSE 0 END), 0) AS gl_cogs,
        COALESCE(SUM(CASE WHEN account_code LIKE '61%' THEN debit_amount - credit_amount ELSE 0 END), 0) AS labor,
        COALESCE(SUM(CASE WHEN account_code LIKE '62%' THEN debit_amount - credit_amount ELSE 0 END), 0) AS overhead
      FROM gl_legs
      WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
    `));
  }

  private buildProfitabilityResult(invRow: Row, glRow: Row): object {
    const invoiceRevenue = Number(invRow['total_revenue'] ?? 0);
    const taxAmount      = Number(invRow['tax_amount']    ?? 0);
    const invoiceCount   = Number(invRow['invoice_count'] ?? 0);
    const glRevenue      = Number(glRow['gl_revenue']     ?? 0);
    const glCogs         = Number(glRow['gl_cogs']        ?? 0);
    const labor          = Number(glRow['labor']          ?? 0);
    const overhead       = Number(glRow['overhead']       ?? 0);

    const totalRevenue = glRevenue > 0 ? glRevenue : invoiceRevenue;
    const netValue     = totalRevenue - taxAmount;
    const rawMaterial  = glCogs - labor - overhead;
    const material     = rawMaterial > 0 ? rawMaterial : glCogs * COGS_MATERIAL_RATIO;
    const totalCost    = glCogs;
    const grossProfit  = totalRevenue - totalCost;

    return {
      revenue: { total: totalRevenue, netValue, taxAmount, invoiceCount },
      costs:   { total: totalCost, material, labor, overhead },
      grossProfit,
      grossMargin: +safePct(grossProfit, totalRevenue).toFixed(1),
    };
  }

  async getProfitabilityTrend(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const r = await safeCall(() => rawSql(sql`
        WITH gl_legs AS (${GL_LEGS_CTE})
        SELECT
          TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') AS month,
          COALESCE(SUM(CASE WHEN account_code LIKE '4%' THEN credit_amount - debit_amount ELSE 0 END), 0) AS revenue,
          COALESCE(SUM(CASE WHEN account_code LIKE '5%' THEN debit_amount - credit_amount ELSE 0 END), 0) AS expenses,
          COALESCE(SUM(CASE WHEN account_code LIKE '4%' THEN credit_amount - debit_amount ELSE 0 END), 0) -
          COALESCE(SUM(CASE WHEN account_code LIKE '5%' THEN debit_amount - credit_amount ELSE 0 END), 0) AS gross_profit
        FROM gl_legs
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at)
        LIMIT 6
      `));

      const rows: Row[] = r.ok ? dbRows(r.data) : [];
      return rows.map(row => {
        const rev = Number(row['revenue']      ?? 0);
        const gp  = Number(row['gross_profit'] ?? 0);
        return {
          month:       row['month'],
          revenue:     rev,
          expenses:    Number(row['expenses'] ?? 0),
          grossProfit: gp,
          margin:      +safePct(gp, rev).toFixed(1),
        };
      });
    });
  }

  /** Financial risk — delegated to `CfoRiskService`. */
  getFinancialRisk(): Promise<Result<object, AppError>> {
    return this.riskService.getFinancialRisk();
  }
}
