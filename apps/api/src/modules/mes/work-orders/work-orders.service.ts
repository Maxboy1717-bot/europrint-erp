import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, Inject, Logger} from '@nestjs/common'; 
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IWorkOrdersRepository, WORK_ORDERS_REPO } from './i-work-orders.repo';
import { ERP_EVENTS } from '../../../common/constants/erp-events.constants';
import { isTransitionAllowed, MES_TRANSITIONS } from '../../../common/constants/status-machines.constants';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class WorkOrdersService {
  private readonly logger = new Logger(WorkOrdersService.name);

  constructor(
    @Inject(WORK_ORDERS_REPO) private readonly workOrdersRepo: IWorkOrdersRepository,
    private eventEmitter?: EventEmitter2,
  ) {}

  async findAll(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const page = Number(query['page'] ?? 1);
    const limit = Number(query['limit'] ?? 10);
    const offset = (page - 1) * limit;
    const result = await this.workOrdersRepo.findAll(limit, offset);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    const { data, count: total } = result.data;
    const totalPages = Math.ceil(total / limit);
    return { data, pagination: { total, page, limit, totalPages } };
  
    });}

  async findOne(id: number){
    return safeCall(async () => {
    const result = await this.workOrdersRepo.findById(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    const wo = result.data;
    if (!wo) throw new NotFoundException(`Ish buyurtmasi #${id} topilmadi`);
    const [sessResult, crewResult] = await Promise.all([
      this.workOrdersRepo.findSessionsByOrderId(id),
      this.workOrdersRepo.findCrewsByOrderId(id),
    ]);
    const sessions = sessResult.ok ? sessResult.data : [];
    const crews = crewResult.ok ? crewResult.data : [];
    return { ...wo, sessions, crews };
  
    });}

  async create(dto: Record<string, unknown>){
    return safeCall(async () => {
    const result = await this.workOrdersRepo.create(dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async updateStatus(id: number, newStatus: string){
    return safeCall(async () => {
    const findResult = await this.workOrdersRepo.findById(id);
    if (!findResult.ok) throw new InternalServerErrorException(findResult.error);
    const wo = findResult.data;
    if (!wo) throw new NotFoundException(`Ish buyurtmasi #${id} topilmadi`);
    const updateResult = await this.workOrdersRepo.updateStatus(id, newStatus);
    if (!updateResult.ok) throw new InternalServerErrorException(updateResult.error);
    return updateResult.data;
  
    });}
}
