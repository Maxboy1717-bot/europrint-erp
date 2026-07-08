/**
 * @module i-sales-order.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/types/result.type';
import { SalesOrder } from '../aggregates/sales-order.aggregate';

/**
 * Optional Drizzle transaction executor. Typed as `unknown` here to avoid a
 * domain → infrastructure dependency on Drizzle internals; the concrete
 * repository casts it back to the real executor type. Callers (handlers) pass
 * the `tx` value returned by `db.transaction(async (tx) => ...)` so the save
 * participates in the same transaction as outbox writes (PA0-6).
 */
export type DrizzleTxExecutor = unknown;

/** One order line — binds to a finished-good product (owner 2026-06-05). */
export interface SalesOrderLineInput {
  productId: number;
  description: string;
  orderQuantity: number;
  unit?: string;
  netPrice: number;
}

/**
 * One persisted order line as read back from sales_order_items (VISION-3340 #53
 * "Takrorlash"/clone enabler). `productId` is the canonical finished-good binding
 * the create flow writes (FK → products); `materialId` is the legacy/unused column
 * kept only so a clone of an older row is not silently dropped (see drizzle-sd-atp.repo).
 */
export interface SalesOrderItemView {
  id: number;
  itemNumber: string;
  productId: number | null;
  materialId: number | null;
  materialNumber: string | null;
  description: string;
  orderQuantity: number;
  unit: string;
  netPrice: number;
  totalPrice: number;
}

export interface ISalesOrderRepository {
  /**
   * @param crmLeadId 2.6 golden-thread: originating CRM lead id (crm_leads.id), when
   * known (e.g. Deal that came from a Lead). Not part of the SalesOrder aggregate —
   * passed through like `customerId` since it is a cross-module provenance link, not
   * order-domain state.
   */
  save(order: SalesOrder, tx?: DrizzleTxExecutor, crmLeadId?: number | null): Promise<Result<SalesOrder>>;
  /** Persist order line-items into sales_order_items (product_id-bound). Runs in the create tx. */
  saveItems(orderId: number, items: SalesOrderLineInput[], tx?: DrizzleTxExecutor): Promise<Result<number>>;
  /** Read an order's persisted line-items from sales_order_items, ordered by item_number (clone/Takrorlash enabler). */
  findItemsByOrderId(orderId: number): Promise<Result<SalesOrderItemView[]>>;
  findById(id: number): Promise<Result<SalesOrder | null>>;
  findByOrderNumber(orderNumber: string): Promise<Result<SalesOrder | null>>;
  findByCompanyId(companyId: number, limit: number, offset: number): Promise<Result<SalesOrder[]>>;
  findByStatus(status: string, limit: number, offset: number): Promise<Result<SalesOrder[]>>;
  findAll(limit: number, offset: number): Promise<Result<SalesOrder[]>>;
  findPendingAdvanceOrders(limit: number, offset: number): Promise<Result<SalesOrder[]>>;
  /**
   * Persist the order's mutated state (status + advance status). Pass `tx` to run
   * inside an existing transaction so a status change and its golden-thread outbox
   * event commit atomically (PA0-6, mirrors `save`).
   */
  update(order: SalesOrder, tx?: DrizzleTxExecutor): Promise<Result<void>>;
  updateAdvancePaidWithLock(
    id: number,
    newAdvancePaid: number,
    newAdvanceStatus: string,
    expectedVersion: number,
  ): Promise<Result<{ updated: boolean; newVersion: number }>>;
  updateAdvancePaidAtomic(
    id: number,
    newAdvancePaid: number,
    newAdvanceStatus: string,
    expectedVersion: number,
    idempotencyKey: string,
  ): Promise<Result<{ updated: boolean; newVersion: number; duplicate: boolean }>>;
  delete(id: number): Promise<Result<void>>;
  count(): Promise<Result<number>>;
}

/**
 * DI token for ISalesOrderRepository — Symbol-based to avoid string-literal collisions.
 * (P2-20: replaces the legacy `'ISalesOrderRepository'` string token.)
 */
export const SALES_ORDER_REPO = Symbol('SALES_ORDER_REPO');
