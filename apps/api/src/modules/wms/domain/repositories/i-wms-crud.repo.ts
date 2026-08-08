/**
 * @module i-wms-crud.repo
 * @description Domain repository interface for WMS CRUD (soft-delete +
 *   patch) ops across transactions, goods issues, inventory, rentals,
 *   stock, inventory counts, warehouses.
 *   Concrete implementation lives at
 *   `infrastructure/repositories/wms-crud.repository.ts`.
 * @layer Domain (WMS)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export interface IWmsCrudRepo {
  softDeleteTransaction(id: number, userId: number | null): Promise<Result<Row>>;
  patchTransaction(id: number, body: Row): Promise<Result<Row>>;
  softDeleteGoodsIssue(id: number, userId: number | null): Promise<Result<Row>>;
  patchGoodsIssue(id: number, body: Row): Promise<Result<Row>>;
  softDeleteInventory(id: number, userId: number | null): Promise<Result<Row>>;
  patchInventory(id: number, body: Row): Promise<Result<Row>>;
  softDeleteRentalRecord(id: number, userId: number | null): Promise<Result<Row>>;
  patchRentalRecord(id: number, body: Row): Promise<Result<Row>>;
  softDeleteStock(id: number, userId: number | null): Promise<Result<Row>>;
  patchStock(id: number, body: Row): Promise<Result<Row>>;
  softDeleteInventoryCount(id: number, userId: number | null): Promise<Result<Row>>;
  softDeleteWarehouse(id: string | number, userId: number | null): Promise<Result<Row>>;
  getStockById(id: number): Promise<Result<Row | null>>;
  listGoodsIssues(limit: number, offset: number): Promise<Result<Row[]>>;
  getGoodsIssueById(id: number): Promise<Result<Row>>;
}

export const WMS_CRUD_REPO = Symbol('WMS_CRUD_REPO');
