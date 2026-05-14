/**
 * @module financial-reports-analytics.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';

export interface AbcItem { id: string | number; value: number; volume: number }
export interface AbcXyzResult { id: string | number; value: number; volume: number; abc: 'A' | 'B' | 'C'; xyz: 'X' | 'Y' | 'Z'; cv: number }

export interface LiquidityRatios { currentRatio: number; quickRatio: number; cashRatio: number }
export interface ProfitabilityRatios { roa: number; roe: number }
export interface TrendResult { slope: number; direction: 'up' | 'down' | 'flat'; changePercent: number }

@Injectable()
export class FinancialReportsAnalyticsService {

  abcXyzAnalysis(items: AbcItem[]): AbcXyzResult[] {
    if (!items.length) return [];

    const total = items.reduce((s, i) => s + i.value, 0);
    const sorted = [...items].sort((a, b) => b.value - a.value);

    let cumulative = 0;
    const withAbc = sorted.map((item) => {
      cumulative += item.value;
      const pct = total > 0 ? (cumulative / total) * 100 : 0;
      const abc: 'A' | 'B' | 'C' = pct <= 80 ? 'A' : pct <= 95 ? 'B' : 'C';
      return { ...item, abc };
    });

    // XYZ: coefficient of variation on volume per period
    return withAbc.map((item) => {
      const cv = item.volume > 0 ? (Math.sqrt(item.volume) / item.volume) * 100 : 0;
      const xyz: 'X' | 'Y' | 'Z' = cv <= 10 ? 'X' : cv <= 25 ? 'Y' : 'Z';
      return { ...item, xyz, cv: Math.round(cv * 100) / 100 };
    });
  }

  liquidityRatios(
    currentAssets: number,
    inventory: number,
    cash: number,
    currentLiabilities: number,
  ): LiquidityRatios {
    const safe = currentLiabilities > 0 ? currentLiabilities : 1;
    return {
      currentRatio: Math.round((currentAssets / safe) * 100) / 100,
      quickRatio:   Math.round(((currentAssets - inventory) / safe) * 100) / 100,
      cashRatio:    Math.round((cash / safe) * 100) / 100,
    };
  }

  roaRoe(netIncome: number, totalAssets: number, equity: number): ProfitabilityRatios {
    return {
      roa: totalAssets > 0 ? Math.round((netIncome / totalAssets) * 10000) / 100 : 0,
      roe: equity > 0       ? Math.round((netIncome / equity) * 10000) / 100       : 0,
    };
  }

  cashConversionCycle(dso: number, dpo: number, dio: number): number {
    return Math.round((dso + dio - dpo) * 100) / 100;
  }

  trendAnalysis(series: number[]): TrendResult {
    if (series.length < 2) return { slope: 0, direction: 'flat', changePercent: 0 };

    const n = series.length;
    const xMean = (n - 1) / 2;
    const yMean = series.reduce((s, v) => s + v, 0) / n;

    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      num += (i - xMean) * (series[i] - yMean);
      den += (i - xMean) ** 2;
    }
    const slope = den !== 0 ? num / den : 0;

    const first = series[0];
    const last  = series[n - 1];
    const changePercent = first !== 0 ? Math.round(((last - first) / Math.abs(first)) * 10000) / 100 : 0;
    const direction: 'up' | 'down' | 'flat' = slope > 0.01 ? 'up' : slope < -0.01 ? 'down' : 'flat';

    return { slope: Math.round(slope * 10000) / 10000, direction, changePercent };
  }

  formatCurrency(amount: number, currency = 'UZS'): string {
    return `${new Intl.NumberFormat('uz-UZ').format(Math.round(amount))} ${currency}`;
  }
}
