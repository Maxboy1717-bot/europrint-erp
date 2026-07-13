/**
 * @module erp-reports.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

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

  async capacityLoadAnalysis(startDate?: string, endDate?: string) {
    return this.repo.capacityLoadAnalysis(startDate, endDate);
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

  async createDailyReport(body: Record<string, unknown>) { return this.repo.createDailyReport(body); }
  async updateDailyReport(id: number, body: Record<string, unknown>) { return this.repo.updateDailyReport(id, body); }
  async deleteDailyReport(id: number) { return this.repo.deleteDailyReport(id); }
  async createProductionPlan(body: Record<string, unknown>) { return this.repo.createProductionPlan(body); }
  async createProductionFact(body: Record<string, unknown>) { return this.repo.createProductionFact(body); }
  async createDowntimeLog(body: Record<string, unknown>) { return this.repo.createDowntimeLog(body); }
  async deleteDowntimeLog(id: number) { return this.repo.deleteDowntimeLog(id); }
  async createShiftCalendar(body: Record<string, unknown>) { return this.repo.createShiftCalendar(body); }
  async createEmployeeWorkCenter(body: Record<string, unknown>) { return this.repo.createEmployeeWorkCenter(body); }
  async updateEmployeeWorkCenter(id: number, body: Record<string, unknown>) { return this.repo.updateEmployeeWorkCenter(id, body); }
  async deleteEmployeeWorkCenter(id: number) { return this.repo.deleteEmployeeWorkCenter(id); }
  async updateWorkCenterCapacity(id: number, patches: Record<string, unknown>) {
    return this.repo.updateWorkCenterCapacity(id, patches);
  }
  async createWorkCenterCapacity(body: Record<string, unknown>) {
    return this.repo.createWorkCenterCapacityEntry(body);
  }
}
