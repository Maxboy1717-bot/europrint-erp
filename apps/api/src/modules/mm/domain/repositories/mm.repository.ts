/**
 * @module mm.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Material } from '../aggregates/material.aggregate';
import { PurchaseOrder } from '../aggregates/purchase-order.aggregate';
import { Result, Ok, Err } from '@common/result';
import type { DrizzleExecutor } from '../../../../common/types/drizzle.types';
export type { DrizzleExecutor };

export interface IMmRepository {
  saveMaterial(material: Material): Promise<Result<number>>;
  getMaterial(id: number): Promise<Result<Material>>;
  getMaterialByCode(code: string): Promise<Result<Material>>;

  savePurchaseOrder(po: PurchaseOrder, tx?: DrizzleExecutor): Promise<Result<number>>;
  getPurchaseOrder(id: number, tx?: DrizzleExecutor): Promise<Result<PurchaseOrder>>;
  getAllPoByStatus(status: string): Promise<Result<PurchaseOrder[]>>;

  /**
   * §11-MM #23 — Material reference narxi: supplier price-list (supplier_price_tiers)
   * bo'lsa shundan, aks holda oxirgi PO satr narxidan (purchase_order_items, id DESC —
   * created_at jonli ma'lumotda NULL). Ikkalasi ham yo'q bo'lsa null (yangi material).
   * Read-only; hech narsa yozilmaydi.
   */
  getMaterialReferencePrice(
    materialId: number,
  ): Promise<Result<{ price: number; source: 'price_list' | 'last_po' } | null>>;

  recordGoodsReceipt(poId: number, quantity: number): Promise<Result<void>>;
  recordInvoice(poId: number, quantity: number): Promise<Result<void>>;

  validateThreeWayMatch(
    poId: number,
    tx?: DrizzleExecutor,
  ): Promise<Result<{ matched: boolean; difference: number }>>;
  updateVendorRating(supplierId: number, newRating: number): Promise<Result<void>>;

  /**
   * §11.8 — On PO creation, appends each line's unit price to material_price_history
   * (append-only) and upserts the supplier→material base tier in supplier_price_tiers.
   * Best-effort: callers must NOT roll back the PO if this fails.
   */
  recordPurchasePrices(
    supplierId: number,
    items: { materialId: number; unitPrice: number }[],
  ): Promise<Result<void>>;

  /**
   * Reads a vendor's persisted supplier-rating signal (vendors.rating +
   * rating_low_flag). rating_low_flag is set by the WMS supplier-rating pipeline
   * when the 4-factor rating drops below the low threshold (2.5). Used by the
   * create-PO handler to route low-rated-vendor POs into the director-HITL path.
   */
  getVendorRating(
    supplierId: number,
  ): Promise<Result<{ rating: number | null; ratingLowFlag: boolean }>>;

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
