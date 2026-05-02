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
}
