/**
 * @module pp.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { ProductionOrder } from '../aggregates/production-order.aggregate';
import { Bom } from '../aggregates/bom.aggregate';
import { Routing } from '../aggregates/routing.aggregate';
import { Result, Ok, Err } from '@common/result';

export interface BomComponentRow {
  parentId: string;
  childId: string;
  qtyPerUnit: number;
}

export interface IPpRepository {
  savePo(po: ProductionOrder): Promise<Result<number>>;
  getPo(id: number): Promise<Result<ProductionOrder>>;
  getAllPoByStatus(status: string): Promise<Result<ProductionOrder[]>>;

  saveBom(bom: Bom): Promise<Result<number>>;
  getBom(id: number): Promise<Result<Bom>>;
  getBomByProductId(productId: number): Promise<Result<Bom>>;

  saveRouting(routing: Routing): Promise<Result<number>>;
  getRouting(id: number): Promise<Result<Routing>>;
  getRoutingByProductId(productId: number): Promise<Result<Routing>>;

  unlockPlanning(orderId: number): Promise<Result<void>>;

  /**
   * Golden-thread SD→PP entry: open production order(s) for a confirmed sales order.
   * Idempotent — if any production order already references the sales order, returns
   * `0` created (skip). Otherwise inserts one production order per finished-good line
   * (sales_order_items.product_id), linked via sales_order_id. Returns the count created.
   */
  createPlanFromSalesOrder(salesOrderId: number, createdBy?: number): Promise<Result<number>>;

  getProductionPlan(startDate: Date, endDate: Date): Promise<Result<object[]>>;
  getMachineLoad(workCenterId: number): Promise<Result<object[]>>;

  /**
   * Returns all active BOM component edges (parent → child relationships
   * with their per-unit quantity). Used by the BOM explosion domain service
   * which performs Kahn topological traversal over the in-memory graph.
   */
  findActiveBomComponents(): Promise<Result<BomComponentRow[]>>;
}

/**
 * DI token for IPpRepository — Symbol-based to avoid string-literal collisions.
 * (P2-20: replaces the legacy `'IPpRepository'` string token.)
 */
export const PP_REPO = Symbol('PP_REPO');

/**
 * DI token for the Drizzle WorkCenter repository (concrete-class injection).
 * (P2-20: replaces the legacy `'IWorkCenterRepository'` string token.)
 */
export const WORK_CENTER_REPO = Symbol('WORK_CENTER_REPO');
