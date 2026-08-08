/**
 * @module inventory-materials.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Inject, Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { INVENTORY_MATERIALS_REPO, type IInventoryMaterialsRepo } from '../domain/repositories/i-inventory-materials.repo';

@Injectable()
export class InventoryMaterialsService {
  constructor(@Inject(INVENTORY_MATERIALS_REPO) private readonly repo: IInventoryMaterialsRepo) {}

  async listMaterials(search?: string, category?: string, page = 1, limit = 50): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const offset = (page - 1) * limit;
      // Unwrap the repo Results — items/total must be the array + number, not the
      // Result wrappers (the controller returns this object straight to the client).
      const [itemsR, totalR] = await Promise.all([
        this.repo.listMaterials(search, category, limit, offset),
        this.repo.countMaterials(search),
      ]);
      const items = itemsR.ok && Array.isArray(itemsR.data) ? itemsR.data : [];
      const total = totalR.ok ? totalR.data : 0;
      return { items, total, page, limit };
    });
  }

  async getMaterial360Card(id: number) {
    return safeCall(async () => {
      const [material, stock, recent_purchases, recent_transactions] = await Promise.all([
        this.repo.getMaterial(id),
        this.repo.getMaterialStock(id),
        this.repo.getMaterialRecentPurchases(id),
        this.repo.getMaterialRecentTransactions(id),
      ]);
      return { material, stock, recent_purchases, recent_transactions };
    });
  }

  async createMaterial(body: Record<string, unknown>) {
    return this.repo.createMaterial(body);
  }

  async updateMaterial(id: number, body: Record<string, unknown>) {
    return this.repo.updateMaterial(id, body);
  }

  async deleteMaterial(id: number) {
    return safeCall(async () => {
      const row = await this.repo.deleteMaterial(id);
      return { success: true, id: row.ok ? (row.data as Record<string, unknown>)?.id : null };
    });
  }

  async getLowStockList() {
    return this.repo.getLowStockList();
  }
}
