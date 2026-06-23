/**
 * @module bom.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, InternalServerErrorException, Inject, Logger} from '@nestjs/common'; 
import { IPpBomRepository, PP_BOM_REPO } from './i-pp-bom.repo';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class BomService {
  private readonly logger = new Logger(BomService.name);

  constructor(@Inject(PP_BOM_REPO) private readonly ppBomRepo: IPpBomRepository) {}

  async findAll(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const page = Number((query.page as number | undefined) ?? 1);
    const limit = Number((query.limit as number | undefined) ?? 10);
    const offset = (page - 1) * limit;
    const result = await this.ppBomRepo.findAll(limit, offset);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    const { data, count: total } = result.data;
    return { data, pagination: { total, page, limit } };
  
    });}

  async findOne(id: number) {
    const result = await this.ppBomRepo.findById(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    if (!result.data) throw new NotFoundException(`BOM #${id} topilmadi`);
    const itemsResult = await this.ppBomRepo.findItemsByBomId(id);
    if (!itemsResult.ok) throw new InternalServerErrorException(itemsResult.error);
    return { ...result.data, items: itemsResult.data };
  }

  async create(dto: Record<string, unknown>){
    return safeCall(async () => {
    const result = await this.ppBomRepo.create(dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async findItems(bomId: number): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await this.ppBomRepo.findItemsByBomId(bomId);
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return result.data;
    });
  }

  async addItem(bomId: number, dto: Record<string, unknown>): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await this.ppBomRepo.addItem(bomId, dto);
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return result.data;
    });
  }

  async removeItem(itemId: number): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await this.ppBomRepo.removeItem(itemId);
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return { deleted: true, id: itemId };
    });
  }

  async update(id: number, dto: Record<string, unknown>){
    return safeCall(async () => {
    await this.findOne(id);
    const result = await this.ppBomRepo.update(id, dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async approve(id: number){
    return safeCall(async () => {
    await this.findOne(id);
    const result = await this.ppBomRepo.approve(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async remove(id: number){
    return safeCall(async () => {
    await this.findOne(id);
    const result = await this.ppBomRepo.softDelete(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return { message: "O'chirildi" };
  
    });}
}
