/**
 * @module erp-extra.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { ErpExtraRepository } from './erp-extra.repository';

@Injectable()
export class ErpExtraService {
  constructor(private readonly repo: ErpExtraRepository) {}

  async listWorkCenters(page: number, limit: number): Promise<Result<object, AppError>> {
    return safeCall(() => this.repo.listWorkCenters(limit, (page - 1) * limit));
  }

  async getWorkCenter(id: number) {
    return this.repo.getWorkCenter(id);
  }

  async updateWorkCenter(id: number, body: Record<string, unknown>) {
    return this.repo.updateWorkCenter(id, body);
  }

  async getWorkCenterStats(id: number, _dateRange: string) {
    return this.repo.getWorkCenterStats(id);
  }

  async listOrders(page: number, limit: number, status?: string) {
    return safeCall(() => this.repo.listOrders(limit, (page - 1) * limit, status));
  }

  async getOrder(id: number) {
    return this.repo.getOrder(id);
  }

  async updateOrder(id: number, body: Record<string, unknown>) {
    return this.repo.updateOrder(id, body);
  }

  async listMrpRuns(page: number, limit: number) {
    return safeCall(() => this.repo.listMrpRuns(limit, (page - 1) * limit));
  }

  async createMrpRun(body: Record<string, unknown>) {
    return this.repo.createMrpRun(body);
  }

  async calculateMrpRun(runId: number) {
    return this.repo.calculateMrpRun(runId);
  }

  async listMrpResults(runId?: number) {
    return this.repo.listMrpResults(runId);
  }

  async listPurchaseRequisitions(page: number, limit: number) {
    return safeCall(() => this.repo.listPurchaseRequisitions(limit, (page - 1) * limit));
  }

  async listDashboardStats() {
    return this.repo.listDashboardStats();
  }

  async createOrder(body: Record<string, unknown>) { return this.repo.createOrder(body); }
  async deleteOrder(id: number) { return this.repo.deleteOrder(id); }
  async createWorkCenter(body: Record<string, unknown>) { return this.repo.createWorkCenter(body); }
  async deleteWorkCenter(id: number) { return this.repo.deleteWorkCenter(id); }
}
