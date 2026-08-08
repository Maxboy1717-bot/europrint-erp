/**
 * @module customer-abc.service
 * @description T18-C4 master-data: customer ABC segmentation by annual purchase.
 *
 * Vision: each customer is auto-classified A/B/C from their last-12-month purchase
 * revenue using a cumulative-share Pareto rule:
 *   - sort customers by annual revenue DESC
 *   - walk the cumulative share of total revenue
 *   - A while cumulative ≤ 80%, B while ≤ 95%, C otherwise
 *   - customers with zero annual revenue → 'C' (lowest)
 *
 * Pure compute (computeAbc) is unit-testable and side-effect free; the repo write
 * (persistAbc) is delegated. Result<T> throughout (Qoida 1); thresholds are named
 * constants (Qoida 12); never fabricates revenue (Q-40 — reads live sales_orders).
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { Ok, Result, safeCall, AppError } from '@common/result';
import { CUSTOMER_ABC_CUMULATIVE } from '@common/constants/business.constants';
import {
  SD_CUSTOMER_ABC_REPO,
  type ISdCustomerAbcRepo,
  type CustomerAnnualRevenue,
} from '../infrastructure/repositories/i-sd-customer-abc.repo';

export type AbcClass = 'A' | 'B' | 'C';

export interface CustomerAbcResult {
  id: number;
  name: string;
  annualRevenue: number;
  cumulativeShare: number; // 0..1 cumulative share AFTER this customer
  abcClass: AbcClass;
}

@Injectable()
export class CustomerAbcService {
  private readonly logger = new Logger(CustomerAbcService.name);

  constructor(
    @Inject(SD_CUSTOMER_ABC_REPO) private readonly repo: ISdCustomerAbcRepo,
  ) {}

  /**
   * Pure ABC classification from a list of (id, name, annualRevenue).
   * Deterministic: stable sort by revenue DESC then id ASC. No DB, no I/O.
   */
  computeAbc(rows: CustomerAnnualRevenue[]): CustomerAbcResult[] {
    const safe = Array.isArray(rows) ? rows : [];
    const sorted = [...safe].sort((a, b) =>
      b.annualRevenue - a.annualRevenue || a.id - b.id,
    );
    const total = sorted.reduce((s, r) => s + (r.annualRevenue > 0 ? r.annualRevenue : 0), 0);

    let running = 0;
    return sorted.map((r) => {
      const rev = r.annualRevenue > 0 ? r.annualRevenue : 0;
      running += rev;
      const cumulativeShare = total > 0 ? running / total : 0;
      // Zero-revenue customers always land in C (they add nothing to cumulative).
      let abcClass: AbcClass;
      if (rev <= 0 || total <= 0) {
        abcClass = 'C';
      } else if (cumulativeShare <= CUSTOMER_ABC_CUMULATIVE.A) {
        abcClass = 'A';
      } else if (cumulativeShare <= CUSTOMER_ABC_CUMULATIVE.B) {
        abcClass = 'B';
      } else {
        abcClass = 'C';
      }
      return {
        id: r.id,
        name: r.name,
        annualRevenue: rev,
        cumulativeShare: Math.round(cumulativeShare * 10000) / 10000,
        abcClass,
      };
    });
  }

  /**
   * Recompute ABC for every active customer from live last-12-month sales and
   * persist the class onto sd_customers.abc_class. Returns the per-customer
   * breakdown plus a class-count summary. Idempotent.
   */
  async recompute(): Promise<Result<{ updated: number; summary: Record<AbcClass, number>; customers: CustomerAbcResult[] }, AppError>> {
    return safeCall(async () => {
      const revR = await this.repo.getAnnualRevenue();
      const rows = revR.ok ? revR.data : [];
      const classified = this.computeAbc(rows);

      const writeR = await this.repo.persistAbc(
        classified.map((c) => ({ id: c.id, abcClass: c.abcClass })),
      );
      const updated = writeR.ok ? writeR.data : 0;

      const summary: Record<AbcClass, number> = { A: 0, B: 0, C: 0 };
      for (const c of classified) summary[c.abcClass] += 1;

      this.logger.log(`Customer ABC recompute: updated=${updated} A=${summary.A} B=${summary.B} C=${summary.C}`);
      return { updated, summary, customers: classified };
    });
  }

  /** Read-only preview (compute, no persist) — handy for the FE before applying. */
  async preview(): Promise<Result<CustomerAbcResult[], AppError>> {
    return safeCall(async () => {
      const revR = await this.repo.getAnnualRevenue();
      const rows = revR.ok ? revR.data : [];
      return this.computeAbc(rows);
    });
  }

  /** Convenience used by callers that already validated. */
  ok(): Result<void> {
    return Ok(undefined);
  }
}
