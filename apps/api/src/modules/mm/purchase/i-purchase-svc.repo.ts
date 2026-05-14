/**
 * @module i-purchase-svc.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/result';

export interface IPurchaseSvcRepository {
  findAll(limit: number): Promise<Result<object[]>>;
  findById(id: number): Promise<Result<any | null>>;
  findItemsByOrderId(orderId: number): Promise<Result<object[]>>;
  create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  updateStatus(id: number, status: string): Promise<Result<Record<string, unknown>>>;
}

export const PURCHASE_SVC_REPO = 'IPurchaseSvcRepository';
