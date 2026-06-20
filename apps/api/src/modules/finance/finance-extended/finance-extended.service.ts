/**
 * @module finance-extended.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, InternalServerErrorException, Logger, Inject } from '@nestjs/common';
import { IFinanceExtendedRepository, FINANCE_EXTENDED_REPO } from './i-finance-extended.repo';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class FinanceExtendedService {
  private readonly logger = new Logger(FinanceExtendedService.name);
  constructor(@Inject(FINANCE_EXTENDED_REPO) private readonly repo: IFinanceExtendedRepository) {}

  async findCategories(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const result = await this.repo.findCategories(limit, (page - 1) * limit);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return { data: result.data.data, pagination: { total: result.data.count, page, limit } };
  
    });}

  async findCategoryById(id: number) {
    const result = await this.repo.findCategoryById(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    if (!result.data) throw new NotFoundException(`Kategoriya #${id} topilmadi`);
    return result.data;
  }

  async createCategory(dto: Record<string, unknown>){
    return safeCall(async () => {
    const result = await this.repo.createCategory(dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async updateCategory(id: number, dto: Record<string, unknown>){
    return safeCall(async () => {
    await this.findCategoryById(id);
    const result = await this.repo.updateCategory(id, dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async deleteCategory(id: number){
    return safeCall(async () => {
    await this.findCategoryById(id);
    const result = await this.repo.deleteCategory(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return { message: "O'chirildi" };
  
    });}

  async findIncomeExpense(query: Record<string, unknown> = {}){
    return safeCall(async () => {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const result = await this.repo.findIncomeExpense(limit, (page - 1) * limit);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return { data: result.data.data, pagination: { total: result.data.count, page, limit } };
  
    });}

  async findIncomeExpenseSummary(){
    return safeCall(async () => {
    const result = await this.repo.findIncomeExpenseSummary();
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async createIncomeExpense(dto: Record<string, unknown>){
    return safeCall(async () => {
    const result = await this.repo.createIncomeExpense(dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async updateIncomeExpense(id: number, dto: Record<string, unknown>){
    return safeCall(async () => {
    const result = await this.repo.updateIncomeExpense(id, dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async deleteIncomeExpense(id: number){
    return safeCall(async () => {
    const result = await this.repo.deleteIncomeExpense(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return { message: "O'chirildi" };
  
    });}

  async findInventoryCounts(query: Record<string, unknown> = {}){
    return safeCall(async () => {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const result = await this.repo.findInventoryCounts(limit, (page - 1) * limit);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return { data: result.data.data, pagination: { total: result.data.count, page, limit } };
  
    });}

  async createInventoryCount(dto: Record<string, unknown>): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await this.repo.createInventoryCount(dto);
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return result.data;
    });
  }

  async findAssetInventorySummary() {
    return safeCall(async () => {
      const result = await this.repo.findAssetInventorySummary();
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return result.data;
    });
  }

  async findAssetInventory(query: Record<string, unknown> = {}){
    return safeCall(async () => {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const status = query.status as string | undefined;
    const result = await this.repo.findAssetInventory(limit, (page - 1) * limit, status);
    if (!result.ok) {
      this.logger.warn(`asset-inventory table unavailable, returning empty: ${result.error}`);
      return { data: [], pagination: { total: 0, page, limit } };
    }
    return { data: result.data.data, pagination: { total: result.data.count, page, limit } };

    });}

  async createAsset(dto: Record<string, unknown>): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await this.repo.createAsset(dto);
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return result.data;
    });
  }

  async findAssetInventoryById(id: string){
    return safeCall(async () => {
    const result = await this.repo.findAssetInventoryById(id);
    if (!result.ok) {
      this.logger.warn(`findAssetInventoryById unavailable: ${result.error}`);
      throw new NotFoundException(String(result.error));
    }
    return result.data;
  
    });}

  async findDailyMetrics(query: Record<string, unknown> = {}){
    return safeCall(async () => {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const date = query.date as string | undefined;
    const result = await this.repo.findDailyMetrics(limit, (page - 1) * limit, date);
    if (!result.ok) return { data: [], pagination: { total: 0, page, limit } };
    return { data: result.data.data, pagination: { total: result.data.count, page, limit } };
  
    });}

  async findOvertime(query: Record<string, unknown> = {}){
    return safeCall(async () => {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const period = query.period as string | undefined;
    const result = await this.repo.findOvertime(limit, (page - 1) * limit, period);
    if (!result.ok) return { data: [], pagination: { total: 0, page, limit } };
    return { data: result.data.data, pagination: { total: result.data.count, page, limit } };
  
    });}

  async findCustoms(query: Record<string, unknown> = {}){
    return safeCall(async () => {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const result = await this.repo.findCustoms(limit, (page - 1) * limit);
    if (!result.ok) return { data: [], pagination: { total: 0, page, limit } };
    return { data: result.data.data, pagination: { total: result.data.count, page, limit } };
  
    });}

  async findInsurance(query: Record<string, unknown> = {}){
    return safeCall(async () => {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const result = await this.repo.findInsurance(limit, (page - 1) * limit);
    if (!result.ok) return { data: [], pagination: { total: 0, page, limit } };
    return { data: result.data.data, pagination: { total: result.data.count, page, limit } };
  
    });}
}
