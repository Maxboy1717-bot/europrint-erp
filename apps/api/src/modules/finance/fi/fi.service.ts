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
}
