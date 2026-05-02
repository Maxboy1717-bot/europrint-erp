import { Ok, Err, Result, AppError } from '@common/result';

export interface NpvResult {
  npv: number;
  discountRate: number;
  cashFlows: number[];
}

export interface IrrResult {
  irr: number;
  converged: boolean;
}

export interface DiscountedPaybackResult {
  paybackPeriod: number;
  discountedCumulativeFlows: number[];
}

export interface LiquidityRatios {
  workingCapital: number;
  currentRatio: number;
  quickRatio: number;
  cashRatio: number;
}

export interface WeeklyForecastLine {
  week: number;
  weekStart: Date;
  weekEnd: Date;
  inflows: number;
  outflows: number;
  netCashFlow: number;
  cumulativeCash: number;
}

export class InvestmentService {
  validateCashFlows(cashFlows: number[]): Result<void, AppError> {
    if (!Array.isArray(cashFlows) || cashFlows.length === 0)
      return Err({ code: 'VALIDATION', message: 'Pul oqimlari bo\'sh bo\'lmasligi kerak' });
    if (cashFlows?.some(cf => !isFinite(cf)))
      return Err({ code: 'VALIDATION', message: 'Pul oqimlarida noto\'g\'ri raqam mavjud' });
    return Ok(undefined);
  }

  npv(rate: number, cashFlows: number[]): NpvResult {
    if (cashFlows.length === 0) return { npv: 0, discountRate: rate, cashFlows };
    let total = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      total += cashFlows[t] / Math.pow(1 + rate, t);
    }
    return { npv: +total.toFixed(6), discountRate: rate, cashFlows };
  }

  irr(cashFlows: number[], maxIter = 100, tol = 1e-10): IrrResult {
    let lo = -0.999;
    let hi = 10.0;
    const safeCashFlows = Array.isArray(cashFlows) ? cashFlows : [];
    const npvAt = (r: number) => (safeCashFlows ?? []).reduce((s, cf, t) => s + cf / Math.pow(1 + r, t), 0);

    let loVal = npvAt(lo);
    let hiVal = npvAt(hi);

    if (loVal * hiVal > 0) {
      return { irr: 0, converged: false };
    }

    let mid = 0;
    for (let i = 0; i < maxIter; i++) {
      mid = (lo + hi) / 2;
      const midVal = npvAt(mid);
      if (Math.abs(midVal) < tol || (hi - lo) / 2 < tol) {
        return { irr: +mid.toFixed(8), converged: true };
      }
      if (loVal * midVal < 0) {
        hi = mid;
        hiVal = midVal;
      } else {
        lo = mid;
        loVal = midVal;
      }
    }
    return { irr: +mid.toFixed(8), converged: true };
  }

  discountedPayback(rate: number, cashFlows: number[]): DiscountedPaybackResult {
    const discounted = (Array.isArray(cashFlows) ? cashFlows : []).map((cf, t) => cf / Math.pow(1 + rate, t));
    const cumulative: number[] = [];
    let running = 0;
    for (const d of discounted) {
      running += d;
      cumulative.push(+running.toFixed(6));
    }

    let payback = -1;
    for (let i = 1; i < cumulative.length; i++) {
      if (cumulative[i - 1] < 0 && cumulative[i] >= 0) {
        const frac = -cumulative[i - 1] / (cumulative[i] - cumulative[i - 1]);
        payback = i - 1 + frac;
        break;
      }
      if (cumulative[i] >= 0 && i === 1) {
        payback = cumulative[i - 1] < 0 ? i - 1 + (-cumulative[i - 1]) / (cumulative[i] - cumulative[i - 1]) : 0;
        break;
      }
    }

    return { paybackPeriod: +(payback < 0 ? Infinity : payback).toFixed(4), discountedCumulativeFlows: cumulative };
  }

  liquidityRatios(
    currentAssets: number,
    currentLiabilities: number,
    inventory: number,
    cash: number,
  ): LiquidityRatios {
    const wc = currentAssets - currentLiabilities;
    const cr = currentLiabilities > 0 ? currentAssets / currentLiabilities : Infinity;
    const qr = currentLiabilities > 0 ? (currentAssets - inventory) / currentLiabilities : Infinity;
    const cashR = currentLiabilities > 0 ? cash / currentLiabilities : Infinity;
    return {
      workingCapital: +wc.toFixed(4),
      currentRatio: isFinite(cr) ? +cr.toFixed(4) : cr,
      quickRatio: isFinite(qr) ? +qr.toFixed(4) : qr,
      cashRatio: isFinite(cashR) ? +cashR.toFixed(4) : cashR,
    };
  }

  cashflow13Week(
    openingBalance: number,
    weeklyInflows: number[],
    weeklyOutflows: number[],
    startDate: Date,
  ): WeeklyForecastLine[] {
    const WEEKS = 13;
    const lines: WeeklyForecastLine[] = [];
    let cumulative = openingBalance;

    for (let w = 0; w < WEEKS; w++) {
      const inflows = weeklyInflows[w] ?? 0;
      const outflows = weeklyOutflows[w] ?? 0;
      const net = inflows - outflows;
      cumulative += net;

      const weekStart = new Date(startDate.getTime() + w * 7 * 24 * 60 * 60 * 1000);
      const weekEnd   = new Date(startDate.getTime() + (w + 1) * 7 * 24 * 60 * 60 * 1000 - 1);

      lines.push({
        week: w + 1,
        weekStart,
        weekEnd,
        inflows: +inflows.toFixed(2),
        outflows: +outflows.toFixed(2),
        netCashFlow: +net.toFixed(2),
        cumulativeCash: +cumulative.toFixed(2),
      });
    }

    return lines;
  }
}
