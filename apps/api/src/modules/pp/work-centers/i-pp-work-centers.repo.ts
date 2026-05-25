/**
 * @module i-pp-work-centers.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/result';
export interface IPpWorkCentersRepository {
  findAll(): Promise<Result<object[]>>;
  findById(id: number): Promise<Result<any | null>>;
  getStats(): Promise<Result<{ total: number; active: number; byType: Record<string, unknown>[] }>>;
  create(dto: Record<string, unknown>, createdBy?: number): Promise<Result<Record<string, unknown>>>;
  update(id: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  softDelete(id: number): Promise<Result<void>>;
}
export const PP_WORK_CENTERS_REPO = 'IPpWorkCentersRepository';
