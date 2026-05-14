/**
 * @module maintenance.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, InternalServerErrorException, Inject, Logger} from '@nestjs/common'; 
import { IMaintenanceSvcRepository, MAINTENANCE_SVC_REPO } from './i-maintenance-svc.repo';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(@Inject(MAINTENANCE_SVC_REPO) private readonly maintenanceSvcRepo: IMaintenanceSvcRepository) {}
  normalizeType(type: string): string { return type?.toUpperCase() || 'CORRECTIVE'; }

  private mapRow(r: Record<string, unknown>) {
    return {
      ...r,
      assetName: r.equipmentName,
      type: this.normalizeType(String(r.maintenanceType || r.type)),
      cost: Number(r.cost) || 0,
    };
  }

  async findAll(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const { page = 1, limit = 10 } = query;
    const result = await this.maintenanceSvcRepo.findAll();
    if (!result.ok) throw new InternalServerErrorException(result.error);
    const rows = result.data;
    const total = rows.length;
    const data = (rows as Record<string, unknown>[]).slice((Number(page) - 1) * Number(limit), Number(page) * Number(limit)).map((r) => this.mapRow(r));
    return { data, total, page, limit };
  
    });}

  async findOne(id: number){
    return safeCall(async () => {
    const result = await this.maintenanceSvcRepo.findById(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    if (!result.data) throw new NotFoundException(`Ta'mirlash #${id} topilmadi`);
    return this.mapRow(result.data);
  
    });}

  async create(dto: Record<string, unknown>){
    return safeCall(async () => {
    const equipmentName = dto.equipmentName || (dto.assetId ? `Asset #${dto.assetId}` : 'Equipment');
    const result = await this.maintenanceSvcRepo.create({
      ...dto,
      equipmentName,
      maintenanceType: this.normalizeType(String(dto.type || dto.maintenanceType)),
      status: 'scheduled',
    });
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async getStats(){
    return safeCall(async () => {
    const result = await this.maintenanceSvcRepo.findAll();
    if (!result.ok) throw new InternalServerErrorException(result.error);
    const rows = result.data as Record<string, unknown>[];
    const total = rows.length;
    const scheduled  = rows.filter((r) => r['status'] === 'scheduled').length;
    const inProgress = rows.filter((r) => r['status'] === 'in_progress').length;
    const completed  = rows.filter((r) => r['status'] === 'completed').length;
    const overdue    = rows.filter((r) => r['status'] === 'overdue').length;
    return { total, scheduled, inProgress, completed, overdue };

    });}

  async findEquipment(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 50);
    const result = await this.maintenanceSvcRepo.findEquipment(limit, (page - 1) * limit);
    if (!result.ok) { this.logger.warn(`findEquipment: ${result.error}`); return []; }
    return result.data.data;
    });}

  async createEquipment(dto: Record<string, unknown>): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const result = await this.maintenanceSvcRepo.createEquipment(dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
    });}

  async updateEquipmentStatus(id: number, status: string): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const result = await this.maintenanceSvcRepo.updateEquipmentStatus(id, status);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
    });}

  async findFacilities(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await this.maintenanceSvcRepo.findFacilities();
      if (!result.ok) { this.logger.warn(`findFacilities: ${result.error}`); return { items: [] }; }
      return { items: result.data };
    });
  }

  async findCleaningSchedules(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await this.maintenanceSvcRepo.findCleaningSchedules();
      if (!result.ok) { this.logger.warn(`findCleaningSchedules: ${result.error}`); return { items: [] }; }
      return { items: result.data };
    });
  }

  async findPmSchedules(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await this.maintenanceSvcRepo.findPmSchedules();
      if (!result.ok) { this.logger.warn(`findPmSchedules: ${result.error}`); return { items: [] }; }
      return { items: result.data };
    });
  }

  async findUtilityReadings(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await this.maintenanceSvcRepo.findUtilityReadings();
      if (!result.ok) { this.logger.warn(`findUtilityReadings: ${result.error}`); return { items: [] }; }
      return { items: result.data };
    });
  }

  async getCanteenStats(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await this.maintenanceSvcRepo.getCanteenStats();
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return result.data;
    });
  }

  async findSpareParts(search?: string): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await this.maintenanceSvcRepo.findSpareParts(search);
      if (!result.ok) { this.logger.warn(`findSpareParts: ${result.error}`); return { items: [] }; }
      return { items: result.data };
    });
  }
}
