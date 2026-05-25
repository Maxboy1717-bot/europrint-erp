/**
 * @module work-centers.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, InternalServerErrorException, Inject, Logger} from '@nestjs/common'; 
import { IPpWorkCentersRepository, PP_WORK_CENTERS_REPO } from './i-pp-work-centers.repo';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class WorkCentersService {
  private readonly logger = new Logger(WorkCentersService.name);

  constructor(@Inject(PP_WORK_CENTERS_REPO) private readonly ppWorkCentersRepo: IPpWorkCentersRepository) {}

  async findAll(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const result = await this.ppWorkCentersRepo.findAll();
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async findOne(id: number) {
    const result = await this.ppWorkCentersRepo.findById(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    if (!result.data) throw new NotFoundException(`Ish markazi #${id} topilmadi`);
    return result.data;
  }

  async getStats(){
    return safeCall(async () => {
    const result = await this.ppWorkCentersRepo.getStats();
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async create(dto: Record<string, unknown>, createdBy?: number){
    return safeCall(async () => {
    const result = await this.ppWorkCentersRepo.create(dto, createdBy);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async update(id: number, dto: Record<string, unknown>){
    return safeCall(async () => {
    this.logger.log(`work centers: yangilanmoqda`);
    await this.findOne(id);
    const result = await this.ppWorkCentersRepo.update(id, dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async remove(id: number){
    return safeCall(async () => {
    this.logger.log(`work centers: o'chirilmoqda`);
    await this.findOne(id);
    const result = await this.ppWorkCentersRepo.softDelete(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return { message: "O'chirildi" };
  
    });}
}
