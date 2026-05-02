import { safeNum } from '@common/math';
import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { WmsExtendedRepository } from './wms-extended.repository';

@Injectable()
export class WmsExtendedService {
  constructor(private readonly repo: WmsExtendedRepository) {}

  async getTotalStats(): Promise<Result<object, AppError>> {
    return this.repo.getTotalStats();
  }

  async getFifoCost(mid: number) {
    return safeCall(async () => {
      const batches = await this.repo.getFifoCostBatches(mid);
      const totalQty = (Array.isArray(batches) ? batches : []).reduce((s: number, b) => s + safeNum((b as Record<string, unknown>).quantity_on_hand ?? 0), 0);
      const totalVal = (Array.isArray(batches) ? batches : []).reduce((s: number, b) => s + safeNum((b as Record<string, unknown>).batch_value ?? 0), 0);
      return { material_id: mid, batches, total_quantity: totalQty, total_value: totalVal };
    });
  }

  async listTransactions(wid: number | null, mid: number | null, type: string | undefined, from: string | undefined, to: string | undefined, lim: number, off: number) {
    return this.repo.listTransactions(wid, mid, type, from, to, lim, off);
  }

  async createTransaction(body: Record<string, unknown>, userId: number | null) {
    return this.repo.createTransaction(body, userId);
  }

  async getAlerts(wid: number | null, type?: string) {
    return this.repo.getAlerts(wid, type);
  }

  async checkAlerts() {
    return safeCall(async () => {
      const itemsResult = await this.repo.getLowStockItems();
      if (!itemsResult.ok) throw new Error(itemsResult.error.message);
      const items = (itemsResult.data as Record<string, unknown>[]);
      const batchResult = await this.repo.batchInsertLowStockAlerts(
        (items ?? []).map((i) => ({
          material_id: safeNum(i['material_id']),
          warehouse_id: safeNum(i['warehouse_id']),
          material_name: String(i['material_name'] ?? ''),
        })),
      );
      if (!batchResult.ok) throw new Error(batchResult.error?.message ?? 'Low stock batch insert xatosi');
      return { alerts_checked: items.length, new_alerts: batchResult.data.inserted };
    });
  }

  async getReplenishmentSuggestions(wid: number | null) {
    return this.repo.getReplenishmentSuggestions(wid);
  }

  async getLowStock(wid: number | null) {
    return this.repo.getLowStock(wid);
  }

  async scanBarcode(barcode: string) {
    return safeCall(async () => {
      const result = await this.repo.scanBarcode(barcode);
      return result ?? { found: false, barcode };
    });
  }
}
