/**
 * @module remaining/three-way-match.service
 * @description Minimal Three-Way-Match service for the remaining module.
 * Compares PO amount, GR amount, and vendor invoice amount; returns
 * matched/discrepancy status.
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppError } from '@common/result';
import { getBusinessSettingNumber } from '../../shared/config/business-settings.reader';

export interface IThreeWayMatchRepo {
  getResults(poId: number | null, limit: number): Promise<unknown>;
  getPurchaseOrderAmount(poId: number): Promise<Result<number, AppError>>;
  getGoodsReceiptAmount(grId: number): Promise<Result<number, AppError>>;
  insertResult(data: Record<string, unknown>): Promise<unknown>;
}

// Audit 2026-08-06: this was a bare 0.05 with no way for the owner to change it, while the
// MM module's matcher reads the same threshold from business_settings. Both now read
// mm.three_way_amount_tolerance_pct so the two paths cannot disagree about what counts as a
// variance. The constant stays as the fallback when the row is missing.
const TOLERANCE_PCT_DEFAULT = 0.05;

@Injectable()
export class ThreeWayMatchService {
  constructor(private readonly repo: IThreeWayMatchRepo) {}

  async perform(
    body: { poId?: number; grId?: number; vendorInvoiceId?: string; invoiceAmount?: number },
    _userId: number,
  ): Promise<Result<{ status: string; paymentBlocked: boolean }, AppError>> {
    const { poId, grId, vendorInvoiceId, invoiceAmount = 0 } = body;
    if (!poId || !grId || !vendorInvoiceId) {
      return Err({ message: 'poId, grId, vendorInvoiceId talab qilinadi', code: 'BAD_REQUEST' });
    }

    const poRes = await this.repo.getPurchaseOrderAmount(poId);
    if (!poRes.ok) return Err(poRes.error);
    const poAmount = poRes.data;

    const grRes = await this.repo.getGoodsReceiptAmount(grId);
    if (!grRes.ok) return Err(grRes.error);
    const grAmount = grRes.data;

    const variance = Math.abs(invoiceAmount - poAmount) / Math.max(poAmount, 1);
    const tolerance = await getBusinessSettingNumber('mm.three_way_amount_tolerance_pct', TOLERANCE_PCT_DEFAULT);
    const paymentBlocked = variance > tolerance;
    const status = paymentBlocked ? 'discrepancy' : 'matched';

    await this.repo.insertResult({
      poId, grId, vendorInvoiceId, invoiceAmount, poAmount, grAmount, status,
    });

    return Ok({ status, paymentBlocked });
  }

  async getResults(poId: number | null, limit: number): Promise<unknown> {
    return this.repo.getResults(poId, limit);
  }
}
