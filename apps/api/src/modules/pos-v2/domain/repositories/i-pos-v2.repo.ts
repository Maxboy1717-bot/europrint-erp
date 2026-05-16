/**
 * @module i-pos-v2.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/result';
import { InventoryCount, CountStatus, CountLine } from '../aggregates/inventory-count.aggregate';
import { TransferRequest, RequestStatus, RequestLine } from '../aggregates/transfer-request.aggregate';

export const POS_V2_REPO = Symbol('POS_V2_REPO');

export interface StockItemBarcode {
  id: string;
  sku: string;
  name: string;
  currentQuantity: number;
  unit: string;
  warehouseLocation: string | null;
  expiryDate: Date | null;
}

export interface MovementSummary {
  warehouseId: string;
  date: Date;
  countCompleted: number;
  transfersCompleted: number;
  totalVariance: number;
  totalItems: number;
}

export interface EmployeeActivity {
  userId: string;
  name: string;
  totalCountsStarted: number;
  totalCountsCompleted: number;
  totalTransfersCreated: number;
  totalTransfersApproved: number;
}

export interface IPosV2Repo {
  // ===== Inventory Counts =====
  findCountById(countId: string): Promise<Result<InventoryCount>>;
  findCounts(filter: {
    warehouseId?: string;
    status?: CountStatus;
    page?: number;
    limit?: number;
  }): Promise<Result<{ data: InventoryCount[]; total: number; page: number; limit: number }>>;

  saveCount(count: InventoryCount, lines: CountLine[]): Promise<Result<InventoryCount>>;
  updateCountStatus(countId: string, status: CountStatus, approvedBy?: string): Promise<Result<InventoryCount>>;
  addCountLine(countId: string, line: CountLine): Promise<Result<CountLine>>;
  updateCountLine(countId: string, lineId: string, countedQuantity: number, notes?: string): Promise<Result<CountLine>>;

  // ===== Transfer Requests =====
  findRequestById(requestId: string): Promise<Result<TransferRequest>>;
  findRequests(filter: {
    status?: RequestStatus;
    fromWarehouseId?: string;
    toWarehouseId?: string;
    page?: number;
    limit?: number;
  }): Promise<Result<{ data: TransferRequest[]; total: number; page: number; limit: number }>>;

  saveRequest(request: TransferRequest, lines: RequestLine[]): Promise<Result<TransferRequest>>;
  updateRequestStatus(requestId: string, status: RequestStatus, approvedBy?: string): Promise<Result<TransferRequest>>;

  // ===== Stock items =====
  /**
   * Returns all stock items in a warehouse (raw rows for count-line creation).
   * Used by StartInventoryCountHandler (PA1-10).
   */
  findStockItemsByWarehouse(warehouseId: string): Promise<Result<Array<Record<string, unknown>>>>;

  /**
   * Updates each stock item's quantity to the counted quantity (post-approval sync).
   * Used by ApproveCountHandler (PA1-10).
   */
  syncStockQuantities(updates: Array<{ stockItemId: string; quantity: number }>): Promise<Result<void>>;

  // ===== Barcode Lookup =====
  findByBarcode(barcode: string): Promise<Result<StockItemBarcode | null>>;

  // ===== Reports =====
  getMovementReport(warehouseId: string, from: Date, to: Date): Promise<Result<MovementSummary>>;
  getEmployeeActivity(userId: string, from: Date, to: Date): Promise<Result<EmployeeActivity>>;
  getLowStockReport(warehouseId?: string): Promise<Result<Array<{ stockItemId: string; name: string; sku: string; currentQty: number; minQty: number; location: string | null }>>>;
}
