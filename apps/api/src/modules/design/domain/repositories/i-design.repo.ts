/**
 * @module i-design.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/types/result.type';
import { DesignOrder } from '../aggregates/design-order.aggregate';

export interface IDesignRepo {
  findById(id: string): Promise<Result<DesignOrder | null>>;
  findAll(filters: {
    status?: string;
    assignedTo?: string;
    page?: number;
    limit?: number;
  }): Promise<Result<{ items: DesignOrder[]; total: number }>>;
  findBySalesOrderId(salesOrderId: string): Promise<Result<DesignOrder | null>>;
  save(order: DesignOrder): Promise<Result<DesignOrder>>;
  update(id: string, data: Partial<DesignOrder>): Promise<Result<DesignOrder>>;
}

export const DESIGN_REPO = Symbol('DESIGN_REPO');
