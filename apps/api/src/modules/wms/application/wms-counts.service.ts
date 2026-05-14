/**
 * @module wms-counts.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { WmsCountsRepository } from './wms-counts.repository';

@Injectable()
export class WmsCountsService {
  constructor(private readonly repo: WmsCountsRepository) {}

  async listInventoryCounts(warehouseId?: string, status?: string, lim = 20): Promise<Result<object, AppError>> {
    return this.repo.listInventoryCounts(warehouseId, status, lim);
  }

  async createInventoryCount(warehouseId: number, countedBy: number | null, notes: string | null) {
    return this.repo.createInventoryCount(warehouseId, countedBy, notes);
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
