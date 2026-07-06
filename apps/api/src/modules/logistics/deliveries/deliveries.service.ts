/**
 * @module deliveries.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, Inject, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { IDeliveriesRepository, DELIVERIES_REPO } from './i-deliveries.repo';
import { isTransitionAllowed, DELIVERY_TRANSITIONS } from '@common/constants/status-machines.constants';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class DeliveriesService {
  private readonly logger = new Logger(DeliveriesService.name);

  constructor(
    @Inject(DELIVERIES_REPO) private readonly deliveriesRepo: IDeliveriesRepository,
    private readonly i18n: I18nService,
  ) {}

  async findAll(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const rawPage  = Number(query.page);
    const rawLimit = Number(query.limit);
    const page  = Number.isFinite(rawPage)  && rawPage  > 0 ? Math.floor(rawPage)  : 1;
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(Math.floor(rawLimit), 200) : 10;
    const result = await this.deliveriesRepo.findAll();
    if (!result.ok) throw new InternalServerErrorException(result.error);
    const deliveries = result.data;
    const total = deliveries.length;
    const data = (deliveries as Record<string, unknown>[]).slice((page - 1) * limit, page * limit).map((d) => ({
      ...d,
      cost: d['cost'] !== undefined ? Number(d['cost']) : d['cost'],
      weight: d['weight'] !== undefined ? Number(d['weight']) : d['weight'],
    }));
    return { data, total, page, limit };
  
    });}

  async findOne(id: number) {
    const result = await this.deliveriesRepo.findById(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    if (!result.data) throw new NotFoundException(await this.i18n.t('errors.deliveryNotFoundWithId', { args: { id } }));
    return result.data;
  }

  async create(dto: Record<string, unknown>){
    return safeCall(async () => {
    const result = await this.deliveriesRepo.create(dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    this.logger.log(`DeliveriesService: delivery created: #${(result.data as Record<string, unknown>)?.id}`);
    return result.data;
  
    });}

  async updateStatus(id: number, newStatus: string){
    return safeCall(async () => {
    const delivery = await this.findOne(id);
    if (!isTransitionAllowed(DELIVERY_TRANSITIONS, (delivery).status, newStatus)) {
      throw new BadRequestException(await this.i18n.t('errors.deliveryStatusTransitionNotAllowed', { args: { from: (delivery).status, to: newStatus } }));
    }
    const updateResult = await this.deliveriesRepo.updateStatus(
      id,
      newStatus,
      newStatus === 'delivered' ? _time.now() : undefined,
    );
    if (!updateResult.ok) throw new InternalServerErrorException(updateResult.error);
    this.logger.log(`DeliveriesService: delivery #${id} status: → ${newStatus}`);
    return updateResult.data;
  
    });}
}
