/**
 * @module mm.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Material } from '../aggregates/material.aggregate';
import { PurchaseOrder } from '../aggregates/purchase-order.aggregate';
import { Result, Ok, Err } from '@common/result';

export interface IMmRepository {
  saveMaterial(material: Material): Promise<Result<number>>;
  getMaterial(id: number): Promise<Result<Material>>;
  getMaterialByCode(code: string): Promise<Result<Material>>;

  savePurchaseOrder(po: PurchaseOrder): Promise<Result<number>>;
  getPurchaseOrder(id: number): Promise<Result<PurchaseOrder>>;
  getAllPoByStatus(status: string): Promise<Result<PurchaseOrder[]>>;

  recordGoodsReceipt(poId: number, quantity: number): Promise<Result<void>>;
  recordInvoice(poId: number, quantity: number): Promise<Result<void>>;

  validateThreeWayMatch(poId: number): Promise<Result<{ matched: boolean; difference: number }>>;
  updateVendorRating(supplierId: number, newRating: number): Promise<Result<void>>;
}
