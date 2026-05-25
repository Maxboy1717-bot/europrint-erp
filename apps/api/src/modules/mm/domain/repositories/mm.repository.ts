/**
 * @module mm.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Material } from '../aggregates/material.aggregate';
import { PurchaseOrder } from '../aggregates/purchase-order.aggregate';
import { Result, Ok, Err } from '@common/result';

/**
 * Optional transaction handle. Drizzle's `db.transaction(async (tx) => ...)`
 * supplies a `tx` whose API mirrors `db`. We accept it as an opaque value so
 * callers can pin reads + writes to the same transaction without leaking
 * Drizzle types into the domain interface.
 */
export type DrizzleExecutor = unknown;

export interface IMmRepository {
  saveMaterial(material: Material): Promise<Result<number>>;
  getMaterial(id: number): Promise<Result<Material>>;
  getMaterialByCode(code: string): Promise<Result<Material>>;

  savePurchaseOrder(po: PurchaseOrder, tx?: DrizzleExecutor): Promise<Result<number>>;
  getPurchaseOrder(id: number, tx?: DrizzleExecutor): Promise<Result<PurchaseOrder>>;
  getAllPoByStatus(status: string): Promise<Result<PurchaseOrder[]>>;

  recordGoodsReceipt(poId: number, quantity: number): Promise<Result<void>>;
  recordInvoice(poId: number, quantity: number): Promise<Result<void>>;

  validateThreeWayMatch(
    poId: number,
    tx?: DrizzleExecutor,
  ): Promise<Result<{ matched: boolean; difference: number }>>;
  updateVendorRating(supplierId: number, newRating: number): Promise<Result<void>>;

  /**
   * Runs the supplied work inside a Drizzle transaction. Lets callers keep the
   * transaction boundary inside the repo layer (handlers don't need `db`).
   */
  withTransaction<T>(
    work: (tx: DrizzleExecutor) => Promise<Result<T>>,
  ): Promise<Result<T>>;
}

/**
 * DI token for IMmRepository — Symbol-based to avoid string-literal collisions.
 * (P2-20: replaces the legacy `'IMmRepository'` string token.)
 */
export const MM_REPO = Symbol('MM_REPO');

/**
 * DI token for IMmMaterialRepository (Material aggregate).
 * (P2-20: replaces the legacy `'IMmMaterialRepository'` string token.)
 */
export const MM_MATERIAL_REPO = Symbol('MM_MATERIAL_REPO');
