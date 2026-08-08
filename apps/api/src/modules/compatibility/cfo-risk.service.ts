/**
 * @module cfo-risk.service
 * @description Financial-risk sub-service split out of `CfoCompatService`
 *   so the parent file stays under 300 lines (Rule 16).
 *   Returns Result<T>; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result, AppError } from '@common/result';
import { safeDiv, clamp } from '@common/math';

type Row = Record<string, unknown>;
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Canonical GL source = `entries` table (ADR-003), NOT the dead/empty `gl_journal_entries`.
 * `entries` is double-entry (one row debits `debit_account_id` and credits
 * `credit_account_id` by `amount`); this CTE unfolds each row into two single-sided legs
 * (account_code + debit_amount/credit_amount) so the risk aggregations below run unchanged.
 * account_code is resolved via the `accounts` FK because the text `debit_account`/
 * `credit_account` columns are nullable.
 */
const GL_LEGS_CTE = sql`
  SELECT a.account_code AS account_code,
         e.amount       AS debit_amount,
         0::numeric     AS credit_amount,
         e.created_at   AS created_at
  FROM entries e
  JOIN accounts a ON a.id = e.debit_account_id
  UNION ALL
  SELECT a.account_code AS account_code,
         0::numeric     AS debit_amount,
         e.amount       AS credit_amount,
         e.created_at   AS created_at
  FROM entries e
  JOIN accounts a ON a.id = e.credit_account_id
`;

interface RiskSummary {
  totalAR: number;
  overdueAR: number;
  totalAP: number;
  overdueAP: number;
  cashBal: number;
  cashRunwayDays: number;
  collectionRisk: number;
  margins: number[];
}

interface RiskItem {
  category: string;
  level: RiskLevel;
  score: number;
  detail: string;
  recommendation: string;
}

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

const INSIGHTS: Record<RiskLevel, string> = {
  critical: 'Moliyaviy holat kritik darajada. Zudlik bilan chora ko\'ring: likvidlikni oshiring, debitorlarni undirishni tezlashtiring.',
  high:     'Moliyaviy risklari yuqori. Naqd pul oqimini nazorat qiling va muddati o\'tgan qarzlarni yig\'ib oling.',
  medium:   'O\'rtacha risk darajasi. Asosiy ko\'rsatkichlarni kuzatishda davom eting.',
  low:      'Moliyaviy holat yaxshi. Joriy strategiyani davom ettiring.',
};

@Injectable()
export class CfoRiskService {

  async getFinancialRisk(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const summary = await this.loadRiskSummary();
      const profitMarginTrend = this.computeMarginTrend(summary.margins);
      const latestGrossProfitMargin = summary.margins[0] ?? null;
      const risks = this.buildRiskItems(summary, latestGrossProfitMargin, profitMarginTrend);
      const totalScore = risks.reduce((s, r) => s + r.score, 0);
      const overallRiskLevel = this.scoreToLevel(totalScore);

      return {
        generatedAt:      _time.now().toISOString(),
        overallRiskScore: totalScore,
        overallRiskLevel,
        summary: {
          totalAR: summary.totalAR, overdueAR: summary.overdueAR,
          totalAP: summary.totalAP, overdueAP: summary.overdueAP,
          cashBalanceUZS: summary.cashBal,
          cashRunwayDays: summary.cashRunwayDays,
          collectionRisk: summary.collectionRisk,
          profitMarginTrend,
          latestGrossProfitMargin,
        },
        risks,
        bankAccounts: [],
        aiInsight: INSIGHTS[overallRiskLevel],
      };
    });
  }

  private async loadRiskSummary(): Promise<RiskSummary> {
    const [arR, apR, cashR, marginR] = await Promise.all([
      this.fetchArAggregate(), this.fetchApAggregate(), this.fetchCashBalance(), this.fetchMarginRows(),
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

    const dailyBurn      = totalAP > 0 ? totalAP / 30 : 1;
    const cashRunwayDays = Math.round(safeDiv(cashBal, dailyBurn));
    const collectionRisk = +safePct(overdueAR, totalAR).toFixed(1);
    const margins = marginRows.map(r => {
      const rev  = Number(r['revenue'] ?? 0);
      const cogs = Number(r['cogs']    ?? 0);
      return safePct(rev - cogs, rev);
    });

    return { totalAR, overdueAR, totalAP, overdueAP, cashBal, cashRunwayDays, collectionRisk, margins };
  }

  private fetchArAggregate() {
    return safeCall(() => rawSql(sql`
      SELECT
        COALESCE(SUM(total_amount), 0) AS total_ar,
        COALESCE(SUM(CASE WHEN status='overdue' THEN total_amount - COALESCE(paid_amount,0) ELSE 0 END), 0) AS overdue_ar
      FROM fi_invoices WHERE type != 'payable'
    `));
  }

  private fetchApAggregate() {
    return safeCall(() => rawSql(sql`
      SELECT
        COALESCE(SUM(total_amount), 0) AS total_ap,
        COALESCE(SUM(CASE WHEN status='overdue' THEN total_amount - COALESCE(paid_amount,0) ELSE 0 END), 0) AS overdue_ap
      FROM fi_invoices WHERE type = 'payable'
    `));
  }

  private fetchCashBalance() {
    return safeCall(() => rawSql(sql`
      WITH gl_legs AS (${GL_LEGS_CTE})
      SELECT COALESCE(SUM(debit_amount - credit_amount), 0) AS cash_balance
      FROM gl_legs WHERE account_code LIKE '11%'
    `));
  }

  private fetchMarginRows() {
    return safeCall(() => rawSql(sql`
      WITH gl_legs AS (${GL_LEGS_CTE})
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') AS month,
        COALESCE(SUM(CASE WHEN account_code LIKE '4%' THEN credit_amount - debit_amount ELSE 0 END), 0) AS revenue,
        COALESCE(SUM(CASE WHEN account_code LIKE '5%' THEN debit_amount - credit_amount ELSE 0 END), 0) AS cogs
      FROM gl_legs
      WHERE created_at >= NOW() - INTERVAL '3 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at) DESC
      LIMIT 3
    `));
  }

  private computeMarginTrend(margins: number[]): 'improving' | 'declining' | 'stable' {
    if (margins.length < 2) return 'stable';
    if (margins[0] > margins[1] + 2) return 'improving';
    if (margins[0] < margins[1] - 2) return 'declining';
    return 'stable';
  }

  private buildRiskItems(
    s: RiskSummary,
    latestMargin: number | null,
    trend: 'improving' | 'declining' | 'stable',
  ): RiskItem[] {
    const overduePctAP = safePct(s.overdueAP, s.totalAP);
    return [
      {
        category:       'Likvidlilik riski',
        level:          runwayRisk(s.cashRunwayDays),
        score:          clamp(Math.round(safeDiv(30, s.cashRunwayDays || 1) * 25), 0, 25),
        detail:         `Naqd pul ${s.cashRunwayDays} kunlik xarajatni qoplaydi`,
        recommendation: s.cashRunwayDays < 14 ? 'Debitorlarni undirishni tezlashtiring' : 'Yaxshi holat',
      },
      {
        category:       'Debitor riski',
        level:          pctRisk(s.collectionRisk, [10, 25, 40]),
        score:          clamp(Math.round(s.collectionRisk / 4), 0, 25),
        detail:         `AR ning ${s.collectionRisk.toFixed(0)}% muddati o'tgan`,
        recommendation: s.collectionRisk > 25 ? 'Inkasso jarayonini kuchaytiring' : 'Nazorat qiling',
      },
      {
        category:       'Foyda daromad riski',
        level:          pctRisk(25 - (latestMargin ?? 25), [0, 10, 20]),
        score:          clamp(Math.round(Math.max(0, 25 - (latestMargin ?? 0))), 0, 25),
        detail:         `Yalpi foyda marjasi: ${(latestMargin ?? 0).toFixed(1)}%`,
        recommendation: trend === 'declining' ? 'Xarajatlarni kamaytiring' : 'Daromadni oshiring',
      },
      {
        category:       'Kreditor riski',
        level:          pctRisk(overduePctAP, [1, 15, 30]),
        score:          clamp(Math.round(overduePctAP / 4), 0, 25),
        detail:         `Muddati o'tgan AP: ${overduePctAP.toFixed(0)}%`,
        recommendation: s.overdueAP > 0 ? 'Yetkazuvchilar bilan muzokaralar olib boring' : 'Yaxshi holat',
      },
    ];
  }

  private scoreToLevel(score: number): RiskLevel {
    if (score >= 75) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 25) return 'medium';
    return 'low';
  }
}
