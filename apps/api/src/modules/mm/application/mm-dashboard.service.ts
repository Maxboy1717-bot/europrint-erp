import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { MmDashboardRepository } from './mm-dashboard.repository';

@Injectable()
export class MmDashboardService {
  constructor(private readonly repo: MmDashboardRepository) {}

  async getDashboard(): Promise<Result<object, AppError>> {
    return this.repo.getDashboardStats();
  }

  async getVendorRatings() {
    return this.repo.getVendorRatings();
  }

  async getMrpResults(materialId?: number) {
    return this.repo.getMrpResults(materialId);
  }

  async runMrp() {
    return safeCall(async () => {
      const processed = await this.repo.runMrp();
      return { processed, calculated_at: _time.now() };
    });
  }

  async getFleetVehicles() {
    return this.repo.getFleetVehicles();
  }

  async createFleetVehicle(body: Record<string, unknown>) {
    return this.repo.createFleetVehicle(body);
  }

  async getFuelLogs(vehicleId?: number) {
    return this.repo.getFuelLogs(vehicleId);
  }

  async createFuelLog(body: Record<string, unknown>, userId: number | null) {
    return this.repo.createFuelLog(body, userId);
  }

  async getSupplierPerformance() {
    return this.repo.getSupplierPerformance();
  }

  async getPriceHistory(materialId: number) {
    return this.repo.getPriceHistory(materialId);
  }
}
