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
}

export const WMS_COUNTS_REPO = Symbol('WMS_COUNTS_REPO');
