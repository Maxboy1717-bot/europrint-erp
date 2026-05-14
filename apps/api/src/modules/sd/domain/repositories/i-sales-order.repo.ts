/**
 * @module i-sales-order.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/types/result.type';
import { SalesOrder } from '../aggregates/sales-order.aggregate';

export interface ISalesOrderRepository {
  save(order: SalesOrder): Promise<Result<SalesOrder>>;
  findById(id: number): Promise<Result<SalesOrder | null>>;
  findByOrderNumber(orderNumber: string): Promise<Result<SalesOrder | null>>;
  findByCompanyId(companyId: number, limit: number, offset: number): Promise<Result<SalesOrder[]>>;
  findByStatus(status: string, limit: number, offset: number): Promise<Result<SalesOrder[]>>;
  findAll(limit: number, offset: number): Promise<Result<SalesOrder[]>>;
  findPendingAdvanceOrders(limit: number, offset: number): Promise<Result<SalesOrder[]>>;
  update(order: SalesOrder): Promise<Result<void>>;
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
