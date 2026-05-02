import { Result } from '@common/types/result.type';
import { MaintenanceOrder } from '../aggregates/maintenance-order.aggregate';

export interface IMaintenanceRepo {
  findById(id: string): Promise<Result<MaintenanceOrder | null>>;
  findAll(filters: {
    status?: string;
    priority?: string;
    assignedTo?: string;
    page?: number;
    limit?: number;
  }): Promise<Result<{ items: MaintenanceOrder[]; total: number }>>;
  findOpenByEquipment(equipmentId: string): Promise<Result<MaintenanceOrder[]>>;
  save(order: MaintenanceOrder): Promise<Result<MaintenanceOrder>>;
  update(id: string, data: Partial<MaintenanceOrder>): Promise<Result<MaintenanceOrder>>;
}

export const MAINTENANCE_REPO = Symbol('MAINTENANCE_REPO');
