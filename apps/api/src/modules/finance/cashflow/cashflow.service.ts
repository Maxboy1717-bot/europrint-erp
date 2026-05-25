/**
 * @module cashflow.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, InternalServerErrorException, Inject } from '@nestjs/common';
import { ICashflowRepository, CASHFLOW_REPO } from './i-cashflow.repo';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class CashflowService {
  constructor(@Inject(CASHFLOW_REPO) private readonly repo: ICashflowRepository) {}

  async findTransactions(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const result = await this.repo.findTransactions(limit, (page - 1) * limit);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return { data: result.data.data, pagination: { total: result.data.count, page, limit } };
  
    });}

  async createTransaction(dto: Record<string, unknown>){
    return safeCall(async () => {
    const result = await this.repo.createTransaction(dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async findDailySummary(date?: string){
    return safeCall(async () => {
    const result = await this.repo.findDailySummary(date);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async findForecast(days?: number){
    return safeCall(async () => {
    const safeDays = Math.min(Math.max(1, Number(days ?? 7)), 90);
    const result = await this.repo.findForecast(safeDays);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}
}
