/**
 * @module i-design-orders-svc.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/result';

export interface IDesignOrdersSvcRepository {
  findAll(opts?: { limit?: number; offset?: number }): Promise<Result<object[]>>;
  count(): Promise<Result<number>>;
  findById(id: number): Promise<Result<any | null>>;
  create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  updateStatus(id: number, status: string): Promise<Result<Record<string, unknown>>>;
  /**
   * Idempotently ensure a design task exists for a sales order (golden-thread
   * SD→Design auto-trigger). Returns `created:false` when one already exists so
   * the event listener can fire safely from both the direct-publish bridge and
   * the durable outbox tick without producing duplicate tasks.
   */
  ensureForSalesOrder(
    salesOrderId: string,
    data: { orderNumber: string; title: string },
  ): Promise<Result<{ created: boolean; id: number }>>;
}

export const DESIGN_ORDERS_SVC_REPO = 'IDesignOrdersSvcRepository';
