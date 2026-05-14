/**
 * @module budgets.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, Inject } from '@nestjs/common';
import { IFinanceBudgetsRepository, FINANCE_BUDGETS_REPO } from './i-finance-budgets.repo';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class BudgetsService {

  constructor(@Inject(FINANCE_BUDGETS_REPO) private readonly financeBudgetsRepo: IFinanceBudgetsRepository) {}

  async findAll(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const page = Number((query.page as number | undefined) ?? 1);
    const limit = Number((query.limit as number | undefined) ?? 10);
    const offset = (page - 1) * limit;
    const result = await this.financeBudgetsRepo.findAll(limit, offset);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    const { data, count: total } = result.data;
    return { data, pagination: { total, page, limit } };
  
    });}

  async findOne(id: number) {
    const result = await this.financeBudgetsRepo.findById(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    if (!result.data) throw new NotFoundException(`Byudjet #${id} topilmadi`);
    return result.data;
  }

  async create(dto: Record<string, unknown>){
    return safeCall(async () => {
    const result = await this.financeBudgetsRepo.create(dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async update(id: number, dto: Record<string, unknown>){
    return safeCall(async () => {
    await this.findOne(id);
    const result = await this.financeBudgetsRepo.update(id, dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async approve(id: number){
    return safeCall(async () => {
    const budget = await this.findOne(id);
    if (budget.status !== 'draft') throw new BadRequestException('Faqat draft byudjetni tasdiqlash mumkin');
    const result = await this.financeBudgetsRepo.approve(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async remove(id: number){
    return safeCall(async () => {
    await this.findOne(id);
    const result = await this.financeBudgetsRepo.softDelete(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return { message: "O'chirildi" };
  
    });}

  async findBudgetLines(budgetId: string, query: Record<string, unknown> = {}){
    return safeCall(async () => {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 50);
    const result = await this.financeBudgetsRepo.findBudgetLines(budgetId, limit, (page - 1) * limit);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return { data: result.data.data, pagination: { total: result.data.count, page, limit } };
  
    });}

  async createBudgetLine(budgetId: string, dto: Record<string, unknown>){
    return safeCall(async () => {
    const result = await this.financeBudgetsRepo.createBudgetLine(budgetId, dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}
}
