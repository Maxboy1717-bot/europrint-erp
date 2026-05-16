/**
 * @module warehouses.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, InternalServerErrorException, Inject, Logger} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { IWmsWarehousesRepository, WMS_WAREHOUSES_REPO } from './i-wms-warehouses.repo';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class WarehousesService {
  private readonly logger = new Logger(WarehousesService.name);

  constructor(
    @Inject(WMS_WAREHOUSES_REPO) private readonly wmsWarehousesRepo: IWmsWarehousesRepository,
    private readonly i18n: I18nService,
  ) {}

  async findAll(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const MAX_PAGE_LIMIT = 100;
    const page = Number((query.page as number | undefined) ?? 1);
    const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, Number((query.limit as number | undefined) ?? 10)));
    const offset = (page - 1) * limit;
    const activeOnly = query.isActive === 'true' || query.isActive === true;
    const result = await this.wmsWarehousesRepo.findAll(limit, offset, activeOnly);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    const { data, count: total } = result.data;
    return { data, pagination: { total, page, limit } };
  
    });}

  async findOne(id: number) {
    const result = await this.wmsWarehousesRepo.findById(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    if (!result.data) throw new NotFoundException(await this.i18n.t('errors.warehouseNotFound'));
    const zonesResult = await this.wmsWarehousesRepo.findZonesByWarehouseId(id);
    if (!zonesResult.ok) throw new InternalServerErrorException(zonesResult.error);
    return { ...result.data, zones: zonesResult.data };
  }

  async create(dto: Record<string, unknown>){
    return safeCall(async () => {
    const result = await this.wmsWarehousesRepo.create(dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async update(id: number, dto: Record<string, unknown>){
    return safeCall(async () => {
    await this.findOne(id);
    const result = await this.wmsWarehousesRepo.update(id, dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async deactivate(id: number){
    const deactivatedMsg = await this.i18n.t('messages.warehouseDeactivated');
    return safeCall(async () => {
    await this.findOne(id);
    const result = await this.wmsWarehousesRepo.deactivate(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return { message: deactivatedMsg, code: 'WAREHOUSE_DEACTIVATED' };

    });}
}
