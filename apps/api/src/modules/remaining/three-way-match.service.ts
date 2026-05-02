import { Injectable, BadRequestException } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { ThreeWayMatchRepository } from './three-way-match.repository';

@Injectable()
export class ThreeWayMatchService {
  constructor(private readonly repo: ThreeWayMatchRepository) {}

  async getResults(poId: number | null, limit: number): Promise<Result<object, AppError>> {
    return safeCall(() => this.repo.getResults(poId, limit).then(data => ({ data })));
  }

  async perform(body: Record<string, unknown>, userId: number) {
    return safeCall(async () => {
      const { poId, grId, vendorInvoiceId } = body as { poId: number; grId: number; vendorInvoiceId: string };
      if (!poId || !grId || !vendorInvoiceId) {
        throw new BadRequestException('poId, grId, vendorInvoiceId talab qilinadi');
      }
      const [poAmountR, grAmountR] = await Promise.all([
        this.repo.getPurchaseOrderAmount(poId),
        this.repo.getGoodsReceiptAmount(grId),
      ]);
      const poAmount = poAmountR.ok ? (poAmountR.data as number) : 0;
      const grAmount = grAmountR.ok ? (grAmountR.data as number) : 0;
      const invoiceAmount = Number(body['invoiceAmount'] ?? 0);
      const tolerance = 0.05;
      const poGrDiff = Math.abs(poAmount - grAmount) / Math.max(poAmount, 1);
      const poInvDiff = Math.abs(poAmount - invoiceAmount) / Math.max(poAmount, 1);
      const status = (poGrDiff <= tolerance && poInvDiff <= tolerance) ? 'matched' : 'discrepancy';
      const paymentBlocked = status === 'discrepancy';
      await this.repo.insertResult(poId, grId, vendorInvoiceId, poAmount, grAmount, invoiceAmount, status, userId);
      return {
        success: !paymentBlocked, status, paymentBlocked,
        message: paymentBlocked ? "To'lov bloklandi: 3-Way Match mos kelmadi" : '3-Way Match muvaffaqiyatli',
        amounts: { po: poAmount, gr: grAmount, invoice: invoiceAmount },
      };
    });
  }
}
