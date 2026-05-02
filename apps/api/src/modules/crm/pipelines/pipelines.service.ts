import { Injectable, NotFoundException, InternalServerErrorException, Inject, Logger } from '@nestjs/common';
import { ICrmPipelinesRepository, CRM_PIPELINES_REPO } from './i-crm-pipelines.repo';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class PipelinesService {
  private readonly logger = new Logger(PipelinesService.name);

  constructor(@Inject(CRM_PIPELINES_REPO) private readonly crmPipelinesRepo: ICrmPipelinesRepository) {}

  async findAll(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const result = await this.crmPipelinesRepo.findAll();
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async findOne(id: number){
    return safeCall(async () => {
    const result = await this.crmPipelinesRepo.findById(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    if (!result.data) throw new NotFoundException(`Pipeline #${id} topilmadi`);
    const stagesResult = await this.crmPipelinesRepo.findStagesByCategoryId(id);
    if (!stagesResult.ok) throw new InternalServerErrorException(stagesResult.error);
    return { ...(result.data as Record<string, unknown>), stages: stagesResult.data };
  
    });}

  async create(dto: Record<string, unknown>){
    return safeCall(async () => {
    const result = await this.crmPipelinesRepo.create(dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async update(id: number, dto: Record<string, unknown>){
    return safeCall(async () => {
    const result = await this.crmPipelinesRepo.update(id, dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async remove(id: number){
    return safeCall(async () => {
    const result = await this.crmPipelinesRepo.remove(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return { message: "O'chirildi" };
  
    });}
}
