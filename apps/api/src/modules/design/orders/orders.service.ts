/**
 * @module orders.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, InternalServerErrorException, Inject, Logger } from '@nestjs/common';
import { IDesignOrdersSvcRepository, DESIGN_ORDERS_SVC_REPO } from './i-design-orders-svc.repo';
import { safeCall, Result, AppError } from '@common/result';

const DB_TO_API: Record<string, string> = {
  new: 'pending',
  designer_review: 'in_progress',
  waiting_customer_approval: 'in_progress',
  approved: 'approved',
  rejected: 'rejected',
  archived: 'rejected',
};

const API_TO_DB: Record<string, string> = Object.fromEntries(
  Object.entries(DB_TO_API).map(([k,v]) => [v,k])
);

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(@Inject(DESIGN_ORDERS_SVC_REPO) private readonly designOrdersSvcRepo: IDesignOrdersSvcRepository) {}
  toApiStatus(dbStatus: string) { return DB_TO_API[dbStatus] || dbStatus; }
  toDbStatus(apiStatus: string) { return API_TO_DB[apiStatus] || apiStatus; }

  async findAll(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const rawPage  = Number(query.page);
      const rawLimit = Number(query.limit);
      const page  = Number.isFinite(rawPage)  && rawPage  > 0 ? Math.floor(rawPage)  : 1;
      const lim   = Math.min(200, Number.isFinite(rawLimit) && rawLimit > 0 ? Math.floor(rawLimit) : 10);
      const totalR = await this.designOrdersSvcRepo.count();
      if (!totalR.ok) throw new InternalServerErrorException(totalR.error);
      const total = totalR.data;
      const result = await this.designOrdersSvcRepo.findAll({ limit: lim, offset: (page - 1) * lim });
      if (!result.ok) throw new InternalServerErrorException(result.error);
      const data = (result.data as Record<string, unknown>[]).map((o) => ({ ...o, status: this.toApiStatus(String(o['status'] ?? '')) }));
      return { data, total, page, limit: lim };
    });}

  async findOne(id: number){
    return safeCall(async () => {
    const result = await this.designOrdersSvcRepo.findById(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    if (!result.data) throw new NotFoundException(`Dizayn buyurtma #${id} topilmadi`);
    const row = result.data;
    return { ...row, status: this.toApiStatus((row).status) };
  
    });}

  async create(dto: Record<string, unknown>){
    return safeCall(async () => {
    this.logger.log(`orders: yaratilmoqda`);
    const result = await this.designOrdersSvcRepo.create(dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    const created = result.data;
    return { ...(created as Record<string, unknown>), status: this.toApiStatus(String((created as Record<string, unknown>).status ?? 'new')) };
  
    });}

  async updateStatus(id: number, apiStatus: string){
    return safeCall(async () => {
    this.logger.log(`orders: yangilanmoqda`);
    const dbStatus = this.toDbStatus(apiStatus);
    const result = await this.designOrdersSvcRepo.updateStatus(id, dbStatus);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return { ...((result as Record<string, unknown>).data as Record<string, unknown>), status: apiStatus };
  
    });}
}
