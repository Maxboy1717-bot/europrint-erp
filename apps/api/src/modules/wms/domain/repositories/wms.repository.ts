/**
 * @module wms.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Stock } from '../aggregates/stock.aggregate';
import { Result, Ok, Err } from '@common/result';
import type { DrizzleExecutor } from '../../../../common/types/drizzle.types';
import type { IssuableBatchLot } from '../services/batch-selection.service';
export type { DrizzleExecutor };

export interface CreateWarehouseInput {
  id: string;
  name: string;
  address: string | null;
  is_free_storage: boolean;
  free_storage_days: number;
  monthly_rate: string | null;
  created_at: Date;
}

/** Input for recording one WMS goods-issue row (status defaults to 'issued'). */
export interface InsertGoodsIssueInput {
  materialId: number;
  warehouseId: number;
  quantity: number;
  ppId: number | null;
  issuedBy: number | null;
}

export interface IWmsRepository {
  saveStock(stock: Stock, tx?: DrizzleExecutor): Promise<Result<number>>;
  getStock(id: number): Promise<Result<Stock>>;
  getStockByMaterialAndWarehouse(
    materialId: number,
    warehouseId: number,
  ): Promise<Result<Stock[]>>;
  getFefoStock(
    materialId: number,
    warehouseId: number,
    tx?: DrizzleExecutor,
  ): Promise<Result<Stock[]>>;
  reserveMaterial(materialId: number, warehouseId: number, amount: number): Promise<Result<void>>;
  issueGoods(materialId: number, warehouseId: number, amount: number, reservationId?: number | null): Promise<Result<void>>;
  /** Canonical chiqim: guarded decrement of warehouse_stock (aggregate fallback when no batches). */
  issueFromWarehouseStock(materialId: number, warehouseId: number, amount: number, tx?: DrizzleExecutor): Promise<Result<void>>;

  /**
   * #08 PHASE 4/7 — FIFO/FEFO batch issue (canonical `batch_lots`).
   * Returns the issuable (active + QC-allowed quality_status) batch-lot rows
   * for a material/warehouse. Expired rows are returned too so the selection
   * service can BLOCK the issue (EP-WMS-079) rather than silently skipping.
   */
  getIssuableBatchLots(
    materialId: number,
    warehouseId: number,
    tx?: DrizzleExecutor,
  ): Promise<Result<IssuableBatchLot[]>>;

  /**
   * True when ANY active batch_lots row exists for the material/warehouse
   * (regardless of quality_status). Drives the no-batch → aggregate fallback:
   * if batch tracking exists we MUST consume specific batches, never the
   * aggregate. If none exist, the aggregate warehouse_stock path is used.
   */
  hasAnyBatchLots(
    materialId: number,
    warehouseId: number,
    tx?: DrizzleExecutor,
  ): Promise<Result<boolean>>;

  /**
   * Guarded decrement of one batch_lots row's remaining_quantity by `qty`.
   * The `remaining_quantity >= qty` guard makes the single UPDATE both the
   * check and the write, so a batch can't go negative under concurrency.
   * Returns Err when the row is missing / would go negative.
   */
  decrementBatchLot(
    lotId: number,
    qty: number,
    tx?: DrizzleExecutor,
  ): Promise<Result<void>>;
  /**
   * Canonical FG receipt: upserts warehouse_stock AND records an 'IN' wms_transactions
   * ledger row in ONE transaction (A60 — stock + movement stay atomic). Optional receipt
   * context (`referenceId` = source order/inspection, `createdBy`, `notes`) is recorded on
   * the ledger row so the receipt is auditable and visible to the "today_movements" KPI.
   */
  receiveFg(
    materialId: number,
    warehouseId: number,
    amount: number,
    context?: { referenceId?: number | null; createdBy?: number | null; notes?: string | null },
  ): Promise<Result<void>>;

  /**
   * Inserts one `wms_goods_issues` row. Called from inside the goods-issue
   * transaction (same `tx` as the stock decrement) so the record is atomic
   * with the balance change. Returns the new row id.
   */
  insertGoodsIssue(
    input: InsertGoodsIssueInput,
    tx?: DrizzleExecutor,
  ): Promise<Result<number>>;

  /**
   * A60 (OUT side) — records ONE `wms_transactions` ledger row for a stock movement.
   * receiveFg() already writes the matching 'IN' row inside its own tx; the goods-issue
   * path calls this with type 'OUT' inside the SAME `tx` as the warehouse_stock decrement,
   * so every issue is auditable and visible to the "today_movements" KPI / per-material
   * recent-transactions readers (symmetric stock<->ledger sync). Atomic with the decrement:
   * if the ledger INSERT fails the whole issue rolls back.
   */
  recordWmsTransaction(
    input: {
      warehouseId: number;
      materialId: number;
      type: string;
      quantity: number;
      referenceId?: number | null;
      createdBy?: number | null;
      notes?: string | null;
    },
    tx?: DrizzleExecutor,
  ): Promise<Result<void>>;
  getAllStockByStatus(warehouseId: number): Promise<Result<Stock[]>>;
  softDeleteStock(id: number, deletedBy: number | null, deletedAt?: Date): Promise<Result<void>>;

  /**
   * Runs the supplied work inside a Drizzle transaction. Lets callers keep the
   * transaction boundary inside the repo layer (handlers don't need `db`).
   */
  withTransaction<T>(
    work: (tx: DrizzleExecutor) => Promise<Result<T>>,
  ): Promise<Result<T>>;

  /**
   * Inserts a warehouse row. Handler stays SQL-free (PA1-10).
   */
  createWarehouse(input: CreateWarehouseInput): Promise<Result<CreateWarehouseInput>>;
}

/**
 * DI token for IWmsRepository — Symbol-based to avoid string-literal collisions.
 * (P2-20: replaces the legacy `'IWmsRepository'` string token.)
 */
export const WMS_REPO = Symbol('WMS_REPO');
