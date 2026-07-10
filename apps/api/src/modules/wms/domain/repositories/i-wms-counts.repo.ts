/**
 * @module i-wms-counts.repo
 * @description Domain repository interface for WMS inventory counts,
 *   internal requests, stock batches, production supply.
 *   Concrete implementation lives at
 *   `infrastructure/repositories/wms-counts.repository.ts`.
 * @layer Domain (WMS)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export interface IWmsCountsRepo {
  listInventoryCounts(warehouseId?: string, status?: string, lim?: number): Promise<Result<Row[]>>;
  createInventoryCount(
    warehouseId: number,
    countedBy: number | null,
    notes: string | null,
  ): Promise<Result<Row>>;
  listInternalRequests(status?: string, lim?: number): Promise<Result<Row[]>>;
  createInternalRequest(
    requestedBy: number | null,
    fromWarehouseId: number | null,
    toWarehouseId: number | null,
    materialId: number,
    quantity: number,
    notes: string | null,
  ): Promise<Result<Row>>;
  updateInternalRequest(
    id: number,
    status: string | null,
    notes: string | null,
  ): Promise<Result<Row[]>>;
  listBatches(
    materialId?: string,
    warehouseId?: string,
    expiring?: string,
  ): Promise<Result<Row[]>>;
  getProductionSupply(sessionId?: string): Promise<Result<Row[]>>;
  /**
   * Vision 10-warehouse #12 — sanoq aniqlik% KPI: farqsiz pozitsiya / jami pozitsiya × 100.
   * Yakunlangan (completed/approved) inventarizatsiyalar bo'yicha agregatsiya; ixtiyoriy
   * warehouseId filtri. Mavjud `total_items`/`variance_items` ustunlaridan hisoblanadi
   * (yangi ustun YO'Q). Bitta agregat qator qaytadi.
   */
  getCountAccuracy(warehouseId?: string): Promise<Result<Row[]>>;
  /**
   * W3-COUNT — count-line yozish. system≠counted bo'lganda deviationReasonCode
   * MAJBURIY (validatsiya service'da). book/system miqdori va og'ish hisoblanadi.
   */
  recordCountLine(input: CountLineInput): Promise<Result<Row>>;
  /**
   * Batch 5 Item 10 — inventarizatsiya tafovutlari (variance != 0) ro'yxati; sabab-kodi
   * bo'lmagan tafovutlar `missing_reason=true` bilan belgilanadi (tasdiqdan oldin to'ldirilishi shart).
   */
  getCountVariances(countId: number): Promise<Result<Row[]>>;
  /**
   * Batch 5 Item 10 — inventarizatsiyani INSON tasdig'i bilan yopish (avto-tasdiq YO'Q, foiz-chegara YO'Q).
   * Har bir tafovutda sabab-kodi bo'lishi shart; approvedBy majburiy (jonli foydalanuvchi).
   * Muvaffaqiyatda status='approved', approved_by, approved_at yoziladi.
   */
  approveCount(countId: number, approvedBy: number): Promise<Result<Row>>;
}

export interface CountLineInput {
  countId: number;
  materialId: number;
  systemQty: number;
  countedQty: number;
  deviationReasonCode: string | null;
  notes: string | null;
  countedBy: number | null;
}

export const WMS_COUNTS_REPO = Symbol('WMS_COUNTS_REPO');
