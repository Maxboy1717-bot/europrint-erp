/**
 * @module deliveries.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, Inject, Logger } from '@nestjs/common';
import { IDeliveriesRepository, DELIVERIES_REPO } from './i-deliveries.repo';
import { isTransitionAllowed, DELIVERY_TRANSITIONS } from '@common/constants/status-machines.constants';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class DeliveriesService {
  private readonly logger = new Logger(DeliveriesService.name);

  constructor(@Inject(DELIVERIES_REPO) private readonly deliveriesRepo: IDeliveriesRepository) {}

  async findAll(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const { page = 1, limit = 10 } = query;
    const result = await this.deliveriesRepo.findAll();
    if (!result.ok) throw new InternalServerErrorException(result.error);
    const deliveries = result.data;
    const total = deliveries.length;
    const data = (deliveries as Record<string, unknown>[]).slice((Number(page) - 1) * Number(limit), Number(page) * Number(limit)).map((d) => ({
      ...d,
      cost: d['cost'] !== undefined ? Number(d['cost']) : d['cost'],
      weight: d['weight'] !== undefined ? Number(d['weight']) : d['weight'],
    }));
    return { data, total, page, limit };
  
    });}

  async findOne(id: number) {
    const result = await this.deliveriesRepo.findById(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    if (!result.data) throw new NotFoundException(`Yetkazib berish #${id} topilmadi`);
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
      throw new BadRequestException(`${(delivery).status} → ${newStatus} mumkin emas`);
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
