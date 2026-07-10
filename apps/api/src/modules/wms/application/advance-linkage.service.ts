/**
 * @module advance-linkage.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { Result } from '@common/result';
import { AdvanceLinkageRepository } from '../infrastructure/repositories/advance-linkage.repository';

type Row = Record<string, unknown>;

@Injectable()
export class AdvanceLinkageService {
  constructor(private readonly repo: AdvanceLinkageRepository) {}

  /**
   * Vision 10-warehouse #65 — yopilmagan (settlement_status <> 'settled') avanslar ro'yxati,
   * mol-qabul (mm_goods_receipts) bilan ta'minotchi+PO bo'yicha bog'langan. Ixtiyoriy
   * vendorId/purchaseOrderId filtri; faqat o'qish (transport controller'dan chaqiriladi).
   */
  getUnclosedAdvances(
    vendorId: number | null,
    purchaseOrderId: number | null,
    lim = 100,
  ): Promise<Result<Row[]>> {
    return this.repo.findUnclosedAdvances(vendorId, purchaseOrderId, lim);
  }
}
