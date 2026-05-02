import { Injectable, NotFoundException, InternalServerErrorException, Inject, Logger} from '@nestjs/common'; 
import { IWmsMovementsRepository, WMS_MOVEMENTS_REPO } from './i-wms-movements.repo';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class MovementsService {
  private readonly logger = new Logger(MovementsService.name);

  constructor(@Inject(WMS_MOVEMENTS_REPO) private readonly wmsMovementsRepo: IWmsMovementsRepository) {}

  async findAll(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const MAX_PAGE_LIMIT = 100;
    const page = Number((query.page as number | undefined) ?? 1);
    const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, Number((query.limit as number | undefined) ?? 10)));
    const offset = (page - 1) * limit;
    const result = await this.wmsMovementsRepo.findAll(limit, offset);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    const { data, count: total } = result.data;
    return { data, pagination: { total, page, limit } };
  
    });}

  async findOne(id: number) {
    const result = await this.wmsMovementsRepo.findById(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    if (!result.data) throw new NotFoundException(`Ko'chirish #${id} topilmadi`);
    const linesResult = await this.wmsMovementsRepo.findLinesByTransferId(id);
    if (!linesResult.ok) throw new InternalServerErrorException(linesResult.error);
    return { ...result.data, lines: linesResult.data };
  }

  async create(dto: Record<string, unknown>){
    return safeCall(async () => {
    const result = await this.wmsMovementsRepo.create(dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async confirm(id: number){
    return safeCall(async () => {
    await this.findOne(id);
    const result = await this.wmsMovementsRepo.updateStatus(id, 'confirmed');
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}
}
