/**
 * @module finance-ar.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Inject, Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { FINANCE_AR_REPO, type IFinanceArRepo, type ArBucket, type CreateArEntryDto } from '../domain/repositories/i-finance-ar.repo';

import { MS_PER_DAY } from '@common/constants/app.constants';
@Injectable()
export class FinanceArService {
  constructor(@Inject(FINANCE_AR_REPO) private readonly repo: IFinanceArRepo) {}

  async getAgingBuckets(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const [bucketsResult, totalsResult] = await Promise.all([
        this.repo.getArAgingBuckets(),
        this.repo.getArAgingTotals(),
      ]);
      const buckets = bucketsResult.ok ? bucketsResult.data : [];
      const totals = totalsResult.ok ? totalsResult.data : [];
      return { buckets, totals };
    });
  }

  async getOverdue() {
    const today = _time.now().toISOString().split('T')[0];
    return this.repo.getOverdueInvoices(today);
  }

  async createEntry(dto: CreateArEntryDto) {
    return this.repo.createArEntry(dto);
  }

  async recalculateAging() {
    return safeCall(async () => {
      const invoicesResult = await this.repo.getUnpaidInvoices();
      const invoices = invoicesResult.ok ? invoicesResult.data : [];
      const today = _time.now();
      const buckets: Record<string, ArBucket> = {};
      for (const inv of invoices) {
        const r = inv as Record<string, unknown>;
        if (!r['due_date']) continue;
        const dueDate = new Date(r['due_date'] as string);
        const daysPast = Math.floor((today.getTime() - dueDate.getTime()) / MS_PER_DAY);
        const amount = (Number(r['total_amount']) || 0) - (Number(r['paid_amount']) || 0);
        const key = String(r['customer_name'] || 'unknown');
        if (!buckets[key]) buckets[key] = { customer_id: key, customer_type: 'company', current: 0, days_31_60: 0, days_61_90: 0, days_91_120: 0, over_120: 0, total_outstanding: 0 };
        if (daysPast <= 30) buckets[key].current += amount;
        else if (daysPast <= 60) buckets[key].days_31_60 += amount;
        else if (daysPast <= 90) buckets[key].days_61_90 += amount;
        else if (daysPast <= 120) buckets[key].days_91_120 += amount;
        else buckets[key].over_120 += amount;
        buckets[key].total_outstanding += amount;
      }
      // Atomic: clear + reinsert in one transaction (was: delete + N inserts, partial-failure risk)
      await this.repo.replaceArAgingBuckets(Object.values(buckets));
      return Object.keys(buckets).length;
    });
  }
}
