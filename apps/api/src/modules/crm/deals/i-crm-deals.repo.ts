/**
 * @module i-crm-deals.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/result';
type Row = Record<string, unknown>;
export interface ICrmDealsRepository {
  findAll(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>>;
  findById(id: string): Promise<Result<any | null>>;
  create(dto: Record<string, unknown>, createdBy?: number): Promise<Result<Record<string, unknown>>>;
  update(id: string, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  softDelete(id: string): Promise<Result<void>>;
}
export const CRM_DEALS_REPO = 'ICrmDealsRepository';
