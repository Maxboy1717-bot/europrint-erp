/**
 * warehouse-employees.service.ts
 * Har omborga xodim biriktirish va ro'yxat olish.
 */
import { Injectable, Logger } from '@nestjs/common';
import { Result, Err, AppError } from '@common/result';
import { WarehouseEmployeesRepository, type WarehouseEmployee } from '../../infrastructure/repositories/warehouse-employees.repository';

// Re-export the interface so controllers/other services can import from here
export type { WarehouseEmployee };

@Injectable()
export class WarehouseEmployeesService {
  private readonly logger = new Logger(WarehouseEmployeesService.name);

  constructor(private readonly repo: WarehouseEmployeesRepository) {}

  async listByWarehouse(warehouseId: number): Promise<Result<WarehouseEmployee[], AppError>> {
    return this.repo.listByWarehouse(warehouseId);
  }

  async listByUser(userId: number): Promise<Result<WarehouseEmployee[], AppError>> {
    return this.repo.listByUser(userId);
  }

  async assign(dto: {
    warehouseId: number;
    userId:      number;
    role:        'manager' | 'staff' | 'keeper' | 'qc_inspector' | 'observer';
    isPrimary?:  boolean;
    assignedBy:  number;
    notes?:      string;
  }): Promise<Result<{ id: number }, AppError>> {
    const conflictR = await this.repo.findConflict(dto.warehouseId, dto.userId);
    if (!conflictR.ok) return { ok: false, error: conflictR.error };
    if (conflictR.data) {
      return Err({ message: 'Xodim allaqachon bu omborga biriktirilgan', code: 'CONFLICT' });
    }
    const result = await this.repo.insert({ ...dto, isPrimary: dto.isPrimary ?? false });
    if (result.ok) {
      this.logger.log(`Xodim ${dto.userId} → ombor ${dto.warehouseId} biriktirildi (id=${result.data.id})`);
    }
    return result;
  }

  async remove(employeeAssignmentId: number, removedBy: number): Promise<Result<void, AppError>> {
    return this.repo.softDelete(employeeAssignmentId, removedBy);
  }
}
