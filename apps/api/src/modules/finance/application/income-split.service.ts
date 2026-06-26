/**
 * @module income-split.service
 * @description T18-C4 finance: incoming revenue (tushum) 4-fund auto-split.
 *
 * Vision (EP-FIN-004): every cash inflow is split across the 4 funds
 *   MAIN / TAX / HEAD / WORKING by configurable percentages, then posted to the
 *   canonical `entries` ledger via the ONE engine (GlPostingService.postJournal):
 *     Dr CASH (5010)                     +amount        ← money in
 *       Cr MAIN fund target (9010)         -amount*pMain
 *       Cr TAX fund target (6310)          -amount*pTax
 *       Cr HEAD fund target (8500)         -amount*pHead
 *       Cr WORKING fund target (5110)      -amount*pWork
 *
 * Percentages are owner-DATA (Q-40): read from the optional `income_split_config`
 * table when present, else fall back to INCOME_SPLIT_DEFAULT (graceful, non-fabricated
 * named default). Shares are renormalised to sum 1.0 so the journal always balances
 * (ΣDr == ΣCr) — an unbalanced split would be rejected by the GL engine.
 *
 * Result<T> throughout (Qoida 1); magic numbers named (Qoida 12).
 */

import { Injectable, Logger } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { safeCall, Result, Err, AppError } from '@common/result';
import { INCOME_SPLIT_DEFAULT } from '@common/constants/business.constants';
import { GL } from '../domain/constants/gl-accounts.constants';
import { GlPostingService, JournalLine } from '../domain/services/gl-posting.service';

export type FundKey = 'MAIN' | 'TAX' | 'HEAD' | 'WORKING';

/** Credit account each fund posts to (BHMS codes that exist in `accounts`). */
const FUND_CREDIT_ACCOUNT: Record<FundKey, { code: string; name: string }> = {
  MAIN:    { code: GL.REVENUE,           name: 'Asosiy fond (tushum)' },        // 9010
  TAX:     { code: GL.SALES_TAX_PAYABLE, name: 'Soliq zaxirasi (QQS)' },        // 6310
  HEAD:    { code: '8500',               name: 'Bosh fond (taqsimlanmagan foyda)' }, // 8500
  WORKING: { code: '5110',               name: 'Aylanma kapital (bank UZS)' },  // 5110
};

const FUND_ORDER: FundKey[] = ['MAIN', 'TAX', 'HEAD', 'WORKING'];

export interface IncomeSplitShare {
  fund: FundKey;
  share: number;   // 0..1 (renormalised, sums to 1.0)
  amount: number;  // rounded so'm, last fund absorbs rounding so Σ == total
  account: string; // credit account code
}

export interface IncomeSplitResult {
  total: number;
  shares: IncomeSplitShare[];
  source: 'config' | 'default';
}

@Injectable()
export class IncomeSplitService {
  private readonly logger = new Logger(IncomeSplitService.name);

  constructor(private readonly glPosting: GlPostingService) {}

  /**
   * Resolve the active split percentages: owner-config table when present & valid,
   * else the named code default. Always renormalised so Σ shares == 1.0.
   */
  async getActiveShares(): Promise<{ shares: Record<FundKey, number>; source: 'config' | 'default' }> {
    const fromConfig = await this.tryLoadConfig();
    if (fromConfig) return { shares: this.normalise(fromConfig), source: 'config' };
    return { shares: this.normalise({ ...INCOME_SPLIT_DEFAULT }), source: 'default' };
  }

  /**
   * Compute (no posting) how `total` would split across the 4 funds.
   * The final fund absorbs penny-rounding so Σ amounts === total exactly.
   */
  async computeSplit(total: number): Promise<Result<IncomeSplitResult, AppError>> {
    return safeCall(async () => {
      if (!(total > 0)) {
        // graceful: nothing to split — return empty shares rather than throwing
        const { source } = await this.getActiveShares();
        return { total: 0, shares: [], source };
      }
      const { shares, source } = await this.getActiveShares();
      const out: IncomeSplitShare[] = [];
      let allocated = 0;
      FUND_ORDER.forEach((fund, i) => {
        const isLast = i === FUND_ORDER.length - 1;
        const raw = total * shares[fund];
        const amount = isLast
          ? Math.round((total - allocated) * 100) / 100
          : Math.round(raw * 100) / 100;
        allocated += amount;
        out.push({ fund, share: shares[fund], amount, account: FUND_CREDIT_ACCOUNT[fund].code });
      });
      return { total, shares: out, source };
    });
  }

  /**
   * Auto-split an inflow and POST the balanced journal to `entries` via the ONE engine.
   * Idempotent on `reference` (GlPostingService dedupes by reference prefix).
   *
   * @param amount    gross inflow (so'm), must be > 0
   * @param reference business reference, e.g. `INC-<paymentId>` (idempotency key)
   */
  async splitAndPost(amount: number, reference: string): Promise<Result<{ entryId: number; split: IncomeSplitResult }, AppError>> {
    return safeCall(async () => {
      const splitR = await this.computeSplit(amount);
      if (!splitR.ok) throw new Error(splitR.error.message);
      const split = splitR.data;
      if (split.total <= 0 || split.shares.length === 0) {
        throw new Error(`Income split: amount must be > 0 (got ${amount})`);
      }

      // Dr CASH for the full amount; Cr each fund target for its share.
      const lines: JournalLine[] = [
        { accountCode: GL.CASH, accountName: 'Kassa (tushum)', debit: split.total, credit: 0 },
        ...split.shares.map((s) => ({
          accountCode: s.account,
          accountName: FUND_CREDIT_ACCOUNT[s.fund].name,
          debit: 0,
          credit: s.amount,
        })),
      ];

      const posted = await this.glPosting.postJournal(lines, reference);
      if (!posted.ok) {
        const msg = typeof posted.error === 'string' ? posted.error : posted.error.message;
        throw new Error(msg);
      }
      this.logger.log(`Income split posted: ref=${reference} total=${split.total} entry=${posted.data} (source=${split.source})`);
      return { entryId: posted.data, split };
    });
  }

  // -- helpers ---------------------------------------------------------------

  /** Renormalise any positive share map so the 4 values sum to exactly 1.0. */
  private normalise(raw: Record<string, number>): Record<FundKey, number> {
    const cleaned = {} as Record<FundKey, number>;
    let sum = 0;
    for (const fund of FUND_ORDER) {
      const v = Number(raw[fund]);
      cleaned[fund] = Number.isFinite(v) && v > 0 ? v : 0;
      sum += cleaned[fund];
    }
    if (sum <= 0) {
      // all-zero/invalid → fall back to the named default (already sums ~1.0)
      for (const fund of FUND_ORDER) cleaned[fund] = INCOME_SPLIT_DEFAULT[fund];
      sum = FUND_ORDER.reduce((s, f) => s + INCOME_SPLIT_DEFAULT[f], 0);
    }
    for (const fund of FUND_ORDER) cleaned[fund] = cleaned[fund] / sum;
    return cleaned;
  }

  /**
   * Try to load owner-configured shares from `income_split_config` if the table
   * exists. Absent table / no rows → null (caller uses the default). Never throws.
   */
  private async tryLoadConfig(): Promise<Record<FundKey, number> | null> {
    try {
      const res = await runQuery<{ fund_key: string; share: string }>(sql`
        SELECT fund_key, share
        FROM income_split_config
        WHERE is_active = true
      `);
      const rows = Array.isArray(res.rows) ? res.rows : [];
      if (rows.length === 0) return null;
      const map = {} as Record<FundKey, number>;
      for (const fund of FUND_ORDER) map[fund] = 0;
      let any = false;
      for (const r of rows) {
        const fund = String(r.fund_key).toUpperCase() as FundKey;
        if (FUND_ORDER.includes(fund)) {
          map[fund] = Number(r.share) || 0;
          any = true;
        }
      }
      return any ? map : null;
    } catch {
      // table missing (graceful) — owner hasn't configured a split yet
      return null;
    }
  }

  /** Unused-guard helper to keep Err import available for future strict paths. */
  _err(msg: string): Result<never, AppError> {
    return Err({ code: 'VALIDATION', message: msg });
  }
}
