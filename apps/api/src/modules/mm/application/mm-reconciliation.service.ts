/**
 * @module mm-reconciliation.service
 * @description Vendor "sverka akti" (reconciliation act) — on-demand + month-end digest.
 *   Vision 11-mm #33 formula: boshlang'ich + kirim - to'lov = qoldiq.
 *   NOTE (buildable-queue correction): gl_entries has NO vendor dimension
 *   (debit/credit_account_id only), so finance_invoices is the canonical AP ledger:
 *   invoiced = SUM(total_amount) [purchase], payments = SUM(paid_amount),
 *   opening = prior-period cumulative (total_amount - paid_amount),
 *   closing = opening + invoiced - payments. Goods received (kirim, our warehouse
 *   side) = SUM(mm_goods_receipts.total_value); the discrepancy flag surfaces when a
 *   vendor's invoiced amount != our received-goods value.
 * @layer Application (MM)
 */

import { Inject, Injectable } from '@nestjs/common';
import { Result, AppError, AppErr, Ok } from '@common/result';
import { TashkentTimeService } from '@common/time';
import {
  MM_RECONCILIATION_REPO,
  type IMmReconciliationRepo,
} from '../domain/repositories/i-mm-reconciliation.repo';

/**
 * Float-comparison epsilon. The vision requires flagging ANY money mismatch, so this
 * is NOT an owner policy threshold — it only suppresses sub-tiyin rounding noise.
 * Any |discrepancy| >= 0.01 UZS is reported as a discrepancy.
 */
export const RECONCILIATION_DISCREPANCY_EPSILON = 0.01;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface VendorReconciliationAct {
  vendorId: number;
  vendorName: string | null;
  fromDate: string;
  toDate: string;
  openingBalance: number;
  goodsReceived: number;
  invoiced: number;
  payments: number;
  closingBalance: number;
  discrepancy: number;
  hasDiscrepancy: boolean;
  generatedAt: string;
}

export interface DiscrepancyDigestItem {
  vendorId: number;
  vendorName: string | null;
  invoiced: number;
  goodsReceived: number;
  discrepancy: number;
}

export interface MonthDigest {
  fromDate: string;
  toDate: string;
  rows: DiscrepancyDigestItem[];
}

@Injectable()
export class MmReconciliationService {
  private readonly time = new TashkentTimeService();

  constructor(
    @Inject(MM_RECONCILIATION_REPO) private readonly repo: IMmReconciliationRepo,
  ) {}

  async getReconciliation(
    vendorId: number,
    from?: string,
    to?: string,
  ): Promise<Result<VendorReconciliationAct, AppError>> {
    if (!Number.isInteger(vendorId) || vendorId <= 0) {
      return { ok: false, error: AppErr('VALIDATION', 'vendorId musbat butun son bo\'lishi kerak') };
    }
    const period = this._resolvePeriod(from, to);
    if (!period.ok) return { ok: false, error: period.error };
    const { from: f, to: t } = period.data;

    const rowRes = await this.repo.getVendorReconciliation(vendorId, f, t);
    if (!rowRes.ok) return { ok: false, error: rowRes.error };
    const row = rowRes.data;

    const opening = Number(row?.opening ?? 0);
    const invoiced = Number(row?.invoiced ?? 0);
    const payments = Number(row?.payments ?? 0);
    const receipts = Number(row?.receipts ?? 0);
    const closing = opening + invoiced - payments;
    const discrepancy = Math.round((invoiced - receipts) * 100) / 100;

    return Ok({
      vendorId,
      vendorName: (row?.vendor_name ?? null) as string | null,
      fromDate: f,
      toDate: t,
      openingBalance: opening,
      goodsReceived: receipts,
      invoiced,
      payments,
      closingBalance: closing,
      discrepancy,
      hasDiscrepancy: Math.abs(discrepancy) >= RECONCILIATION_DISCREPANCY_EPSILON,
      generatedAt: this.time.now().toISOString(),
    });
  }

  async getMonthDigest(from?: string, to?: string): Promise<Result<MonthDigest, AppError>> {
    const period = this._resolvePeriod(from, to);
    if (!period.ok) return { ok: false, error: period.error };
    const { from: f, to: t } = period.data;

    const res = await this.repo.getDiscrepancyDigest(f, t, RECONCILIATION_DISCREPANCY_EPSILON);
    if (!res.ok) return { ok: false, error: res.error };

    const rows: DiscrepancyDigestItem[] = (Array.isArray(res.data) ? res.data : []).map((r) => ({
      vendorId: Number(r.vendor_id),
      vendorName: (r.vendor_name ?? null) as string | null,
      invoiced: Number(r.invoiced),
      goodsReceived: Number(r.receipts),
      discrepancy: Number(r.discrepancy),
    }));
    return Ok({ fromDate: f, toDate: t, rows });
  }

  /** Defaults: from = 1st of current month, to = today (Asia/Tashkent). Validates YYYY-MM-DD. */
  private _resolvePeriod(from?: string, to?: string): Result<{ from: string; to: string }, AppError> {
    const now = this.time.now();
    const f = from ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const t = to ?? this.time.formatDate(now);
    if (!DATE_RE.test(f) || !DATE_RE.test(t)) {
      return { ok: false, error: AppErr('VALIDATION', 'Sana formati YYYY-MM-DD bo\'lishi kerak') };
    }
    if (f > t) {
      return { ok: false, error: AppErr('VALIDATION', 'from sanasi to sanasidan keyin bo\'lmasligi kerak') };
    }
    return Ok({ from: f, to: t });
  }
}
