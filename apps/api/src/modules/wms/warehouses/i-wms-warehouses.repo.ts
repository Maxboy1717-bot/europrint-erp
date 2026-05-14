/**
 * @module i-wms-warehouses.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/result';
type Row = Record<string, unknown>;
export interface IWmsWarehousesRepository {
  findAll(limit: number, offset: number, activeOnly?: boolean): Promise<Result<{ data: Row[]; count: number }>>;
  findById(id: number): Promise<Result<any | null>>;
  findZonesByWarehouseId(warehouseId: number): Promise<Result<object[]>>;
  create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  update(id: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  deactivate(id: number): Promise<Result<void>>;
}
export const WMS_WAREHOUSES_REPO = 'IWmsWarehousesRepository';
