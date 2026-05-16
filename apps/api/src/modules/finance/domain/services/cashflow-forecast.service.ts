/**
 * @module cashflow-forecast.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 *
 * Domain-layer service — MUST NOT import Drizzle / @shared/db. Persistence
 * is delegated to IFinanceRepo (see P0-2 DDD audit).
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { Ok, Err, AppErr, Result, AppError } from '@common/result';
import { roundTo } from '@common/math/math-utils';
import { Calculation } from '@common/decorators/calculation.decorator';
import { CfoConfigService } from './cfo-config.service';
import { TashkentTimeService } from '@common/time';
import { FINANCE_REPO, IFinanceRepo, CashflowWeekRaw } from '../repositories/i-finance.repo';

const DEFAULT_WEEKS          = 13;
const OPTIMISTIC_MULTIPLIER  = 1.20;
const PESSIMISTIC_MULTIPLIER = 0.80;

export interface WeeklyForecast {
  week: number;
  weekStart: string;
  weekEnd: string;
  arCollection: number;
  confirmedSoInflow: number;
  totalInflow: number;
  apPayment: number;
  payrollOutflow: number;
  taxPayment: number;
  totalOutflow: number;
  netCashFlow: number;
  cumulativeCash: number;
  status: 'OK' | 'WARNING' | 'CRITICAL';
}

export interface CashflowForecastDto {
  openingBalance: number;
  minCash: number;
  weeks: number;
  scenarios: {
    optimistic: WeeklyForecast[];
    base: WeeklyForecast[];
    pessimistic: WeeklyForecast[];
  };
  generatedAt: string;
}

interface WeekRaw extends CashflowWeekRaw {
  vatOut: number;
}

@Injectable()
export class CashflowForecastService {
  private readonly logger = new Logger(CashflowForecastService.name);
  private readonly time = new TashkentTimeService();

  constructor(
    private readonly cfoConfig: CfoConfigService,
    @Inject(FINANCE_REPO) private readonly repo: IFinanceRepo,
  ) {}

  @Calculation('cashflow-forecast-weeks')
  async forecastWeeks(weeks: number = DEFAULT_WEEKS): Promise<Result<CashflowForecastDto, AppError>> {
    try {
      const [openingBal, minCash, monthlyTax, eclMap] = await Promise.all([
        this.cfoConfig.getNumber('opening_cash_balance_uzs', 0),
        this.cfoConfig.getNumber('min_cash_reserve_uzs', 50_000_000),
        this.cfoConfig.getNumber('monthly_tax_estimate_uzs', 0),
        this.cfoConfig.getMap([
          'ar_ecl_rate_0_30', 'ar_ecl_rate_31_60', 'ar_ecl_rate_61_90', 'ar_ecl_rate_91_plus',
        ]),
      ]);

      const ecl030  = eclMap.ok ? eclMap.data.get('ar_ecl_rate_0_30')?.toNumber()  ?? 0.02 : 0.02;
      const ecl3160 = eclMap.ok ? eclMap.data.get('ar_ecl_rate_31_60')?.toNumber() ?? 0.08 : 0.08;
      const ecl6190 = eclMap.ok ? eclMap.data.get('ar_ecl_rate_61_90')?.toNumber() ?? 0.20 : 0.20;
      const ecl91p  = eclMap.ok ? eclMap.data.get('ar_ecl_rate_91_plus')?.toNumber() ?? 0.50 : 0.50;

      const today      = this.time.today();
      const weeklyTax  = roundTo(monthlyTax / 4, 2);
      const weekData   = await this.loadWeeklyData(today, weeks, ecl030, ecl3160, ecl6190, ecl91p, weeklyTax);

      const base        = this.buildScenario(openingBal, minCash, weekData, 1.0, today);
      const optimistic  = this.buildScenario(openingBal, minCash, weekData, OPTIMISTIC_MULTIPLIER, today);
      const pessimistic = this.buildScenario(openingBal, minCash, weekData, PESSIMISTIC_MULTIPLIER, today);

      return Ok({
        openingBalance: roundTo(openingBal, 2),
        minCash:        roundTo(minCash, 2),
        weeks,
        scenarios: { base, optimistic, pessimistic },
        generatedAt: this.time.formatDate(this.time.now()),
      });
    } catch (err) {
      this.logger.error(`CashflowForecastService.forecastWeeks xato: ${String(err)}`);
      return Err(AppErr('INTERNAL', 'Ichki server xatosi'));
    }
  }

  private async loadWeeklyData(
    startDate: Date,
    weeks: number,
    ecl030: number, ecl3160: number, ecl6190: number, ecl91p: number,
    weeklyTax: number,
  ): Promise<WeekRaw[]> {
    const results: WeekRaw[] = [];
    for (let w = 0; w < weeks; w++) {
      const ws    = new Date(startDate.getTime() + w * 7 * 86400_000);
      const we    = new Date(startDate.getTime() + (w + 1) * 7 * 86400_000 - 1);
      const wsStr = this.time.formatDate(ws);
      const weStr = this.time.formatDate(we);

      const week = await this.repo.fetchCashflowWeek(wsStr, weStr, {
        e030: ecl030, e3160: ecl3160, e6190: ecl6190, e91p: ecl91p,
      });

      const isTaxWeek = (w + 1) % 4 === 0;
      results.push({
        ...week,
        vatOut: isTaxWeek ? weeklyTax : 0,
      });
    }
    return results;
  }

  private buildScenario(
    opening: number, minCash: number,
    weekData: WeekRaw[], inflowMultiplier: number, startDate: Date,
  ): WeeklyForecast[] {
    let cumulative = opening;
    return (Array.isArray(weekData) ? weekData : []).map((w, idx) => {
      const ws       = new Date(startDate.getTime() + idx * 7 * 86400_000);
      const we       = new Date(startDate.getTime() + (idx + 1) * 7 * 86400_000 - 1);
      const arCol    = roundTo(w.arCol    * inflowMultiplier, 2);
      const soInflow = roundTo(w.soInflow * inflowMultiplier, 2);
      const totalIn  = roundTo(arCol + soInflow, 2);
      const taxOut   = w.vatOut;
      const totalOut = roundTo(w.apOut + w.payrollOut + taxOut, 2);
      const net      = roundTo(totalIn - totalOut, 2);
      cumulative     = roundTo(cumulative + net, 2);
      const status: 'OK' | 'WARNING' | 'CRITICAL' =
        cumulative < minCash ? 'CRITICAL' : cumulative < 2 * minCash ? 'WARNING' : 'OK';
      return {
        week: idx + 1,
        weekStart: this.time.formatDate(ws), weekEnd: this.time.formatDate(we),
        arCollection: arCol, confirmedSoInflow: soInflow, totalInflow: totalIn,
        apPayment: roundTo(w.apOut, 2), payrollOutflow: roundTo(w.payrollOut, 2),
        taxPayment: taxOut, totalOutflow: totalOut, netCashFlow: net,
        cumulativeCash: cumulative, status,
      };
    });
  }
}
