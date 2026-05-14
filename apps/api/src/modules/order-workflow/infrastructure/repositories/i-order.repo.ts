/**
 * @module i-order.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/types/result.type';
import { OrderAggregate } from '../../domain/aggregates/order.aggregate';

export const ORDER_WF_REPO = 'ORDER_WF_REPO';

export interface IOrderRepo {
  save(order: OrderAggregate): Promise<Result<OrderAggregate>>;
  findById(id: string, actorTenantId?: string | null): Promise<Result<OrderAggregate | null>>;
  findAll(filters: {
    status?: string;
    customerId?: number;
    tenantId?: string | null;
    actorId?: number;
    limit: number;
    offset: number;
  }): Promise<Result<{ items: OrderAggregate[]; total: number }>>;
}
