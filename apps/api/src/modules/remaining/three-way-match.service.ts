/**
 * @module remaining/three-way-match.service
 * @description Minimal Three-Way-Match service for the remaining module.
 * Compares PO amount, GR amount, and vendor invoice amount; returns
 * matched/discrepancy status.
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppError } from '@common/result';

export interface IThreeWayMatchRepo {
  getResults(poId: number | null, limit: number): Promise<unknown>;
  getPurchaseOrderAmount(poId: number): Promise<Result<number, AppError>>;
  getGoodsReceiptAmount(grId: number): Promise<Result<number, AppError>>;
  insertResult(data: Record<string, unknown>): Promise<unknown>;
}

const TOLERANCE_PCT = 0.05;

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
    const paymentBlocked = variance > TOLERANCE_PCT;
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
