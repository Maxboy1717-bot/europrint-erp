import { Stock } from '../aggregates/stock.aggregate';
import { Result, Ok, Err } from '@common/result';

export interface IWmsRepository {
  saveStock(stock: Stock): Promise<Result<number>>;
  getStock(id: number): Promise<Result<Stock>>;
  getStockByMaterialAndWarehouse(
    materialId: number,
    warehouseId: number,
  ): Promise<Result<Stock[]>>;
  getFefoStock(materialId: number, warehouseId: number): Promise<Result<Stock[]>>;
  reserveMaterial(materialId: number, warehouseId: number, amount: number): Promise<Result<void>>;
  issueGoods(materialId: number, warehouseId: number, amount: number): Promise<Result<void>>;
  receiveFg(materialId: number, warehouseId: number, amount: number): Promise<Result<void>>;
  getAllStockByStatus(warehouseId: number): Promise<Result<Stock[]>>;
  softDeleteStock(id: number, deletedBy: number | null, deletedAt?: Date): Promise<Result<void>>;
}
