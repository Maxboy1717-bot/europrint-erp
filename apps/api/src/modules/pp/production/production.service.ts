/**
 * @module production.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { ProductionRepository } from './production.repository';

@Injectable()
export class ProductionService {
  constructor(private readonly repo: ProductionRepository) {}

  async listShiftReports(page: number, limit: number): Promise<Result<object, AppError>> {
    return safeCall(() => this.repo.listShiftReports(limit, (page - 1) * limit));
  }

  async getShiftReport(id: number) {
    return this.repo.getShiftReport(id);
  }

  async createShiftReport(body: Record<string, unknown>) {
    return this.repo.createShiftReport(body);
  }

  async updateShiftReport(id: number, body: Record<string, unknown>) {
    return this.repo.updateShiftReport(id, body);
  }

  async closeShiftReport(id: number, body: Record<string, unknown>) {
    return this.repo.closeShiftReport(id, body);
  }

  async addShiftDowntime(id: number, body: Record<string, unknown>) {
    return this.repo.addShiftDowntime(id, body);
  }

  async weeklyReport(start: string, end: string) {
    return this.repo.weeklyReport(start, end);
  }

  async getProductionStats() {
    return this.repo.getProductionStats();
  }

  async getOrder360Card(id: number) {
    return this.repo.getOrder360Card(id);
  }
}
