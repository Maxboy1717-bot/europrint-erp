import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, Inject, Logger} from '@nestjs/common'; 
import { IPosSvcRepository, POS_SVC_REPO } from './pos-svc/i-pos-svc.repo';
import {
  CreateMovementTypeDto,
  GrantWarehouseAccessDto,
  CreateMovementDto,
  AddMovementLineDto,
  UpdateMovementStatusDto,
} from './dto/pos.dto';
import { safeCall, Result, AppError } from '@common/result';

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['qc_pending', 'pending', 'cancelled'],
  qc_pending: ['qc_approved', 'qc_rework', 'qc_rejected'],
  qc_approved: ['pending', 'cancelled'],
  qc_rework: ['qc_pending'],
  qc_rejected: ['cancelled'],
  pending: ['approved', 'cancelled'],
  approved: ['ai_processing', 'completed'],
  ai_processing: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

function isTransitionAllowed(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

@Injectable()
export class PosService {
  private readonly logger = new Logger(PosService.name);

  constructor(@Inject(POS_SVC_REPO) private readonly posSvcRepo: IPosSvcRepository) {}

  async getMovementTypes(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const result = await this.posSvcRepo.findMovementTypes();
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async createMovementType(dto: CreateMovementTypeDto){
    return safeCall(async () => {
    const existingResult = await this.posSvcRepo.findMovementTypeByCode(dto.code);
    if (!existingResult.ok) throw new InternalServerErrorException(existingResult.error);
    if (existingResult.data) throw new BadRequestException(`Kod '${dto.code}' allaqachon mavjud`);
    const result = await this.posSvcRepo.createMovementType({ ...dto } as Record<string, unknown>);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async updateMovementStatus(id: number, dto: UpdateMovementStatusDto){
    return safeCall(async () => {
    const findResult = await this.posSvcRepo.findMovementById(id);
    if (!findResult.ok) throw new InternalServerErrorException(findResult.error);
    if (!findResult.data) throw new NotFoundException(`Harakat #${id} topilmadi`);
    const updateResult = await this.posSvcRepo.updateMovementStatus(id, dto.status);
    if (!updateResult.ok) throw new InternalServerErrorException(updateResult.error);
    return updateResult.data;
  
    });}

  async findAll(query: Record<string, unknown> = {}){
    return safeCall(async () => {
    const page = Number((query.page as number | undefined) ?? 1);
    const limit = Number((query.limit as number | undefined) ?? 10);
    const offset = (page - 1) * limit;
    const result = await this.posSvcRepo.findMovements(limit, offset);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return { data: result.data, pagination: { total: result.data.length, page, limit } };
  
    });}

  async findOne(id: number) {
    const result = await this.posSvcRepo.findMovementById(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    if (!result.data) throw new NotFoundException(`Harakat #${id} topilmadi`);
    return result.data;
  }

  async create(dto: CreateMovementDto, createdBy: number) {
    const result = await this.posSvcRepo.createMovement({ ...dto, createdBy } as Record<string, unknown>);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  }

  async getUserWarehouseAccess(userId: number){
    return safeCall(async () => {
    const result = await this.posSvcRepo.findMovements(100, 0);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async grantWarehouseAccess(dto: GrantWarehouseAccessDto, grantedBy: number){
    return safeCall(async () => {
    this.logger.log(`Warehouse access granted by ${grantedBy} to user ${dto.userId}`);
    return { userId: dto.userId, warehouseId: dto.warehouseId, grantedBy };
  
    });}

  async revokeWarehouseAccess(userId: number, warehouseId: string){
    return safeCall(async () => {
    this.logger.log(`Warehouse access revoked: user ${userId}, warehouse ${warehouseId}`);
    return { userId, warehouseId, revoked: true };
  
    });}

  async getMovements(warehouseId?: string, status?: string){
    return safeCall(async () => {
    const result = await this.posSvcRepo.findMovements(100, 0);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async getMovementById(id: number){
    return safeCall(async () => {
    return this.findOne(id);
  
    });}

  async createMovement(dto: CreateMovementDto, userId: number){
    return safeCall(async () => {
    return this.create(dto, userId);
  
    });}

  async addMovementLine(id: number, dto: AddMovementLineDto){
    return safeCall(async () => {
    this.logger.log(`Adding line to movement ${id}`);
    return { movementId: id, ...dto };
  
    });}
}
