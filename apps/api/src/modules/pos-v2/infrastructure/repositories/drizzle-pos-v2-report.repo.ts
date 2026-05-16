/**
 * @module drizzle-pos-v2-report.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { safeNum } from '@common/math';
import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { and, eq, gte, lte, sql, or } from 'drizzle-orm';
import { db, stock_items, transfer_requests as transferRequests } from '@shared/db';
import { inventory_counts as inventoryCounts, inventory_count_lines as inventoryCountLines } from '@shared/db/schema-pos-ext';
import { Result, Ok as ok, Err as err } from '@common/result';
import { StockItemBarcode, MovementSummary, EmployeeActivity } from '../../domain/repositories/i-pos-v2.repo';
import { InventoryCount, CountStatus, CountLine } from '../../domain/aggregates/inventory-count.aggregate';
import { TransferRequest, RequestStatus, RequestLine } from '../../domain/aggregates/transfer-request.aggregate';

@Injectable()
export class DrizzlePosV2ReportRepo {
  private readonly logger = new Logger(DrizzlePosV2ReportRepo.name);

  mapToCountLine(data: Record<string, unknown>): CountLine {
    return {
      id: String(data.id ?? ''), countId: String(data.countId ?? ''), stockItemId: String(data.stockItemId ?? ''),
      sku: String(data.sku ?? ''), itemName: String(data.itemName ?? ''),
      systemQuantity: safeNum(data.systemQuantity ?? 0),
      countedQuantity: safeNum(data.countedQuantity ?? 0),
      variance: safeNum(data.variance ?? 0),
      unit: String(data.unit ?? 'pcs'), location: data.location != null ? String(data.location) : null, notes: data.notes != null ? String(data.notes) : null,
    };
  }

  mapToRequestLine(data: Record<string, unknown>): RequestLine {
    return {
      id: String(data.id ?? ''), requestId: String(data.requestId ?? ''), stockItemId: String(data.stockItemId ?? ''),
      itemName: String(data.itemName ?? ''), sku: String(data.sku ?? ''),
      requestedQty: safeNum(data.requestedQty ?? 0),
      approvedQty: data.approvedQty != null ? safeNum(data.approvedQty) : null,
      unit: String(data.unit ?? 'pcs'),
    };
  }

  mapToInventoryCount(data: Record<string, unknown>): InventoryCount {
    return new InventoryCount(String(data.id ?? ''), String(data.warehouseId ?? ''), String(data.countNumber ?? ''), data.status as CountStatus, Array.isArray(data.lines) ? (data.lines as Record<string, unknown>[]).map(l => this.mapToCountLine(l)) : [], String(data.startedBy ?? ''), data.approvedBy != null ? String(data.approvedBy) : null, data.approvedAt instanceof Date ? data.approvedAt : data.approvedAt != null ? new Date(String(data.approvedAt)) : null, data.notes != null ? String(data.notes) : null, data.createdAt instanceof Date ? data.createdAt : data.createdAt != null ? new Date(String(data.createdAt)) : _time.now(), data.updatedAt instanceof Date ? data.updatedAt : data.updatedAt != null ? new Date(String(data.updatedAt)) : _time.now());
  }

  mapToTransferRequest(data: Record<string, unknown>): TransferRequest {
    return new TransferRequest(String(data.id ?? ''), String(data.requestNumber ?? ''), String(data.fromWarehouseId ?? ''), String(data.toWarehouseId ?? ''), data.status as RequestStatus, Array.isArray(data.lines) ? (data.lines as Record<string, unknown>[]).map(l => this.mapToRequestLine(l)) : [], String(data.requestedBy ?? ''), data.approvedBy != null ? String(data.approvedBy) : null, data.approvedAt instanceof Date ? data.approvedAt : data.approvedAt != null ? new Date(String(data.approvedAt)) : null, String(data.reason ?? ''), data.createdAt instanceof Date ? data.createdAt : data.createdAt != null ? new Date(String(data.createdAt)) : _time.now(), data.updatedAt instanceof Date ? data.updatedAt : data.updatedAt != null ? new Date(String(data.updatedAt)) : _time.now());
  }

  async findByBarcode(barcode: string): Promise<Result<StockItemBarcode | null>> {
    try {
      const [stockItem] = await db.select().from(stock_items).where(or(eq(stock_items.sku, barcode), sql`lot_number = ${barcode}`)).limit(1);
      if (!stockItem) return ok(null);
      const item = stockItem as Record<string, unknown>;
      return ok({ id: String(item.id ?? ''), sku: String(item.sku ?? ''), name: String(item.name ?? ''), currentQuantity: safeNum(item.currentQuantity || '0'), unit: String(item.unit ?? ''), warehouseLocation: item.warehouseLocation != null ? String(item.warehouseLocation) : null, expiryDate: item.expiryDate instanceof Date ? item.expiryDate : item.expiryDate != null ? new Date(String(item.expiryDate)) : null });
    } catch (error: unknown) {
      this.logger.error(`Failed to lookup barcode ${barcode}:`, error);
      return err({ message: 'Database error', code: 'DB_ERROR' });
    }
  }

  async getMovementReport(warehouseId: string, from: Date, to: Date): Promise<Result<MovementSummary>> {
    try {
      const countCompletedResult = await db.select({ count: sql<number>`count(*)` }).from(inventoryCounts).where(and(eq(inventoryCounts.warehouseId, warehouseId), eq(inventoryCounts.status, CountStatus.COMPLETED), gte(inventoryCounts.createdAt, from), lte(inventoryCounts.createdAt, to)));
      const transfersCompletedResult = await db.select({ count: sql<number>`count(*)` }).from(transferRequests).where(and(eq(transferRequests.status, RequestStatus.COMPLETED), gte(transferRequests.createdAt, from), lte(transferRequests.createdAt, to)));
      const varianceResult = await db.select({ total: sql<number>`sum(abs(cast(variance as numeric)))` }).from(inventoryCountLines).where(and(eq(inventoryCounts.warehouseId, warehouseId), gte(inventoryCounts.createdAt, from), lte(inventoryCounts.createdAt, to)));
      const itemsResult = await db.select({ count: sql<number>`count(*)` }).from(inventoryCountLines);
      return ok({ warehouseId, date: _time.now(), countCompleted: countCompletedResult[0]?.count || 0, transfersCompleted: transfersCompletedResult[0]?.count || 0, totalVariance: varianceResult[0]?.total || 0, totalItems: itemsResult[0]?.count || 0 });
    } catch (error: unknown) {
      this.logger.error(`Failed to get movement report for ${warehouseId}:`, error);
      return err({ message: 'Database error', code: 'DB_ERROR' });
    }
  }

  async getEmployeeActivity(userId: string, from: Date, to: Date): Promise<Result<EmployeeActivity>> {
    try {
      const countsStartedResult = await db.select({ count: sql<number>`count(*)` }).from(inventoryCounts).where(and(eq(inventoryCounts.startedBy, userId), gte(inventoryCounts.createdAt, from), lte(inventoryCounts.createdAt, to)));
      const countsCompletedResult = await db.select({ count: sql<number>`count(*)` }).from(inventoryCounts).where(and(eq(inventoryCounts.status, CountStatus.COMPLETED), gte(inventoryCounts.createdAt, from), lte(inventoryCounts.createdAt, to)));
      const transfersCreatedResult = await db.select({ count: sql<number>`count(*)` }).from(transferRequests).where(and(eq(transferRequests.requestedBy, userId), gte(transferRequests.createdAt, from), lte(transferRequests.createdAt, to)));
      const transfersApprovedResult = await db.select({ count: sql<number>`count(*)` }).from(transferRequests).where(and(eq(transferRequests.approvedBy, userId), gte(transferRequests.approvedAt, from), lte(transferRequests.approvedAt, to)));
      return ok({ userId, name: userId, totalCountsStarted: countsStartedResult[0]?.count || 0, totalCountsCompleted: countsCompletedResult[0]?.count || 0, totalTransfersCreated: transfersCreatedResult[0]?.count || 0, totalTransfersApproved: transfersApprovedResult[0]?.count || 0 });
    } catch (error: unknown) {
      this.logger.error(`Failed to get employee activity for ${userId}:`, error);
      return err({ message: 'Database error', code: 'DB_ERROR' });
    }
  }

  async getLowStockReport(warehouseId?: string): Promise<Result<Array<{ stockItemId: string; name: string; sku: string; currentQty: number; minQty: number; location: string | null }>>> {
    try {
      const conditions = [];
      if (warehouseId) conditions.push(sql`warehouse_id = ${warehouseId}`);
      const lowStockItems = await db.select().from(stock_items).where(conditions.length > 0 ? and(...conditions, sql`cast(quantity as numeric) <= coalesce(min_quantity, 0)`) : sql`cast(${stock_items.quantity} as numeric) <= 10`);
      return ok((Array.isArray(lowStockItems) ? lowStockItems : []).map((item: Record<string, unknown>) => ({ stockItemId: String(item.id ?? ''), name: String(item.name ?? ''), sku: String(item.sku ?? ''), currentQty: safeNum(item['quantity'] ?? '0'), minQty: 0, location: item.warehouseLocation != null ? String(item.warehouseLocation) : null })));
    } catch (error: unknown) {
      this.logger.error('Failed to get low stock report:', error);
      return err({ message: 'Database error', code: 'DB_ERROR' });
    }
  }
}
