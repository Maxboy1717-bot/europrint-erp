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
    const rawPage  = Number(query.page);
    const rawLimit = Number(query.limit);
    const page  = Number.isFinite(rawPage)  && rawPage  > 0 ? Math.floor(rawPage)  : 1;
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(Math.floor(rawLimit), 200) : 10;
    const result = await this.maintenanceSvcRepo.findAll();
    if (!result.ok) throw new InternalServerErrorException(result.error);
    const rows = result.data;
    const total = rows.length;
    const data = (rows as Record<string, unknown>[]).slice((page - 1) * limit, page * limit).map((r) => this.mapRow(r));
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

  async listCanteenLogs(logDate?: string): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await this.maintenanceSvcRepo.listCanteenLogs(logDate);
      if (!result.ok) { this.logger.warn(`listCanteenLogs: ${result.error}`); return []; }
      return result.data;
    });
  }

  async createCanteenLog(dto: Record<string, unknown>): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await this.maintenanceSvcRepo.createCanteenLog(dto);
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return result.data;
    });
  }

  async updateCanteenLog(id: number, dto: Record<string, unknown>): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await this.maintenanceSvcRepo.updateCanteenLog(id, dto);
      if (!result.ok) throw new NotFoundException(String(result.error));
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

  // ─── FAZA "Sozlama har bo'limda" (2026-07-01) — MRO sozlama-hub ───────────
  async getSettings(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await this.maintenanceSvcRepo.getSettings();
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return { items: result.data };
    });
  }

  async saveSettings(entries: Record<string, string>): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await this.maintenanceSvcRepo.saveSettings(entries);
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return result.data;
    });
  }

  async patchSetting(id: string, value: string): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await this.maintenanceSvcRepo.patchSetting(id, value);
      if (!result.ok) throw new NotFoundException(String(result.error));
      return result.data;
    });
  }
}
