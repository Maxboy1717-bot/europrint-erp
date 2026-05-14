/**
 * @module routings.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, InternalServerErrorException, Inject } from '@nestjs/common';
import { IPpRoutingsRepository, PP_ROUTINGS_REPO } from './i-pp-routings.repo';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class RoutingsService {

  constructor(@Inject(PP_ROUTINGS_REPO) private readonly ppRoutingsRepo: IPpRoutingsRepository) {}

  async findAll(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const page = Number((query.page as number | undefined) ?? 1);
    const limit = Number((query.limit as number | undefined) ?? 10);
    const offset = (page - 1) * limit;
    const result = await this.ppRoutingsRepo.findAll(limit, offset);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    const { data, count: total } = result.data;
    return { data, pagination: { total, page, limit } };
  
    });}

  async findOne(id: number) {
    const result = await this.ppRoutingsRepo.findById(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    if (!result.data) throw new NotFoundException(`Routing #${id} topilmadi`);
    const opsResult = await this.ppRoutingsRepo.findOperationsByRoutingId(String(id));
    if (!opsResult.ok) throw new InternalServerErrorException(opsResult.error);
    return { ...result.data, operations: opsResult.data };
  }

  async create(dto: Record<string, unknown>){
    return safeCall(async () => {
    const result = await this.ppRoutingsRepo.create(dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async update(id: number, dto: Record<string, unknown>){
    return safeCall(async () => {
    await this.findOne(id);
    const result = await this.ppRoutingsRepo.update(id, dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;

    });}

  async remove(id: number){
    return safeCall(async () => {
    await this.findOne(id);
    const result = await this.ppRoutingsRepo.softDelete(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return { message: "O'chirildi" };

    });}
}
