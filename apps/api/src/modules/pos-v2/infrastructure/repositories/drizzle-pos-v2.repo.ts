/**
 * @module drizzle-pos-v2.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { safeNum } from '@common/math';
import { Injectable, Logger } from '@nestjs/common';
import { and, eq, desc, sql, inArray } from 'drizzle-orm';
import { db } from '@shared/db';
import { stock_items } from '@shared/db';
import { inventory_counts as inventoryCounts, inventory_count_lines as inventoryCountLines } from '@shared/db/schema-pos-ext';
import { Result, Ok as ok, Err as err } from '@common/result';
import { IPosV2Repo, StockItemBarcode, MovementSummary, EmployeeActivity } from '../../domain/repositories/i-pos-v2.repo';
import { InventoryCount, CountStatus, CountLine } from '../../domain/aggregates/inventory-count.aggregate';
import { TransferRequest, RequestStatus, RequestLine } from '../../domain/aggregates/transfer-request.aggregate';
import { DrizzlePosV2RequestRepo } from './drizzle-pos-v2-request.repo';
import { DrizzlePosV2ReportRepo } from './drizzle-pos-v2-report.repo';

@Injectable()
export class DrizzlePosV2Repo implements IPosV2Repo {
  private readonly logger = new Logger(DrizzlePosV2Repo.name);

  constructor(
    private readonly requestRepo: DrizzlePosV2RequestRepo,
    private readonly reportRepo: DrizzlePosV2ReportRepo,
  ) {}

  private mapToInventoryCount(data: Record<string, unknown>): InventoryCount {
    return this.reportRepo.mapToInventoryCount(data);
  }

  private mapToCountLine(data: Record<string, unknown>): CountLine {
    return this.reportRepo.mapToCountLine(data);
  }

  async findCountById(countId: string): Promise<Result<InventoryCount>> {
    try {
      const [countRow] = await db.select().from(inventoryCounts).where(eq(inventoryCounts.id, countId)).limit(1);
      if (!countRow) return err({ message: 'Inventory count not found', code: 'NOT_FOUND' });
      const countLines = await db.select().from(inventoryCountLines).where(eq(inventoryCountLines.countId, countId));
      return ok(this.mapToInventoryCount({ ...(countRow as Record<string, unknown>), lines: countLines }));
    } catch (error: unknown) {
      this.logger.error(`Failed to find count ${countId}:`, error);
      return err({ message: 'Database error', code: 'DB_ERROR' });
    }
  }

  async findCounts(filter: { warehouseId?: string; status?: CountStatus; page?: number; limit?: number }): Promise<Result<{ data: InventoryCount[]; total: number; page: number; limit: number }>> {
    try {
      const page = filter.page || 1;
      const limit = filter.limit || 20;
      const offset = (page - 1) * limit;
      const conditions = [];
      if (filter.warehouseId) conditions.push(eq(inventoryCounts.warehouseId, filter.warehouseId));
      if (filter.status) conditions.push(eq(inventoryCounts.status, filter.status));
      const countsRows = await db.select().from(inventoryCounts).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(desc(inventoryCounts.createdAt)).limit(limit).offset(offset);
      const countResult = await db.select({ count: sql<number>`count(*)` }).from(inventoryCounts).where(conditions.length > 0 ? and(...conditions) : undefined);
      // ── Fix N+1: fetch all lines for the paginated counts in a single query, then group in-memory ──
      const safeCountsRows = Array.isArray(countsRows) ? countsRows : [];
      const ids = safeCountsRows.map((c) => c.id as string).filter((id) => !!id);
      const allLines = ids.length > 0
        ? await db.select().from(inventoryCountLines).where(inArray(inventoryCountLines.countId, ids))
        : [];
      const linesByCountId = new Map<string, Array<Record<string, unknown>>>();
      for (const line of (Array.isArray(allLines) ? allLines : [])) {
        const row = line as Record<string, unknown>;
        const cid = String(row.countId ?? '');
        const arr = linesByCountId.get(cid) ?? [];
        arr.push(row);
        linesByCountId.set(cid, arr);
      }
      const counts = safeCountsRows.map((c) =>
        this.mapToInventoryCount({ ...(c as Record<string, unknown>), lines: linesByCountId.get(String(c.id)) ?? [] }),
      );
      return ok({ data: counts, total: countResult[0]?.count || 0, page, limit });
    } catch (error: unknown) {
      this.logger.error('Failed to find counts:', error);
      return err({ message: 'Database error', code: 'DB_ERROR' });
    }
  }

  async saveCount(count: InventoryCount, lines: CountLine[]): Promise<Result<InventoryCount>> {
    try {
      await db.insert(inventoryCounts).values({ id: count.id, warehouseId: count.warehouseId, countNumber: count.countNumber, status: count.status, startedBy: count.startedBy, notes: count.notes });
      for (const line of lines) {
        await db.insert(inventoryCountLines).values({ id: line.id, countId: count.id, stockItemId: line.stockItemId, sku: line.sku, itemName: line.itemName, systemQuantity: line.systemQuantity.toString(), countedQuantity: line.countedQuantity.toString(), variance: line.variance.toString(), unit: line.unit, location: line.location, notes: line.notes });
      }
      return ok(count);
    } catch (error: unknown) {
      this.logger.error('Failed to save count:', error);
      return err({ message: 'Database error', code: 'DB_ERROR' });
    }
  }

  async updateCountStatus(countId: string, status: CountStatus, approvedBy?: string): Promise<Result<InventoryCount>> {
    try {
      const updateData: Record<string, unknown> = { status, updatedAt: _time.now() };
      if (approvedBy) { updateData.approvedBy = approvedBy; updateData.approvedAt = _time.now(); }
      await db.update(inventoryCounts).set(updateData).where(eq(inventoryCounts.id, countId));
      const [countRow2] = await db.select().from(inventoryCounts).where(eq(inventoryCounts.id, countId)).limit(1);
      if (!countRow2) return err({ message: 'Inventory count not found', code: 'NOT_FOUND' });
      const linesForCount = await db.select().from(inventoryCountLines).where(eq(inventoryCountLines.countId, countId));
      return ok(this.mapToInventoryCount({ ...(countRow2 as Record<string, unknown>), lines: linesForCount }));
    } catch (error: unknown) {
      this.logger.error(`Failed to update count status ${countId}:`, error);
      return err({ message: 'Database error', code: 'DB_ERROR' });
    }
  }

  async addCountLine(countId: string, line: CountLine): Promise<Result<CountLine>> {
    try {
      await db.insert(inventoryCountLines).values({ id: line.id, countId, stockItemId: line.stockItemId, sku: line.sku, itemName: line.itemName, systemQuantity: line.systemQuantity.toString(), countedQuantity: line.countedQuantity.toString(), variance: line.variance.toString(), unit: line.unit, location: line.location, notes: line.notes });
      return ok(line);
    } catch (error: unknown) {
      this.logger.error(`Failed to add count line to ${countId}:`, error);
      return err({ message: 'Database error', code: 'DB_ERROR' });
    }
  }

  async updateCountLine(countId: string, lineId: string, countedQuantity: number, notes?: string): Promise<Result<CountLine>> {
    try {
      const [lineRow] = await db.select().from(inventoryCountLines).where(eq(inventoryCountLines.id, lineId)).limit(1);
      if (!lineRow) return err({ message: 'Count line not found', code: 'NOT_FOUND' });
      const line = lineRow as Record<string, unknown>;
      const systemQty = safeNum(line.systemQuantity);
      const variance = countedQuantity - systemQty;
      await db.update(inventoryCountLines).set({ countedQuantity: countedQuantity.toString(), variance: variance.toString(), notes: notes || String(line.notes || '') }).where(eq(inventoryCountLines.id, lineId));
      const [updatedRow] = await db.select().from(inventoryCountLines).where(eq(inventoryCountLines.id, lineId)).limit(1);
      if (!updatedRow) return err({ message: 'Count line not found', code: 'NOT_FOUND' });
      return ok(this.mapToCountLine(updatedRow as Record<string, unknown>));
    } catch (error: unknown) {
      this.logger.error(`Failed to update count line ${lineId}:`, error);
      return err({ message: 'Database error', code: 'DB_ERROR' });
    }
  }

  async findStockItemsByWarehouse(warehouseId: string): Promise<Result<Array<Record<string, unknown>>>> {
    try {
      const rows = await db.select().from(stock_items).where(sql`warehouse_id = ${warehouseId}`);
      return ok((Array.isArray(rows) ? rows : []) as Array<Record<string, unknown>>);
    } catch (error: unknown) {
      this.logger.error('Failed to find stock items by warehouse:', error);
      return err({ message: 'Database error', code: 'DB_ERROR' });
    }
  }

  async syncStockQuantities(updates: Array<{ stockItemId: string; quantity: number }>): Promise<Result<void>> {
    try {
      for (const u of updates) {
        await db.update(stock_items)
          .set({ quantity: String(u.quantity) })
          .where(eq(stock_items.id, u.stockItemId));
      }
      return ok(undefined);
    } catch (error: unknown) {
      this.logger.error('Failed to sync stock quantities:', error);
      return err({ message: 'Database error', code: 'DB_ERROR' });
    }
  }

  // ── Request delegates ──────────────────────────────────────────────────────
  findRequestById(id: string) { return this.requestRepo.findRequestById(id); }
  findRequests(filter: Record<string, unknown>) { return this.requestRepo.findRequests(filter); }
  saveRequest(req: TransferRequest, lines: RequestLine[]) { return this.requestRepo.saveRequest(req, lines); }
  updateRequestStatus(id: string, status: RequestStatus, approvedBy?: string) { return this.requestRepo.updateRequestStatus(id, status, approvedBy); }

  // ── Report delegates ───────────────────────────────────────────────────────
  findByBarcode(barcode: string) { return this.reportRepo.findByBarcode(barcode); }
  getMovementReport(warehouseId: string, from: Date, to: Date) { return this.reportRepo.getMovementReport(warehouseId, from, to); }
  getEmployeeActivity(userId: string, from: Date, to: Date) { return this.reportRepo.getEmployeeActivity(userId, from, to); }
  getLowStockReport(warehouseId?: string) { return this.reportRepo.getLowStockReport(warehouseId); }
}
