/**
 * @module finance-ap.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Inject, Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { FINANCE_AP_REPO, type IFinanceApRepo, type ApBucket, type CreateApEntryDto } from '../domain/repositories/i-finance-ap.repo';

import { MS_PER_DAY } from '@common/constants/app.constants';
@Injectable()
export class FinanceApService {
  constructor(@Inject(FINANCE_AP_REPO) private readonly repo: IFinanceApRepo) {}

  async getAgingBuckets(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const [bucketsResult, totalsResult] = await Promise.all([
        this.repo.getApAgingBuckets(),
        this.repo.getApAgingTotals(),
      ]);
      const buckets = bucketsResult.ok ? bucketsResult.data : [];
      const totals = totalsResult.ok ? totalsResult.data : [];
      return { buckets, totals };
    });
  }

  async getOverdue() {
    const today = _time.now().toISOString().split('T')[0];
    return this.repo.getOverduePurchaseInvoices(today);
  }

  async createEntry(dto: CreateApEntryDto) {
    return this.repo.createApEntry(dto);
  }

  async recalculateAging() {
    return safeCall(async () => {
      const invoicesResult = await this.repo.getUnpaidPurchaseInvoices();
      const invoices = invoicesResult.ok ? invoicesResult.data : [];
      const today = _time.now();
      const buckets: Record<string, ApBucket> = {};
      for (const inv of invoices) {
        const r = inv as Record<string, unknown>;
        if (!r['due_date']) continue;
        const dueDate = new Date(r['due_date'] as string);
        const daysPast = Math.floor((today.getTime() - dueDate.getTime()) / MS_PER_DAY);
        const amount = (Number(r['total_amount']) || 0) - (Number(r['paid_amount']) || 0);
        const key = String(r['supplier_name'] || 'unknown');
        if (!buckets[key]) buckets[key] = { vendor_id: null, current: 0, days_31_60: 0, days_61_90: 0, days_91_120: 0, over_120: 0, total_outstanding: 0 };
        if (daysPast <= 30) buckets[key].current += amount;
        else if (daysPast <= 60) buckets[key].days_31_60 += amount;
        else if (daysPast <= 90) buckets[key].days_61_90 += amount;
        else if (daysPast <= 120) buckets[key].days_91_120 += amount;
        else buckets[key].over_120 += amount;
        buckets[key].total_outstanding += amount;
      }
      // Atomic: clear + reinsert in one transaction (was: delete + N inserts, partial-failure risk)
      await this.repo.replaceApAgingBuckets(Object.values(buckets));
      return Object.keys(buckets).length;
    });
  }
}
