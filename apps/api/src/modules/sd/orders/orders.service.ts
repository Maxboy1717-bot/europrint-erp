/**
 * @module orders.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, Inject, Logger } from '@nestjs/common';
import { ISdOrdersRepository, SD_ORDERS_REPO } from './i-sd-orders.repo';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(@Inject(SD_ORDERS_REPO) private readonly sdOrdersRepo: ISdOrdersRepository) {}

  async findAll(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const result = await this.sdOrdersRepo.findAll();
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async findOne(id: number) {
    const result = await this.sdOrdersRepo.findById(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    if (!result.data) throw new NotFoundException(`Buyurtma #${id} topilmadi`);
    return result.data;
  }

  async create(dto: Record<string, unknown>, createdBy?: number){
    return safeCall(async () => {
    const result = await this.sdOrdersRepo.create(dto, createdBy);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async update(id: number, dto: Record<string, unknown>){
    return safeCall(async () => {
    await this.findOne(id);
    const result = await this.sdOrdersRepo.update(id, dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async updateStatus(id: number, masterStatus: string){
    return safeCall(async () => {
    await this.findOne(id);
    const result = await this.sdOrdersRepo.updateMasterStatus(id, masterStatus);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async recordAdvancePayment(id: number, dto: { advancePaidAmount: string; advanceStatus: string; balanceDueAmount: string }){
    return safeCall(async () => {
    await this.findOne(id);
    const result = await this.sdOrdersRepo.updateAdvancePayment(id, dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async cancel(id: number){
    return safeCall(async () => {
    const order = await this.findOne(id);
    if (order.status === 'cancelled' || order.overallStatus === 'CANCELLED') throw new BadRequestException('Buyurtma allaqachon bekor qilingan');
    const result = await this.sdOrdersRepo.cancel(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return { message: 'Buyurtma bekor qilindi' };
  
    });}
}
