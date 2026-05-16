/**
 * @module wms.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Stock } from '../aggregates/stock.aggregate';
import { Result, Ok, Err } from '@common/result';

/**
 * Optional transaction handle. Drizzle's `db.transaction(async (tx) => ...)`
 * supplies a `tx` whose select/insert/update API mirrors `db`. We accept it as
 * an opaque value so callers can pin reads + writes to the same transaction
 * without leaking Drizzle types into the domain interface.
 */
export type DrizzleExecutor = unknown;

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
  receiveFg(materialId: number, warehouseId: number, amount: number): Promise<Result<void>>;
  getAllStockByStatus(warehouseId: number): Promise<Result<Stock[]>>;
  softDeleteStock(id: number, deletedBy: number | null, deletedAt?: Date): Promise<Result<void>>;

  /**
   * Runs the supplied work inside a Drizzle transaction. Lets callers keep the
   * transaction boundary inside the repo layer (handlers don't need `db`).
   */
  withTransaction<T>(
    work: (tx: DrizzleExecutor) => Promise<Result<T>>,
  ): Promise<Result<T>>;
}

/**
 * DI token for IWmsRepository — Symbol-based to avoid string-literal collisions.
 * (P2-20: replaces the legacy `'IWmsRepository'` string token.)
 */
export const WMS_REPO = Symbol('WMS_REPO');
