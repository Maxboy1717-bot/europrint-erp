import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { ErpReportsRepository } from './erp-reports.repository';

@Injectable()
export class ErpReportsService {
  constructor(private readonly repo: ErpReportsRepository) {}

  async listDailyReports(page: number, limit: number): Promise<Result<object, AppError>> {
    return safeCall(() => this.repo.listDailyReports(limit, (page - 1) * limit));
  }

  async getDailyReport(id: number) {
    return this.repo.getDailyReport(id);
  }

  async listProductionFacts(page: number, limit: number) {
    return safeCall(() => this.repo.listProductionFacts(limit, (page - 1) * limit));
  }

  async listProductionPlans(page: number, limit: number) {
    return safeCall(() => this.repo.listProductionPlans(limit, (page - 1) * limit));
  }

  async updateProductionPlan(id: number, body: Record<string, unknown>) {
    return this.repo.updateProductionPlan(id, body);
  }

  async listDowntimeLogs(page: number, limit: number) {
    return safeCall(() => this.repo.listDowntimeLogs(limit, (page - 1) * limit));
  }

  async getDowntimeLog(id: number) {
    return this.repo.getDowntimeLog(id);
  }

  async updateDowntimeLog(id: number, body: Record<string, unknown>) {
    return this.repo.updateDowntimeLog(id, body);
  }

  async getCapacity() {
    return this.repo.getCapacity();
  }

  async capacityLoadAnalysis() {
    return this.repo.capacityLoadAnalysis();
  }

  async listShiftCalendars() {
    return this.repo.listShiftCalendars();
  }

  async listEmployeeWorkCenters(limit: number) {
    return this.repo.listEmployeeWorkCenters(limit);
  }

  async getEmployeeWorkCenter(id: number) {
    return this.repo.getEmployeeWorkCenter(id);
  }

  async workCenterCapacity() {
    return this.repo.workCenterCapacity();
  }
}
