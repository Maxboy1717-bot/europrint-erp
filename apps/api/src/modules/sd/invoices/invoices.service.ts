/**
 * @module invoices.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, InternalServerErrorException, Inject, Logger } from '@nestjs/common';
import { ISdInvoicesRepository, SD_INVOICES_REPO } from './i-sd-invoices.repo';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(@Inject(SD_INVOICES_REPO) private readonly sdInvoicesRepo: ISdInvoicesRepository) {}

  async findAll(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const page = Number((query.page as number | undefined) ?? 1);
    const limit = Number((query.limit as number | undefined) ?? 10);
    const offset = (page - 1) * limit;
    const result = await this.sdInvoicesRepo.findAll(limit, offset);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    const { data, count: total } = result.data;
    return { data, pagination: { total, page, limit } };
  
    });}

  async findOne(id: number){
    return safeCall(async () => {
    const result = await this.sdInvoicesRepo.findById(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    if (!result.data) throw new NotFoundException(`Hisob-faktura #${id} topilmadi`);
    return result.data;
  
    });}

  async create(dto: Record<string, unknown>, createdBy?: number){
    return safeCall(async () => {
    const result = await this.sdInvoicesRepo.create(dto, createdBy);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}
}
