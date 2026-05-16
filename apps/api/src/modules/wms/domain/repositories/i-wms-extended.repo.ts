/**
 * @module i-wms-extended.repo
 * @description Domain repository interface for WMS extended ops
 *   (totals, FIFO costing, transactions, alerts, low stock,
 *   replenishment, barcode scan).
 *   Concrete implementation lives at
 *   `infrastructure/repositories/wms-extended.repository.ts`.
 * @layer Domain (WMS)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export interface IWmsExtendedRepo {
  getTotalStats(): Promise<Result<Row>>;
  getFifoCostBatches(mid: number): Promise<Result<Row[]>>;
  listTransactions(
    wid: number | null,
    mid: number | null,
    type: string | undefined,
    from: string | undefined,
    to: string | undefined,
    lim: number,
    off: number,
  ): Promise<Result<Row[]>>;
  createTransaction(body: Row, userId: number | null): Promise<Result<Row>>;
  getAlerts(wid: number | null, type?: string): Promise<Result<Row[]>>;
  getLowStockItems(): Promise<Result<unknown[]>>;
  findExistingLowStockAlert(materialId: number, warehouseId: number): Promise<Result<boolean>>;
  createLowStockAlert(
    materialId: number,
    warehouseId: number,
    materialName: string,
  ): Promise<Result<void>>;
  batchInsertLowStockAlerts(
    items: ReadonlyArray<{ material_id: number; warehouse_id: number; material_name: string }>,
  ): Promise<Result<{ inserted: number }>>;
  getReplenishmentSuggestions(wid: number | null): Promise<Result<Row[]>>;
  getLowStock(wid: number | null): Promise<Result<Row[]>>;
  scanBarcode(barcode: string): Promise<Result<Row | null>>;
}

export const WMS_EXTENDED_REPO = Symbol('WMS_EXTENDED_REPO');
