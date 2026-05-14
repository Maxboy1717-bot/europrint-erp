/**
 * @module inventory.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, InternalServerErrorException, Inject, Logger} from '@nestjs/common'; 
import { IWmsInventoryRepository, WMS_INVENTORY_REPO } from './i-wms-inventory.repo';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(@Inject(WMS_INVENTORY_REPO) private readonly wmsInventoryRepo: IWmsInventoryRepository) {}

  async findAll(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    this.logger.log(`Inventar ro'yxati so'raldi`);
    const MAX_PAGE_LIMIT = 100;
    const page = Number((query.page as number | undefined) ?? 1);
    const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, Number((query.limit as number | undefined) ?? 10)));
    const offset = (page - 1) * limit;
    const result = await this.wmsInventoryRepo.findAll(limit, offset);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    const { data, count: total } = result.data;
    return { data, pagination: { total, page, limit } };
  
    });}

  async getByWarehouse(warehouseId: number){
    return safeCall(async () => {
    const warehouseResult = await this.wmsInventoryRepo.findWarehouseById(warehouseId);
    if (!warehouseResult.ok) throw new InternalServerErrorException(warehouseResult.error);
    if (!warehouseResult.data) throw new NotFoundException(`Ombor #${warehouseId} topilmadi`);
    const stockResult = await this.wmsInventoryRepo.findStockByWarehouse(warehouseId);
    if (!stockResult.ok) throw new InternalServerErrorException(stockResult.error);
    return { warehouse: warehouseResult.data, stock: stockResult.data };
  
    });}

  async findOne(id: number){
    return safeCall(async () => {
    const result = await this.wmsInventoryRepo.findStockById(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    if (!result.data) throw new NotFoundException(`Stok #${id} topilmadi`);
    return result.data;
  
    });}
}
