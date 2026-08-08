/**
 * @module ap-aging.handler
 * @description CQRS query handler — AP (accounts-payable / creditor) aging by due-date bucket,
 *   symmetric to ArAgingHandler. execute() returns Result<ApAgingResult>. Tashkent TZ.
 *   Unlike AR, payables carry no ECL (you owe the money — there is no expected-credit-loss),
 *   so buckets report amount/percentage only. Source = finance_invoices WHERE invoice_type='purchase'.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Ok, Result } from '@common/result';

export class ApAgingQuery {}

export interface ApAgingBucket {
  days: string;
  amount: number;
  invoiceCount: number;
  percentage: number;
}

export interface ApAgingResult {
  totalAp: number;
  current: ApAgingBucket;
  thirtyDays: ApAgingBucket;
  sixtyDays: ApAgingBucket;
  ninetyDaysPlus: ApAgingBucket;
  asOf: Date;
}

@QueryHandler(ApAgingQuery)
export class ApAgingHandler implements IQueryHandler<ApAgingQuery> {
  private readonly logger = new Logger(ApAgingQuery.name);

  async execute(): Promise<Result<ApAgingResult>> {
    this.logger.debug('AP aging SQL-native calculation started (Tashkent TZ)');

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
      FROM finance_invoices
      WHERE payment_status NOT IN ('paid', 'cancelled', 'void')
        AND COALESCE(invoice_type, 'sales') = 'purchase'
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

    const makeBucket = (key: string, label: string): ApAgingBucket => {
      const b = bucketMap.get(key) ?? { amount: 0, invoiceCount: 0 };
      return { days: label, amount: b.amount, invoiceCount: b.invoiceCount, percentage: 0 };
    };

    const current        = makeBucket('0-30',  '0–30 kun');
    const thirtyDays     = makeBucket('31-60', '31–60 kun');
    const sixtyDays      = makeBucket('61-90', '61–90 kun');
    const ninetyDaysPlus = makeBucket('90+',   '90+ kun');

    const totalAp = current.amount + thirtyDays.amount + sixtyDays.amount + ninetyDaysPlus.amount;
    if (totalAp > 0) {
      current.percentage        = +(current.amount        / totalAp * 100).toFixed(2);
      thirtyDays.percentage     = +(thirtyDays.amount     / totalAp * 100).toFixed(2);
      sixtyDays.percentage      = +(sixtyDays.amount      / totalAp * 100).toFixed(2);
      ninetyDaysPlus.percentage = +(ninetyDaysPlus.amount / totalAp * 100).toFixed(2);
    }

    this.logger.log(`AP aging done — totalAP=${totalAp}`);

    return Ok({ totalAp, current, thirtyDays, sixtyDays, ninetyDaysPlus, asOf: _time.now() });
  }
}
