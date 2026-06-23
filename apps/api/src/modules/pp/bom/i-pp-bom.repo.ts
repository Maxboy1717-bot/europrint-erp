/**
 * @module i-pp-bom.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/result';
type Row = Record<string, unknown>;
export interface IPpBomRepository {
  findAll(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>>;
  findById(id: number): Promise<Result<any | null>>;
  findItemsByBomId(bomId: number): Promise<Result<object[]>>;
  addItem(bomId: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  removeItem(itemId: number): Promise<Result<void>>;
  create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  update(id: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  approve(id: number): Promise<Result<Record<string, unknown>>>;
  softDelete(id: number): Promise<Result<void>>;
}
export const PP_BOM_REPO = 'IPpBomRepository';
