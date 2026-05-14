/**
 * @module contacts.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger, NotFoundException, InternalServerErrorException, Inject } from '@nestjs/common';
import { ICrmContactsRepository, CRM_CONTACTS_REPO } from './i-crm-contacts.repo';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class ContactsService {
  private readonly logger = new Logger(ContactsService.name);

  constructor(@Inject(CRM_CONTACTS_REPO) private readonly crmContactsRepo: ICrmContactsRepository) {}

  async findAll(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const MAX_PAGE_LIMIT = 100;
    const page = Number((query.page as number | undefined) ?? 1);
    const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, Number((query.limit as number | undefined) ?? 10)));
    const offset = (page - 1) * limit;
    const result = await this.crmContactsRepo.findAll(limit, offset);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    const { data, count: total } = result.data;
    return { data, total, page, limit };
  
    });}

  async findOne(id: number) {
    const result = await this.crmContactsRepo.findById(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    if (!result.data) throw new NotFoundException(`#${id} topilmadi`);
    return result.data;
  }

  async create(dto: Record<string, unknown>, createdBy?: number){
    return safeCall(async () => {
    const result = await this.crmContactsRepo.create(dto, createdBy);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async update(id: number, dto: Record<string, unknown>){
    return safeCall(async () => {
    this.logger.log(`contacts: yangilanmoqda`);
    await this.findOne(id);
    const result = await this.crmContactsRepo.update(id, dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async remove(id: number){
    return safeCall(async () => {
    this.logger.log(`contacts: o'chirilmoqda`);
    await this.findOne(id);
    const result = await this.crmContactsRepo.softDelete(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return { message: "O'chirildi" };
  
    });}
}
