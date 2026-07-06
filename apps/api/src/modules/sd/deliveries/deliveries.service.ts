/**
 * @module deliveries.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, InternalServerErrorException, Inject, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ISdDeliveriesRepository, SD_DELIVERIES_REPO } from './i-sd-deliveries.repo';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class DeliveriesService {
  private readonly logger = new Logger(DeliveriesService.name);

  constructor(
    @Inject(SD_DELIVERIES_REPO) private readonly sdDeliveriesRepo: ISdDeliveriesRepository,
    private readonly i18n: I18nService,
  ) {}

  async findAll(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const page = Number((query.page as number | undefined) ?? 1);
    const limit = Number((query.limit as number | undefined) ?? 10);
    const offset = (page - 1) * limit;
    const result = await this.sdDeliveriesRepo.findAll(limit, offset);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    const { data, count: total } = result.data;
    return { data, pagination: { total, page, limit } };
  
    });}

  async findOne(id: number) {
    const result = await this.sdDeliveriesRepo.findById(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    if (!result.data) throw new NotFoundException(await this.i18n.t('errors.deliveryNotFoundWithId', { args: { id } }));
    const itemsResult = await this.sdDeliveriesRepo.findItemsByDeliveryId(id);
    if (!itemsResult.ok) throw new InternalServerErrorException(itemsResult.error);
    return { ...result.data, items: itemsResult.data };
  }

  async create(dto: Record<string, unknown>){
    return safeCall(async () => {
    const result = await this.sdDeliveriesRepo.create(dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async updateStatus(id: number, status: string){
    return safeCall(async () => {
    await this.findOne(id);
    const result = await this.sdDeliveriesRepo.updateStatus(id, status);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}
}
