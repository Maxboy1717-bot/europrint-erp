/**
 * @module inventory-advanced.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Result, AppError, safeCall } from '@common/result';
import { InventoryAdvancedRepository } from '../infrastructure/inventory-advanced.repo';

@Injectable()
export class InventoryAdvancedService {
  private readonly logger = new Logger(InventoryAdvancedService.name);

  constructor(private readonly repo: InventoryAdvancedRepository) {}

  async getAnalytics(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const r = await this.repo.getAnalytics();
      if (!r.ok) {
        this.logger.error('getAnalytics failed', r.error);
        return { totalCounts: 0, inProgress: 0, completed: 0, totalItemsCounted: 0, totalVarianceItems: 0, totalVarianceValue: 0 };
      }
      const d = r.data;
      return {
        totalCounts:        Number(d['total_counts'])          || 0,
        inProgress:         Number(d['in_progress'])           || 0,
        completed:          Number(d['completed'])             || 0,
        totalItemsCounted:  Number(d['total_items_counted'])   || 0,
        totalVarianceItems: Number(d['total_variance_items'])  || 0,
        totalVarianceValue: Number(d['total_variance_value'])  || 0,
      };
    });
  }

  async getCounts(status: string | undefined, warehouseId: string | undefined, limit: number, offset: number) {
    const r = await this.repo.findCounts(status, warehouseId, limit, offset);
    if (!r.ok) { this.logger.error('getCounts failed', r.error); return { items: [], total: 0 }; }
    return { items: r.data, total: r.data.length };
  }

  async getBarcodeAssignments(limit: number, offset: number) {
    const r = await this.repo.getBarcodeAssignments(limit, offset);
    if (!r.ok) { this.logger.error('getBarcodeAssignments failed', r.error); return { items: [], total: 0 }; }
    return { items: r.data, total: r.data.length };
  }
}
