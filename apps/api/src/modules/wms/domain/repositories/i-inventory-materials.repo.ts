/**
 * @module i-inventory-materials.repo
 * @description Domain repository interface for WMS materials listing,
 *   per-material stock breakdowns, recent purchases/transactions, and CRUD.
 *   Concrete implementation lives at
 *   `infrastructure/repositories/inventory-materials.repository.ts`.
 * @layer Domain (WMS)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export interface IInventoryMaterialsRepo {
  listMaterials(
    search: string | undefined,
    category: string | undefined,
    limit: number,
    offset: number,
  ): Promise<Result<Row[]>>;
  countMaterials(search?: string): Promise<Result<number>>;
  getMaterial(id: number): Promise<Result<Row | null>>;
  getMaterialStock(id: number): Promise<Result<Row[]>>;
  getMaterialRecentPurchases(id: number): Promise<Result<Row[]>>;
  getMaterialRecentTransactions(id: number): Promise<Result<Row[]>>;
  updateMaterial(id: number, body: Row): Promise<Result<Row>>;
  deleteMaterial(id: number): Promise<Result<Row>>;
  getLowStockList(): Promise<Result<Row[]>>;
}

export const INVENTORY_MATERIALS_REPO = Symbol('INVENTORY_MATERIALS_REPO');
