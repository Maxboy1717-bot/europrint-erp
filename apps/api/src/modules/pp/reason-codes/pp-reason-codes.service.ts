/**
 * @module pp-reason-codes.service
 * @description Thin application service for the PP reason-code catalog. Delegates every
 *   operation to the repository (Rule 15 — no db.* here). Kept deliberately small: the
 *   catalog has no business arithmetic, only master-data persistence.
 */

import { Inject, Injectable } from '@nestjs/common';
import { Ok, Err, type Result } from '@common/result';
import {
  PP_REASON_CODES_REPO,
  type IPpReasonCodesRepo,
  type PpReasonCodeRow,
  type ReasonCodeCountRow,
  type CreatePpReasonCodeInput,
  type UpdatePpReasonCodeInput,
} from './i-pp-reason-codes.repo';

/** One ranked row of the monthly reason-code Pareto report (EP-PP-136). */
export interface ParetoReportItem extends ReasonCodeCountRow {
  /** This code's share of the month's total occurrences, 0-100 (2 dp). */
  percentage: number;
  /** Running cumulative share through this (descending-ranked) row, 0-100 (2 dp). */
  cumulativePercentage: number;
  /** True for the minimal leading set whose cumulative share first reaches 80% (the "vital few"). */
  vitalFew: boolean;
}

/** Monthly reason-code Pareto report envelope. */
export interface ParetoReport {
  /** Reporting month, 'YYYY-MM'. */
  month: string;
  /** Total flagged orders in the month (sum of all occurrences). */
  totalOccurrences: number;
  /** Number of distinct reason codes seen in the month. */
  distinctReasonCodes: number;
  /** Codes ranked most-frequent first, each with share + cumulative share. */
  items: ParetoReportItem[];
}

@Injectable()
export class PpReasonCodesService {
  constructor(
    @Inject(PP_REASON_CODES_REPO) private readonly repo: IPpReasonCodesRepo,
  ) {}

  /** Active codes, ordered by sort_order then id. */
  findActive(): Promise<Result<PpReasonCodeRow[]>> {
    return this.repo.findActive();
  }

  /** All codes incl. inactive — for the management/settings screen (Batch 5 Item 5). */
  findAll(): Promise<Result<PpReasonCodeRow[]>> {
    return this.repo.findAll();
  }

  /** Create a new reason code. */
  create(dto: CreatePpReasonCodeInput): Promise<Result<PpReasonCodeRow>> {
    return this.repo.create(dto);
  }

  /** Partial update (incl. deactivate via is_active=false). Ok(null) if id not found. */
  update(id: number, patch: UpdatePpReasonCodeInput): Promise<Result<PpReasonCodeRow | null>> {
    return this.repo.update(id, patch);
  }

  /**
   * EP-PP-136 (vision 07-pp#142): monthly reason-code Pareto report. Aggregates the
   * reason flags applied within the given 'YYYY-MM' month, then computes each code's
   * share and running cumulative share, marking the "vital few" (the minimal leading set
   * whose cumulative share first reaches 80%). Empty months return an honest zeroed
   * report (totalOccurrences 0, items []). `month` is pre-validated 'YYYY-MM' by the caller.
   */
  async monthlyPareto(month: string): Promise<Result<ParetoReport>> {
    const year = Number(month.slice(0, 4));
    const mon = Number(month.slice(5, 7));
    const startInclusive = `${month}-01`;
    const endExclusive =
      mon === 12 ? `${year + 1}-01-01` : `${year}-${String(mon + 1).padStart(2, '0')}-01`;

    const res = await this.repo.reasonCodePareto(startInclusive, endExclusive);
    if (!res.ok) return Err(res.error);

    const counts = res.data;
    const total = counts.reduce((s, r) => s + r.occurrences, 0);
    let running = 0;
    let crossed = false;
    const items: ParetoReportItem[] = counts.map((r) => {
      running += r.occurrences;
      const percentage = total > 0 ? Math.round((r.occurrences / total) * 10000) / 100 : 0;
      const cumulativePercentage = total > 0 ? Math.round((running / total) * 10000) / 100 : 0;
      const vitalFew = !crossed;
      if (cumulativePercentage >= 80) crossed = true;
      return { ...r, percentage, cumulativePercentage, vitalFew };
    });

    return Ok({
      month,
      totalOccurrences: total,
      distinctReasonCodes: counts.length,
      items,
    });
  }
}
