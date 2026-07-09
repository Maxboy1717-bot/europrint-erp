/**
 * @module wms-counts.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Inject } from '@nestjs/common';
import { Ok, Err, Result, AppError, AppErr } from '@common/result';
import { WMS_COUNTS_REPO, type IWmsCountsRepo, type CountLineInput } from '../domain/repositories/i-wms-counts.repo';
import { InventoryFreezeService } from './inventory-freeze.service';

@Injectable()
export class WmsCountsService {
  constructor(
    @Inject(WMS_COUNTS_REPO) private readonly repo: IWmsCountsRepo,
    private readonly freeze: InventoryFreezeService,
  ) {}

  /**
   * Inventarizatsiya ro'yxati. blind=true bo'lganda (KO'R-SANOQ vizyoni) tizim-miqdori
   * (system_qty / total_book_value / total_variance) sanoqchidan YASHIRILADI — sanoqchi
   * ko'r-ko'rona sanaydi. blind=false → to'liq ko'rinish (tahlil/tasdiqlash).
   */
  async listInventoryCounts(
    warehouseId?: string,
    status?: string,
    lim = 20,
    blind = false,
  ): Promise<Result<object, AppError>> {
    const r = await this.repo.listInventoryCounts(warehouseId, status, lim);
    if (!r.ok) return Err(r.error);
    const rows = Array.isArray(r.data) ? r.data : [];
    if (!blind) return Ok(rows);
    // KO'R-SANOQ: tizim-miqdorini maskalash (sanoqchi ko'rmasligi kerak).
    const HIDDEN = ['system_qty', 'total_book_value', 'total_variance', 'total_variance_value', 'variance_items', 'total_counted_value'];
    const masked = rows.map((row) => {
      const copy: Record<string, unknown> = { ...row };
      for (const key of HIDDEN) {
        if (key in copy) copy[key] = null;
      }
      copy.blind_mode = true;
      return copy;
    });
    return Ok(masked);
  }

  async createInventoryCount(warehouseId: number, countedBy: number | null, notes: string | null) {
    return this.repo.createInventoryCount(warehouseId, countedBy, notes);
  }

  /** Batch 5 Item 10 — tafovutlar ro'yxati (inson tasdig'i uchun). */
  getCountVariances(countId: number) {
    return this.repo.getCountVariances(countId);
  }

  /**
   * Batch 5 Item 10 — inventarizatsiyani INSON tasdig'i bilan yopish. Egasi qarori: foiz-chegara
   * bo'yicha avto-tasdiq YO'Q — har bir tafovut aniqlanadi/belgilangan, lekin yopishdan oldin
   * inson tasdiqlaydi. approvedBy majburiy (jonli foydalanuvchi bo'lmasa — tasdiq yo'q).
   */
  async approveInventoryCount(countId: number, approvedBy: number | null): Promise<Result<object, AppError>> {
    if (approvedBy == null) {
      return Err(AppErr('FORBIDDEN', 'Tasdiqlash uchun jonli foydalanuvchi kerak (avto-tasdiq taqiq)'));
    }
    return this.repo.approveCount(countId, approvedBy);
  }

  /**
   * W3-COUNT — count-line yozish. system_qty ≠ counted_qty bo'lsa deviationReasonCode
   * MAJBURIY va katalogda (count_deviation_reasons) mavjud bo'lishi shart. Aks holda
   * BUSINESS_RULE_VIOLATION (saqlanmaydi).
   */
  async recordCountLine(input: CountLineInput): Promise<Result<object, AppError>> {
    const hasDeviation = input.systemQty !== input.countedQty;
    if (hasDeviation) {
      if (!input.deviationReasonCode) {
        return Err(AppErr('VALIDATION', 'Og\'ish (system ≠ counted) uchun deviation_reason_code majburiy'));
      }
      const valid = await this.freeze.validateDeviationReason(input.deviationReasonCode);
      if (!valid.ok) return Err(valid.error);
      if (!valid.data) {
        return Err(AppErr('VALIDATION', `Noma'lum og'ish sababi: ${input.deviationReasonCode}`));
      }
    }
    // Og'ish yo'q bo'lsa kod kiritilmaydi (toza moslik) — repo NULL yozadi.
    const normalized: CountLineInput = {
      ...input,
      deviationReasonCode: hasDeviation ? input.deviationReasonCode : null,
    };
    return this.repo.recordCountLine(normalized);
  }

  async listInternalRequests(status?: string, lim = 50) {
    return this.repo.listInternalRequests(status, lim);
  }

  async createInternalRequest(requestedBy: number | null, fromWarehouseId: number | null, toWarehouseId: number | null, materialId: number, quantity: number, notes: string | null) {
    return this.repo.createInternalRequest(requestedBy, fromWarehouseId, toWarehouseId, materialId, quantity, notes);
  }

  async updateInternalRequest(id: number, status: string | null, notes: string | null) {
    return this.repo.updateInternalRequest(id, status, notes);
  }

  async listBatches(materialId?: string, warehouseId?: string, expiring?: string) {
    return this.repo.listBatches(materialId, warehouseId, expiring);
  }

  async getProductionSupply(sessionId?: string) {
    return this.repo.getProductionSupply(sessionId);
  }
}
