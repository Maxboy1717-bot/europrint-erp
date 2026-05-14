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
}

export const DELIVERY_REPO = Symbol('DELIVERY_REPO');
