/**
 * @module defects.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, InternalServerErrorException, Inject, Logger} from '@nestjs/common'; 
import { IDefectsRepository, DEFECTS_REPO } from './i-defects.repo';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class DefectsService {
  private readonly logger = new Logger(DefectsService.name);

  constructor(@Inject(DEFECTS_REPO) private readonly defectsRepo: IDefectsRepository) {}

  async findAllBraks(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const page = Number(query['page'] ?? 1);
    const limit = Number(query['limit'] ?? 10);
    const offset = (page - 1) * limit;
    const result = await this.defectsRepo.findAllBraks(limit, offset);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    const { data, count: total } = result.data;
    return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  
    });}

  async findOneBrak(id: number){
    return safeCall(async () => {
    const result = await this.defectsRepo.findBrakById(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    if (!result.data) throw new NotFoundException(`Brak #${id} topilmadi`);
    return result.data;
  
    });}

  async getBrakStats(){
    return safeCall(async () => {
    const result = await this.defectsRepo.getBrakStats();
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async findAllReclamations(query: Record<string, unknown> = {}){
    return safeCall(async () => {
    const page = Number(query['page'] ?? 1);
    const limit = Number(query['limit'] ?? 10);
    const offset = (page - 1) * limit;
    const result = await this.defectsRepo.findAllReclamations(limit, offset);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    const { data, count: total } = result.data;
    return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  
    });}

  async createBrak(dto: Record<string, unknown>){
    return safeCall(async () => {
    const result = await this.defectsRepo.createBrak(dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async createReclamation(dto: Record<string, unknown>){
    return safeCall(async () => {
    const result = await this.defectsRepo.createReclamation(dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}
}
