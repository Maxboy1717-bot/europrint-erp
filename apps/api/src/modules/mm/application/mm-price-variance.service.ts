/**
 * @module mm-price-variance.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Inject, Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppError } from '@common/result';
import { MM_REPO, type IMmRepository } from '../domain/repositories/mm.repository';
import { PO_PRICE_VARIANCE_YELLOW_PCT, PO_PRICE_VARIANCE_RED_PCT } from '@common/constants/business.constants';

export type PriceVarianceFlag = 'none' | 'yellow' | 'red';

export interface PriceVarianceResult {
  materialId: number;
  unitPrice: number;
  referencePrice: number | null;
  referenceSource: 'price_list' | 'last_po' | 'none';
  variancePct: number | null;
  flag: PriceVarianceFlag;
}

@Injectable()
export class MmPriceVarianceService {
  constructor(@Inject(MM_REPO) private readonly repo: IMmRepository) {}

  /**
   * §11-MM #23 — Narx ogohlantirish (price warning). Taklif qilingan PO satr unitPrice ni
   * material reference narxi bilan solishtiradi: supplier price-list bo'lsa shundan, aks
   * holda oxirgi PO satr narxidan. Natija — HISOBLANGAN flag, saqlanmaydi:
   *   variance > RED%    → 'red'    (qizil)
   *   variance ≥ YELLOW% → 'yellow' (sariq)
   *   aks holda          → 'none'
   * Faqat yuqoriga og'ish (over-pay) flag qilinadi; arzonroq narx hech qachon ogohlantirmaydi.
   * Reference yo'q bo'lsa (yangi material, bo'sh price-list) flag 'none' (graceful, soxta emas).
   */
  async checkPriceVariance(
    materialId: number,
    unitPrice: number,
  ): Promise<Result<PriceVarianceResult, AppError>> {
    const refResult = await this.repo.getMaterialReferencePrice(materialId);
    if (!refResult.ok) return Err(refResult.error);

    const ref = refResult.data;
    if (!ref || ref.price <= 0) {
      return Ok({
        materialId,
        unitPrice,
        referencePrice: ref ? ref.price : null,
        referenceSource: 'none',
        variancePct: null,
        flag: 'none',
      });
    }

    const rawPct = ((unitPrice - ref.price) / ref.price) * 100;
    const variancePct = Math.round(rawPct * 100) / 100;
    let flag: PriceVarianceFlag = 'none';
    if (rawPct > PO_PRICE_VARIANCE_RED_PCT) flag = 'red';
    else if (rawPct >= PO_PRICE_VARIANCE_YELLOW_PCT) flag = 'yellow';

    return Ok({
      materialId,
      unitPrice,
      referencePrice: ref.price,
      referenceSource: ref.source,
      variancePct,
      flag,
    });
  }
}
