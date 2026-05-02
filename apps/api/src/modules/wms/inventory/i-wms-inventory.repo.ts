import { Result } from '@common/result';
type Row = Record<string, unknown>;
export interface IWmsInventoryRepository {
  findAll(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>>;
  findWarehouseById(warehouseId: number): Promise<Result<any | null>>;
  findStockByWarehouse(warehouseId: number): Promise<Result<object[]>>;
  findStockById(id: number): Promise<Result<any | null>>;
}
export const WMS_INVENTORY_REPO = 'IWmsInventoryRepository';
