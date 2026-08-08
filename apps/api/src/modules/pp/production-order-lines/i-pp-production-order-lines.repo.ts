/**
 * @module i-pp-production-order-lines.repo
 * @description Repository port for production_order_lines (multi-line order — EP-PP-118,
 *   vision 07-pp#124). Each line = one order position with its own product / route /
 *   quantity / status / seq. Every method returns Result<T>.
 */

import { Result } from '@common/result';

/** camelCase API view of one production_order_lines row. */
export interface ProductionOrderLineRow {
  id: number;
  productionOrderId: number;
  productId: number;
  quantity: string;
  routeId: number | null;
  seq: number;
  status: string;
  notes: string | null;
}

export interface CreateOrderLineInput {
  productId: number;
  quantity: number;
  routeId?: number | null;
  seq?: number | null;
  status?: string;
  notes?: string | null;
}

export interface UpdateOrderLineInput {
  productId?: number;
  quantity?: number;
  routeId?: number | null;
  seq?: number;
  status?: string;
  notes?: string | null;
}

export interface IPpProductionOrderLinesRepo {
  /** True when the parent production order exists and is not soft-deleted. */
  orderExists(productionOrderId: number): Promise<Result<boolean>>;
  findByOrder(productionOrderId: number): Promise<Result<ProductionOrderLineRow[]>>;
  findById(id: number): Promise<Result<ProductionOrderLineRow | null>>;
  create(productionOrderId: number, dto: CreateOrderLineInput): Promise<Result<ProductionOrderLineRow>>;
  update(id: number, patch: UpdateOrderLineInput): Promise<Result<ProductionOrderLineRow | null>>;
  remove(id: number): Promise<Result<boolean>>;
}

export const PP_PRODUCTION_ORDER_LINES_REPO = 'IPpProductionOrderLinesRepo';
