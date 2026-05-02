import { Injectable, Logger } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Ok, Err, AppErr, Result, AppError } from '@common/result';
import { safeNum, roundTo } from '@common/math/math-utils';
import { Calculation } from '@common/decorators/calculation.decorator';
import { CfoConfigService } from './cfo-config.service';
import { TashkentTimeService } from '@common/time';

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

type Row = Record<string, unknown>;

interface WeekRaw {
  arCol: number;
  soInflow: number;
  apOut: number;
  payrollOut: number;
  vatOut: number;
}

@Injectable()
export class CashflowForecastService {
  private readonly logger = new Logger(CashflowForecastService.name);
  private readonly time = new TashkentTimeService();

  constructor(private readonly cfoConfig: CfoConfigService) {}

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

      const [arRows, soRows, apRows, payRows] = await Promise.all([
        runQuery<Row>(sql`
          SELECT
            COALESCE(SUM(
              CASE WHEN age_days BETWEEN 0  AND 30  THEN balance * ${1 - ecl030}
                   WHEN age_days BETWEEN 31 AND 60  THEN balance * ${1 - ecl3160}
                   WHEN age_days BETWEEN 61 AND 90  THEN balance * ${1 - ecl6190}
                   WHEN age_days > 90               THEN balance * ${1 - ecl91p}
                   ELSE 0 END
            ), 0) AS ar_col
          FROM (
            SELECT total_amount AS balance,
                   (${wsStr}::date - DATE(created_at)) AS age_days
            FROM fi_invoices
            WHERE status NOT IN ('paid', 'cancelled')
              AND (invoice_type IS NULL OR invoice_type != 'payable')
              AND DATE(due_date) BETWEEN ${wsStr}::date AND ${weStr}::date
          ) sub
        `),
        runQuery<Row>(sql`
          SELECT COALESCE(SUM(total_amount), 0) AS so_total
          FROM sales_orders
          WHERE status IN ('confirmed', 'in_production')
            AND delivery_date BETWEEN ${wsStr} AND ${weStr}
        `),
        runQuery<Row>(sql`
          SELECT COALESCE(SUM(total_amount), 0) AS ap_out
          FROM fi_invoices
          WHERE invoice_type = 'payable'
            AND status NOT IN ('paid', 'cancelled')
            AND DATE(due_date) BETWEEN ${wsStr}::date AND ${weStr}::date
        `),
        runQuery<Row>(sql`
          SELECT COALESCE(SUM(net_pay), 0) AS payroll_out
          FROM payroll_entries
          WHERE DATE(created_at) BETWEEN ${wsStr}::date AND ${weStr}::date
        `),
      ]);

      const isTaxWeek = (w + 1) % 4 === 0;
      results.push({
        arCol:      safeNum(arRows[0]?.['ar_col'], 0),
        soInflow:   safeNum(soRows[0]?.['so_total'], 0),
        apOut:      safeNum(apRows[0]?.['ap_out'], 0),
        payrollOut: safeNum(payRows[0]?.['payroll_out'], 0),
        vatOut:     isTaxWeek ? weeklyTax : 0,
      });
    }
    return results;
  }

  private buildScenario(
    opening: number, minCash: number,
    weekData: WeekRaw[], inflowMultiplier: number, startDate: Date,
  ): WeeklyForecast[] {
    let cumulative = opening;
    return (weekData ?? []).map((w, idx) => {
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
