/**
 * NOTE: Raw SQL retained intentionally — complex aggregations (Altman Z, GL
 * account-type pivots, cashflow ECL banding) cannot be expressed in Drizzle ORM.
 * See ARCHITECTURE_RULES.md Rule 4.
 */

/**
 * @module drizzle-finance-planning.repo
 * @description Planning sub-repo (P0-2): Break-even, Cashflow Forecast, Financial Ratios.
 *              Extracted from drizzle-finance.repo as part of Rule 13/16 split.
 */

import { Injectable, Logger } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import {
  BreakEvenInputs,
  CashflowWeekRaw,
  FinancialRatiosGl,
  FinancialRatiosSnapshotInput,
} from '../../domain/repositories/i-finance.repo';

type RawRow = Record<string, unknown>;
const toNum = (v: unknown, fallback = 0): number => {
  if (v === null || v === undefined) return fallback;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : fallback;
};

@Injectable()
export class FinancePlanningRepo {
  private readonly logger = new Logger(FinancePlanningRepo.name);

  // ============================================================
  // P0-2 Break-even
  // ============================================================

  async fetchBreakEvenInputs(productName: string, period: string): Promise<BreakEvenInputs> {
    const [structRes, salesRes] = await Promise.all([
      runQuery<RawRow>(sql`
        SELECT fixed_cost_uzs, variable_cost_uzs, selling_price_uzs
        FROM cost_structure
        WHERE product_name = ${productName} AND period = ${period}
        LIMIT 1
      `).catch(() => ({ rows: [] as RawRow[] })),
      runQuery<RawRow>(sql`
        SELECT COALESCE(SUM(po.planned_quantity), 0)::numeric AS actual_qty
        FROM production_orders po
        JOIN products p ON p.id = po.product_id
        WHERE p.name = ${productName}
          AND po.status::text = 'completed'
          AND TO_CHAR(po.created_at, 'YYYY-MM') = ${period}
      `).catch(() => ({ rows: [] as RawRow[] })),
    ]);

    const structRow = structRes.rows[0];
    const costStructure = structRow
      ? {
          fixedCostUzs:    toNum(structRow['fixed_cost_uzs'], 0),
          variableCostUzs: toNum(structRow['variable_cost_uzs'], 0),
          sellingPriceUzs: toNum(structRow['selling_price_uzs'], 0),
        }
      : null;

    const actualQty = toNum(salesRes.rows[0]?.['actual_qty'], 0);
    return { costStructure, actualQty };
  }

  async upsertCostStructure(input: {
    productName: string;
    period: string;
    fixedCostUzs: number;
    variableCostUzs: number;
    sellingPriceUzs: number;
  }): Promise<void> {
    await runQuery(sql`
      INSERT INTO cost_structure (product_name, period, fixed_cost_uzs, variable_cost_uzs, selling_price_uzs)
      VALUES (${input.productName}, ${input.period}, ${input.fixedCostUzs}, ${input.variableCostUzs}, ${input.sellingPriceUzs})
      ON CONFLICT (product_name, period) DO UPDATE
        SET fixed_cost_uzs    = EXCLUDED.fixed_cost_uzs,
            variable_cost_uzs = EXCLUDED.variable_cost_uzs,
            selling_price_uzs = EXCLUDED.selling_price_uzs,
            updated_at        = now()
    `);
  }

  // ============================================================
  // P0-2 Cashflow Forecast
  // ============================================================

  async fetchCashflowWeek(
    weekStartIso: string, weekEndIso: string,
    eclRates: { e030: number; e3160: number; e6190: number; e91p: number },
  ): Promise<CashflowWeekRaw> {
    const { e030, e3160, e6190, e91p } = eclRates;
    const [arRes, soRes, apRes, payRes] = await Promise.all([
      runQuery<RawRow>(sql`
        SELECT
          COALESCE(SUM(
            CASE WHEN age_days BETWEEN 0  AND 30  THEN balance * ${1 - e030}
                 WHEN age_days BETWEEN 31 AND 60  THEN balance * ${1 - e3160}
                 WHEN age_days BETWEEN 61 AND 90  THEN balance * ${1 - e6190}
                 WHEN age_days > 90               THEN balance * ${1 - e91p}
                 ELSE 0 END
          ), 0) AS ar_col
        FROM (
          SELECT total_amount AS balance,
                 (${weekStartIso}::date - DATE(created_at)) AS age_days
          FROM fi_invoices
          WHERE status NOT IN ('paid', 'cancelled')
            AND (invoice_type IS NULL OR invoice_type != 'payable')
            AND DATE(due_date) BETWEEN ${weekStartIso}::date AND ${weekEndIso}::date
        ) sub
      `).catch(() => ({ rows: [] as RawRow[] })),
      runQuery<RawRow>(sql`
        SELECT COALESCE(SUM(total_amount), 0) AS so_total
        FROM sales_orders
        WHERE status IN ('confirmed', 'in_production')
          AND delivery_date BETWEEN ${weekStartIso} AND ${weekEndIso}
      `).catch(() => ({ rows: [] as RawRow[] })),
      runQuery<RawRow>(sql`
        SELECT COALESCE(SUM(total_amount), 0) AS ap_out
        FROM fi_invoices
        WHERE invoice_type = 'payable'
          AND status NOT IN ('paid', 'cancelled')
          AND DATE(due_date) BETWEEN ${weekStartIso}::date AND ${weekEndIso}::date
      `).catch(() => ({ rows: [] as RawRow[] })),
      runQuery<RawRow>(sql`
        SELECT COALESCE(SUM(net_pay), 0) AS payroll_out
        FROM payroll_entries
        WHERE DATE(created_at) BETWEEN ${weekStartIso}::date AND ${weekEndIso}::date
      `).catch(() => ({ rows: [] as RawRow[] })),
    ]);

    return {
      arCol:      toNum(arRes.rows[0]?.['ar_col'], 0),
      soInflow:   toNum(soRes.rows[0]?.['so_total'], 0),
      apOut:      toNum(apRes.rows[0]?.['ap_out'], 0),
      payrollOut: toNum(payRes.rows[0]?.['payroll_out'], 0),
    };
  }

  // ============================================================
  // P0-2 Financial Ratios
  // ============================================================

  async fetchFinancialRatiosGl(period: string): Promise<FinancialRatiosGl | null> {
    const r = await runQuery<RawRow>(sql`
      SELECT
        COALESCE(SUM(CASE WHEN a.account_type = 'revenue'   THEN e.amount ELSE 0 END), 0) AS revenue,
        COALESCE(SUM(CASE WHEN a.account_code LIKE '6%'     THEN e.amount ELSE 0 END), 0) AS cogs,
        COALESCE(SUM(CASE WHEN a.account_code LIKE '7%'     THEN e.amount ELSE 0 END), 0) AS opex,
        COALESCE(SUM(CASE WHEN a.account_code LIKE '9%'     THEN e.amount ELSE 0 END), 0) AS interest_exp,
        COALESCE(SUM(CASE WHEN a.account_type = 'asset'     THEN e.amount ELSE 0 END), 0) AS total_assets,
        COALESCE(SUM(CASE WHEN a.account_type = 'equity'    THEN e.amount ELSE 0 END), 0) AS total_equity,
        COALESCE(SUM(CASE WHEN a.account_type = 'liability' THEN e.amount ELSE 0 END), 0) AS total_debt,
        COALESCE(SUM(CASE WHEN a.account_code LIKE '2%'     THEN e.amount ELSE 0 END), 0) AS current_assets,
        COALESCE(SUM(CASE WHEN a.account_code LIKE '3%'     THEN e.amount ELSE 0 END), 0) AS current_liabilities,
        COALESCE(SUM(CASE WHEN a.account_code LIKE '14%'    THEN e.amount ELSE 0 END), 0) AS inventory,
        COALESCE(SUM(CASE WHEN a.account_code LIKE '11%'    THEN e.amount ELSE 0 END), 0) AS cash,
        COALESCE(SUM(CASE WHEN a.account_type = 'equity'    THEN e.amount ELSE 0 END), 0) AS retained_earnings
      FROM entries e
      LEFT JOIN accounts a ON a.id = e.debit_account_id
      WHERE e.entry_date LIKE ${period + '-%'}
    `);
    const g = r.rows[0];
    if (!g) return null;
    return {
      revenue:            toNum(g['revenue'], 0),
      cogs:               toNum(g['cogs'], 0),
      opex:               toNum(g['opex'], 0),
      interestExp:        toNum(g['interest_exp'], 0),
      totalAssets:        toNum(g['total_assets'], 0),
      totalEquity:        toNum(g['total_equity'], 0),
      totalDebt:          toNum(g['total_debt'], 0),
      currentAssets:      toNum(g['current_assets'], 0),
      currentLiabilities: toNum(g['current_liabilities'], 0),
      inventory:          toNum(g['inventory'], 0),
      cash:               toNum(g['cash'], 0),
      retainedEarnings:   toNum(g['retained_earnings'], 0),
    };
  }

  async saveFinancialRatiosSnapshot(s: FinancialRatiosSnapshotInput): Promise<void> {
    try {
      await runQuery(sql`
        INSERT INTO financial_ratios_snapshot
          (period, current_ratio, quick_ratio, gross_margin_pct, net_margin_pct,
           roa, roe, debt_to_equity, altman_z, altman_zone, revenue, net_income)
        VALUES
          (${s.period}, ${s.currentRatio}, ${s.quickRatio},
           ${s.grossMarginPct}, ${s.netMarginPct},
           ${s.roa}, ${s.roe}, ${s.debtToEquity},
           ${s.altmanZ}, ${s.altmanZone}, ${s.revenue}, ${s.netIncome})
        ON CONFLICT (period) DO UPDATE
          SET current_ratio    = EXCLUDED.current_ratio,
              quick_ratio      = EXCLUDED.quick_ratio,
              gross_margin_pct = EXCLUDED.gross_margin_pct,
              net_margin_pct   = EXCLUDED.net_margin_pct,
              roa = EXCLUDED.roa, roe = EXCLUDED.roe,
              debt_to_equity   = EXCLUDED.debt_to_equity,
              altman_z         = EXCLUDED.altman_z,
              altman_zone      = EXCLUDED.altman_zone,
              revenue          = EXCLUDED.revenue,
              net_income       = EXCLUDED.net_income,
              updated_at       = now()
      `);
    } catch (err) {
      this.logger.warn(`FinancialRatiosSnapshot saqlashda xato: ${String(err)}`);
    }
  }

  async flagAltmanDistress(period: string, zScore: number): Promise<void> {
    const title = `Altman Z-Score Distress Signali: ${period}`;
    const desc  = `Moliyaviy xavf: ${period} davr uchun Altman Z-Score ${zScore.toFixed(4)} — Distress zonasi (<1.81). CFO zudlik bilan choralar ko'rishi kerak.`;
    await runQuery(sql`
      INSERT INTO kaizen_suggestions (title, description, status, created_at)
      VALUES (${title}, ${desc}, ${'open'}, now())
    `);
  }
}
