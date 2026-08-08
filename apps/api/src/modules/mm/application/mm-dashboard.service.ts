/**
 * @module mm-dashboard.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Inject, Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { MM_DASHBOARD_REPO, type IMmDashboardRepo } from '../domain/repositories/i-mm-dashboard.repo';

@Injectable()
export class MmDashboardService {
  constructor(@Inject(MM_DASHBOARD_REPO) private readonly repo: IMmDashboardRepo) {}

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

  async getFleetMaintenance() {
    return this.repo.getFleetMaintenance();
  }

  async getVehicleLocations() {
    return this.repo.getVehicleLocations();
  }

  async getDriverExpenses() {
    return this.repo.getDriverExpenses();
  }

  async getVendorInvoices() {
    return this.repo.getVendorInvoices();
  }

  async getVendorInvoiceById(id: number) {
    return this.repo.getVendorInvoiceById(id);
  }

  async getThreeWayMatch() {
    return this.repo.getThreeWayMatch();
  }

  async getFleetDeliveries() {
    return this.repo.getFleetDeliveries();
  }

  async createFleetDelivery(body: Record<string, unknown>) {
    return this.repo.createFleetDelivery(body);
  }

  async updateFleetDeliveryStatus(id: number, status: string) {
    return this.repo.updateFleetDeliveryStatus(id, status);
  }
}
