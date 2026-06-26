/**
 * @module ar-aging.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Ok, Result } from '@common/result';
import { CfoConfigService } from '../../domain/services/cfo-config.service';

export class ArAgingQuery {}

export interface AgingBucket {
  days: string;
  amount: number;
  invoiceCount: number;
  percentage: number;
  ecl: number;
  eclRate: number;
}

export interface ArAgingResult {
  totalAr: number;
  totalEcl: number;
  current: AgingBucket;
  thirtyDays: AgingBucket;
  sixtyDays: AgingBucket;
  ninetyDaysPlus: AgingBucket;
  asOf: Date;
}

const DEFAULT_ECL_RATES: Record<string, number> = {
  'ar_ecl_rate_0_30':    0.02,
  'ar_ecl_rate_31_60':   0.08,
  'ar_ecl_rate_61_90':   0.20,
  'ar_ecl_rate_91_plus': 0.50,
};

@QueryHandler(ArAgingQuery)
export class ArAgingHandler implements IQueryHandler<ArAgingQuery> {
  private readonly logger = new Logger(ArAgingQuery.name);

  constructor(private readonly cfoConfig: CfoConfigService) {}

  async execute(): Promise<Result<ArAgingResult>> {
    this.logger.debug('AR aging SQL-native calculation started (Tashkent TZ)');

    const eclMapResult = await this.cfoConfig.getMap([
      'ar_ecl_rate_0_30', 'ar_ecl_rate_31_60', 'ar_ecl_rate_61_90', 'ar_ecl_rate_91_plus',
    ]);
    const eclMap = eclMapResult.ok ? eclMapResult.data : new Map<string, import('decimal.js').default>();
    const eclRates: Record<string, number> = {
      '0-30':  eclMap.get('ar_ecl_rate_0_30')?.toNumber()   ?? DEFAULT_ECL_RATES['ar_ecl_rate_0_30']   ?? 0.01,
      '31-60': eclMap.get('ar_ecl_rate_31_60')?.toNumber()  ?? DEFAULT_ECL_RATES['ar_ecl_rate_31_60']  ?? 0.05,
      '61-90': eclMap.get('ar_ecl_rate_61_90')?.toNumber()  ?? DEFAULT_ECL_RATES['ar_ecl_rate_61_90']  ?? 0.20,
      '90+':   eclMap.get('ar_ecl_rate_91_plus')?.toNumber() ?? DEFAULT_ECL_RATES['ar_ecl_rate_91_plus'] ?? 0.50,
    };

    const result = await runQuery<Record<string, unknown>>(sql`
      SELECT
        CASE
          WHEN ((NOW() AT TIME ZONE 'Asia/Tashkent')::date - due_date::date) <= 30 THEN '0-30'
          WHEN ((NOW() AT TIME ZONE 'Asia/Tashkent')::date - due_date::date) <= 60 THEN '31-60'
          WHEN ((NOW() AT TIME ZONE 'Asia/Tashkent')::date - due_date::date) <= 90 THEN '61-90'
          ELSE '90+'
        END                              AS bucket,
        COUNT(*)::int                    AS invoice_count,
        COALESCE(SUM(
          total_amount - COALESCE(paid_amount, 0)
        ), 0)::numeric(18,4)             AS remaining
      FROM fi_invoices
      WHERE status NOT IN ('paid', 'cancelled', 'void')
        AND COALESCE(type, 'receivable') = 'receivable'
        AND total_amount > COALESCE(paid_amount, 0)
      GROUP BY 1
    `);

    const bucketMap = new Map<string, { amount: number; invoiceCount: number }>();
    for (const row of (result.rows ?? [])) {
      bucketMap.set(String(row['bucket']), {
        amount: Number(row['remaining'] ?? 0),
        invoiceCount: Number(row['invoice_count'] ?? 0),
      });
    }

    const makeBucket = (key: string, label: string): AgingBucket => {
      const b = bucketMap.get(key) ?? { amount: 0, invoiceCount: 0 };
      const eclRate = eclRates[key] ?? 0;
      return {
        days: label,
        amount: b.amount,
        invoiceCount: b.invoiceCount,
        percentage: 0,
        ecl: +(b.amount * eclRate).toFixed(4),
        eclRate,
      };
    };

    const current        = makeBucket('0-30',  '0–30 kun');
    const thirtyDays     = makeBucket('31-60', '31–60 kun');
    const sixtyDays      = makeBucket('61-90', '61–90 kun');
    const ninetyDaysPlus = makeBucket('90+',   '90+ kun');

    const totalAr  = current.amount + thirtyDays.amount + sixtyDays.amount + ninetyDaysPlus.amount;
    const totalEcl = current.ecl    + thirtyDays.ecl    + sixtyDays.ecl    + ninetyDaysPlus.ecl;

    if (totalAr > 0) {
      current.percentage        = +(current.amount        / totalAr * 100).toFixed(2);
      thirtyDays.percentage     = +(thirtyDays.amount     / totalAr * 100).toFixed(2);
      sixtyDays.percentage      = +(sixtyDays.amount      / totalAr * 100).toFixed(2);
      ninetyDaysPlus.percentage = +(ninetyDaysPlus.amount / totalAr * 100).toFixed(2);
    }

    this.logger.log(`AR aging done — totalAR=${totalAr}, ECL=${totalEcl}`);

    return Ok({
      totalAr,
      totalEcl: +totalEcl.toFixed(4),
      current,
      thirtyDays,
      sixtyDays,
      ninetyDaysPlus,
      asOf: _time.now(),
    });
  }
}
