/**
 * @module i-deliveries.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/result';

export interface IDeliveriesRepository {
  findAll(): Promise<Result<object[]>>;
  findById(id: number): Promise<Result<any | null>>;
  create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  updateStatus(id: number, status: string, arrivedAt?: Date): Promise<Result<Record<string, unknown>>>;
}

export const DELIVERIES_REPO = 'IDeliveriesRepository';
