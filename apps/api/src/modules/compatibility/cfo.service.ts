/**
 * @module cfo.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result, AppError, Ok } from '@common/result';
import { safeDiv, clamp } from '@common/math';
import { COGS_MATERIAL_RATIO } from '@common/constants/business.constants';

type Row = Record<string, unknown>;
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/** Classify a percentage into a risk level based on ascending thresholds [low, medium, high]. */
function pctRisk(value: number, [lo, mid, hi]: [number, number, number]): RiskLevel {
  if (value >= hi)  return 'critical';
  if (value >= mid) return 'high';
  if (value >= lo)  return 'medium';
  return 'low';
}

/** Classify a runway (days remaining) into a risk level — lower days = higher risk. */
function runwayRisk(days: number): RiskLevel {
  if (days < 7)  return 'critical';
  if (days < 14) return 'high';
  if (days < 30) return 'medium';
  return 'low';
}

/** Safe percentage: returns 0 when denominator is 0 rather than a misleading ratio. */
function safePct(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : safeDiv(numerator, denominator) * 100;
}

@Injectable()
export class CfoCompatService {
  private readonly logger = new Logger(CfoCompatService.name);
  /** VAT rate read from env via ConfigService (Rule 7); defaults to 12%. */
  private readonly VAT_RATE: number;

  constructor(private readonly configService: ConfigService) {
    this.VAT_RATE = parseFloat(this.configService.get<string>('CFO_VAT_RATE') ?? '0.12');
  }

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

    const glRow: Row  = glKpiR.ok    ? (dbRows(glKpiR.data)[0]    ?? {}) : {};
    const liqRow: Row = liquidityR.ok ? (dbRows(liquidityR.data)[0] ?? {}) : {};

    const revenue   = Number(glRow['revenue']            ?? 0);
    const cogs      = Number(glRow['cogs']               ?? 0);
    const opex      = Number(glRow['opex']               ?? 0);
    const assets    = Number(glRow['total_assets']        ?? 0);
    const ca        = Number(glRow['current_assets']      ?? 0);
    const cl        = Number(glRow['current_liabilities'] ?? 0);
    const ar        = Number(liqRow['accounts_receivable'] ?? 0);
    const ap        = Number(liqRow['accounts_payable']    ?? 0);
    const inventory = Number(liqRow['inventory']           ?? 0);

    const effectiveCa  = ca > 0 ? ca : ar;
    const effectiveCl  = cl > 0 ? cl : ap;
    const effectiveInv = inventory > 0 ? inventory : 0;

    const grossProfit    = revenue - cogs;
    const netIncome      = grossProfit - opex;
    const workingCapital = effectiveCa - effectiveCl;

    return Ok({
      kpis: {
        currentRatio:      +safeDiv(effectiveCa, effectiveCl).toFixed(2),
        quickRatio:        +safeDiv(effectiveCa - effectiveInv, effectiveCl).toFixed(2),
        grossProfitMargin: +safePct(grossProfit, revenue).toFixed(1),
        netProfitMargin:   +safePct(netIncome, revenue).toFixed(1),
        returnOnAssets:    +safePct(netIncome * 12, assets).toFixed(1),
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
          account_code,
          description AS account_name,
          'MAIN'      AS bank_name,
          'UZS'       AS currency,
          COALESCE(SUM(debit_amount - credit_amount), 0) AS balance
        FROM gl_journal_entries
        WHERE account_code LIKE '11%'
        GROUP BY account_code, description
        ORDER BY balance DESC
        LIMIT 20
      `));

      const rows: Row[] = r.ok ? dbRows(r.data) : [];
      const accounts = rows.map((row, idx) => ({
        id:            String(idx + 1),
        accountName:   String(row['account_name'] ?? `Hisob ${row['account_code']}`),
        accountNumber: String(row['account_code'] ?? ''),
        bankName:      String(row['bank_name']    ?? 'MAIN'),
        currency:      String(row['currency']     ?? 'UZS'),
        balance:       Number(row['balance']      ?? 0),
      }));

      const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

      const currMap: Record<string, { total: number; count: number }> = {};
      for (const a of accounts) {
        (currMap[a.currency] ??= { total: 0, count: 0 }).total += a.balance;
        currMap[a.currency].count++;
      }
      const byCurrency = Object.entries(currMap).map(([currency, { total, count }]) => ({
        currency, total, accountCount: count,
      }));

      if (!byCurrency.length) byCurrency.push({ currency: 'UZS', total: 0, accountCount: 0 });

      return { accounts, summary: { totalBalance, accountCount: accounts.length }, byCurrency };
    });
  }

  async getProfitability(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const [invoiceR, glCostR] = await Promise.all([
        safeCall(() => rawSql(sql`
          SELECT
            COALESCE(SUM(total_amount), 0)              AS total_revenue,
            COALESCE(SUM(total_amount * ${this.VAT_RATE}), 0) AS tax_amount,
            COUNT(*)::int                                AS invoice_count
          FROM fi_invoices
          WHERE status = 'paid'
            AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
        `)),
        safeCall(() => rawSql(sql`
          SELECT
            COALESCE(SUM(CASE WHEN account_code LIKE '4%'  THEN credit_amount - debit_amount ELSE 0 END), 0) AS gl_revenue,
            COALESCE(SUM(CASE WHEN account_code LIKE '5%'  THEN debit_amount - credit_amount ELSE 0 END), 0) AS gl_cogs,
            COALESCE(SUM(CASE WHEN account_code LIKE '61%' THEN debit_amount - credit_amount ELSE 0 END), 0) AS labor,
            COALESCE(SUM(CASE WHEN account_code LIKE '62%' THEN debit_amount - credit_amount ELSE 0 END), 0) AS overhead
          FROM gl_journal_entries
          WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
        `)),
      ]);

      const invRow: Row = invoiceR.ok ? (dbRows(invoiceR.data)[0] ?? {}) : {};
      const glRow: Row  = glCostR.ok  ? (dbRows(glCostR.data)[0]  ?? {}) : {};

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
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at)
        LIMIT 6
      `));

      const rows: Row[] = r.ok ? dbRows(r.data) : [];
      return rows.map(row => {
        const rev        = Number(row['revenue']      ?? 0);
        const gp         = Number(row['gross_profit'] ?? 0);
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

  async getFinancialRisk(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const [arR, apR, cashR, marginR] = await Promise.all([
        safeCall(() => rawSql(sql`
          SELECT
            COALESCE(SUM(total_amount), 0) AS total_ar,
            COALESCE(SUM(CASE WHEN status='overdue' THEN total_amount - COALESCE(paid_amount,0) ELSE 0 END), 0) AS overdue_ar
          FROM fi_invoices WHERE type != 'payable'
        `)),
        safeCall(() => rawSql(sql`
          SELECT
            COALESCE(SUM(total_amount), 0) AS total_ap,
            COALESCE(SUM(CASE WHEN status='overdue' THEN total_amount - COALESCE(paid_amount,0) ELSE 0 END), 0) AS overdue_ap
          FROM fi_invoices WHERE type = 'payable'
        `)),
        safeCall(() => rawSql(sql`
          SELECT COALESCE(SUM(debit_amount - credit_amount), 0) AS cash_balance
          FROM gl_journal_entries WHERE account_code LIKE '11%'
        `)),
        safeCall(() => rawSql(sql`
          SELECT
            TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') AS month,
            COALESCE(SUM(CASE WHEN account_code LIKE '4%' THEN credit_amount - debit_amount ELSE 0 END), 0) AS revenue,
            COALESCE(SUM(CASE WHEN account_code LIKE '5%' THEN debit_amount - credit_amount ELSE 0 END), 0) AS cogs
          FROM gl_journal_entries
          WHERE created_at >= NOW() - INTERVAL '3 months'
          GROUP BY DATE_TRUNC('month', created_at)
          ORDER BY DATE_TRUNC('month', created_at) DESC
          LIMIT 3
        `)),
      ]);

      const arRow: Row        = arR.ok     ? (dbRows(arR.data)[0]    ?? {}) : {};
      const apRow: Row        = apR.ok     ? (dbRows(apR.data)[0]    ?? {}) : {};
      const cashRow: Row      = cashR.ok   ? (dbRows(cashR.data)[0]  ?? {}) : {};
      const marginRows: Row[] = marginR.ok ?  dbRows(marginR.data)          : [];

      const totalAR   = Number(arRow['total_ar']      ?? 0);
      const overdueAR = Number(arRow['overdue_ar']    ?? 0);
      const totalAP   = Number(apRow['total_ap']      ?? 0);
      const overdueAP = Number(apRow['overdue_ap']    ?? 0);
      const cashBal   = Number(cashRow['cash_balance'] ?? 0);

      // Days until cash runs out assuming uniform AP burn over 30 days
      const dailyBurn      = totalAP > 0 ? totalAP / 30 : 1;
      const cashRunwayDays = Math.round(safeDiv(cashBal, dailyBurn));
      const collectionRisk = +safePct(overdueAR, totalAR).toFixed(1);

      const margins = marginRows.map(r => {
        const rev  = Number(r['revenue'] ?? 0);
        const cogs = Number(r['cogs']    ?? 0);
        return safePct(rev - cogs, rev);
      });
      const latestGrossProfitMargin = margins[0] ?? null;
      const profitMarginTrend: 'improving' | 'declining' | 'stable' =
        margins.length >= 2
          ? (margins[0] > margins[1] + 2 ? 'improving' : margins[0] < margins[1] - 2 ? 'declining' : 'stable')
          : 'stable';

      const risks: { category: string; level: RiskLevel; score: number; detail: string; recommendation: string }[] = [
        {
          category:       'Likvidlilik riski',
          level:          runwayRisk(cashRunwayDays),
          score:          clamp(Math.round(safeDiv(30, cashRunwayDays || 1) * 25), 0, 25),
          detail:         `Naqd pul ${cashRunwayDays} kunlik xarajatni qoplaydi`,
          recommendation: cashRunwayDays < 14 ? 'Debitorlarni undirishni tezlashtiring' : 'Yaxshi holat',
        },
        {
          category:       'Debitor riski',
          level:          pctRisk(collectionRisk, [10, 25, 40]),
          score:          clamp(Math.round(collectionRisk / 4), 0, 25),
          detail:         `AR ning ${collectionRisk.toFixed(0)}% muddati o'tgan`,
          recommendation: collectionRisk > 25 ? 'Inkasso jarayonini kuchaytiring' : 'Nazorat qiling',
        },
        {
          category:       'Foyda daromad riski',
          level:          pctRisk(25 - (latestGrossProfitMargin ?? 25), [0, 10, 20]),
          score:          clamp(Math.round(Math.max(0, 25 - (latestGrossProfitMargin ?? 0))), 0, 25),
          detail:         `Yalpi foyda marjasi: ${(latestGrossProfitMargin ?? 0).toFixed(1)}%`,
          recommendation: profitMarginTrend === 'declining' ? 'Xarajatlarni kamaytiring' : 'Daromadni oshiring',
        },
        {
          category:       'Kreditor riski',
          level:          pctRisk(safePct(overdueAP, totalAP), [1, 15, 30]),
          score:          clamp(Math.round(safePct(overdueAP, totalAP) / 4), 0, 25),
          detail:         `Muddati o'tgan AP: ${safePct(overdueAP, totalAP).toFixed(0)}%`,
          recommendation: overdueAP > 0 ? 'Yetkazuvchilar bilan muzokaralar olib boring' : 'Yaxshi holat',
        },
      ];

      const totalScore = risks.reduce((s, r) => s + r.score, 0);
      const overallRiskLevel: RiskLevel =
        totalScore >= 75 ? 'critical' : totalScore >= 50 ? 'high' : totalScore >= 25 ? 'medium' : 'low';

      const INSIGHTS: Record<RiskLevel, string> = {
        critical: 'Moliyaviy holat kritik darajada. Zudlik bilan chora ko\'ring: likvidlikni oshiring, debitorlarni undirishni tezlashtiring.',
        high:     'Moliyaviy risklari yuqori. Naqd pul oqimini nazorat qiling va muddati o\'tgan qarzlarni yig\'ib oling.',
        medium:   'O\'rtacha risk darajasi. Asosiy ko\'rsatkichlarni kuzatishda davom eting.',
        low:      'Moliyaviy holat yaxshi. Joriy strategiyani davom ettiring.',
      };

      return {
        generatedAt:      _time.now().toISOString(),
        overallRiskScore: totalScore,
        overallRiskLevel,
        summary: {
          totalAR, overdueAR, totalAP, overdueAP,
          cashBalanceUZS: cashBal,
          cashRunwayDays,
          collectionRisk,
          profitMarginTrend,
          latestGrossProfitMargin,
        },
        risks,
        bankAccounts: [],
        aiInsight: INSIGHTS[overallRiskLevel],
      };
    });
  }
}
