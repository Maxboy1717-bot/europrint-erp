/**
 * @module i-delivery.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/types/result.type';
import { Delivery } from '../aggregates/delivery.aggregate';

export interface IDeliveryRepo {
  findById(id: string): Promise<Result<Delivery | null>>;
  findAll(filters: {
    status?: string;
    driverId?: string;
    page?: number;
    limit?: number;
  }): Promise<Result<{ items: Delivery[]; total: number }>>;
  findBySalesOrderId(salesOrderId: string): Promise<Result<Delivery | null>>;
  save(delivery: Delivery): Promise<Result<Delivery>>;
  update(id: string, data: Partial<Delivery>): Promise<Result<Delivery>>;

  /**
   * Auto-create a delivery record for a confirmed/created sales order.
   * Resolves the customer name + delivery address from the sales order (and
   * its linked CRM company) itself, so the caller (the OrderCreated /
   * OrderStatusChanged listeners) does not need a rich event payload.
   *
   * Idempotent at the caller level (listeners check findBySalesOrderId first).
   * Returns the newly created Delivery, or null if the sales order is not found.
   */
  createFromSalesOrder(salesOrderId: number): Promise<Result<Delivery | null>>;
}

export const DELIVERY_REPO = Symbol('DELIVERY_REPO');
