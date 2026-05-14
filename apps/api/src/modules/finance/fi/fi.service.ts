/**
 * @module fi.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger, NotFoundException, InternalServerErrorException, Inject } from '@nestjs/common';
import { IFiRepository, FI_REPO } from './i-fi.repo';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class FiService {
  private readonly logger = new Logger(FiService.name);
  constructor(@Inject(FI_REPO) private readonly repo: IFiRepository) {}

  async findAccountingPeriods(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const result = await this.repo.findAccountingPeriods(limit, (page - 1) * limit);
    if (!result.ok) { this.logger.warn(`findAccountingPeriods: ${result.error}`); return { data: [], pagination: { total: 0, page, limit } }; }
    return { data: result.data.data, pagination: { total: result.data.count, page, limit } };
  
    });}

  async createAccountingPeriod(dto: Record<string, unknown>){
    return safeCall(async () => {
    const result = await this.repo.createAccountingPeriod(dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async closeAccountingPeriod(id: number){
    return safeCall(async () => {
    const result = await this.repo.closeAccountingPeriod(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    if (!result.data) throw new NotFoundException(`Hisob davri #${id} topilmadi`);
    return result.data;
  
    });}

  async postGlDocument(id: number){
    return safeCall(async () => {
    const result = await this.repo.postGlDocument(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    if (!result.data) throw new NotFoundException(`GL hujjat #${id} topilmadi`);
    return result.data;
  
    });}

  async findPayments(query: Record<string, unknown> = {}){
    return safeCall(async () => {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const result = await this.repo.findPayments(limit, (page - 1) * limit);
    if (!result.ok) { this.logger.warn(`findPayments: ${result.error}`); return { data: [], pagination: { total: 0, page, limit } }; }
    return { data: result.data.data, pagination: { total: result.data.count, page, limit } };
  
    });}

  async createPayment(dto: Record<string, unknown>){
    return safeCall(async () => {
    const result = await this.repo.createPayment(dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;

    });}

  async getCostCenters(): Promise<Array<{ id: string; name: string; code: string }>> {
    // Cost centers are a relatively stable config; return from repo or fallback defaults
    try {
      const result = await this.repo.getCostCenters();
      if (result.ok && Array.isArray(result.data)) return result.data as Array<{ id: string; name: string; code: string }>;
    } catch (_e) {
      this.logger.warn('getCostCenters: using defaults');
    }
    return [
      { id: '1', name: "Ishlab chiqarish", code: "CC-001" },
      { id: '2', name: "Sotish va Marketing", code: "CC-002" },
      { id: '3', name: "Umumiy va Ma'muriy", code: "CC-003" },
      { id: '4', name: "IT va Texnologiya", code: "CC-004" },
    ];
  }

  async createCostCenter(dto: Record<string, unknown>): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await this.repo.createCostCenter(dto);
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return result.data;
    });
  }

  async updateCostCenter(id: number, dto: Record<string, unknown>): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await this.repo.updateCostCenter(id, dto);
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return result.data;
    });
  }

  async deleteCostCenter(id: number): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await this.repo.deleteCostCenter(id);
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return { success: true };
    });
  }

  async getStats(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await this.repo.getStats();
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return result.data;
    });
  }

  async getRecentTransactions(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await this.repo.getRecentTransactions(20);
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return result.data;
    });
  }

  async findGlDocuments(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const page = Number(query.page ?? 1);
      const limit = Number(query.limit ?? 20);
      const result = await this.repo.findGlDocuments(limit, (page - 1) * limit);
      if (!result.ok) { this.logger.warn(`findGlDocuments: ${result.error}`); return { data: [], pagination: { total: 0, page, limit } }; }
      return { data: result.data.data, pagination: { total: result.data.count, page, limit } };
    });
  }

  async createGlDoc(dto: Record<string, unknown>): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await this.repo.createGlDoc(dto);
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return result.data;
    });
  }

  async findProfitCenters(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await this.repo.findProfitCenters();
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return result.data;
    });
  }

  async createProfitCenter(dto: Record<string, unknown>): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await this.repo.createProfitCenter(dto);
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return result.data;
    });
  }

  async updateProfitCenter(id: number, dto: Record<string, unknown>): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await this.repo.updateProfitCenter(id, dto);
      if (!result.ok) throw new InternalServerErrorException(result.error);
      if (!result.data) throw new NotFoundException(`Foyda markazi #${id} topilmadi`);
      return result.data;
    });
  }

  async deleteProfitCenter(id: number): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await this.repo.deleteProfitCenter(id);
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return { success: true };
    });
  }
}
