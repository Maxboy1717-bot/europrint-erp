/**
 * @module order-costing.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, InternalServerErrorException, Inject } from '@nestjs/common';
import { IOrderCostingRepository, ORDER_COSTING_REPO } from './i-order-costing.repo';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class OrderCostingService {
  constructor(@Inject(ORDER_COSTING_REPO) private readonly repo: IOrderCostingRepository) {}

  async findAll(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const result = await this.repo.findAll(limit, (page - 1) * limit);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return { data: result.data.data, pagination: { total: result.data.count, page, limit } };
  
    });}

  async findById(id: number) {
    const result = await this.repo.findById(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    if (!result.data) throw new NotFoundException(`Buyurtma xarajati #${id} topilmadi`);
    return result.data;
  }

  async create(dto: Record<string, unknown>){
    return safeCall(async () => {
    const result = await this.repo.create(dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async findTopProfitable(limit = 10){
    return safeCall(async () => {
    const result = await this.repo.findTopProfitable(Math.min(limit, 50));
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async findTopLoss(limit = 10){
    return safeCall(async () => {
    const result = await this.repo.findTopLoss(Math.min(limit, 50));
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async calculate(id: number){
    return safeCall(async () => {
    await this.findById(id);
    const result = await this.repo.calculate(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}
}
