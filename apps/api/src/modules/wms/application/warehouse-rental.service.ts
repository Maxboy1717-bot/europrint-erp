/**
 * @module warehouse-rental.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { WarehouseRentalRepository } from './warehouse-rental.repository';

@Injectable()
export class WarehouseRentalService {
  constructor(private readonly repo: WarehouseRentalRepository) {}

  async getRecords(status?: string): Promise<Result<object, AppError>> {
    return this.repo.getRecords(status);
  }

  async createRecord(body: Record<string, unknown>, userId: number | null) {
    return this.repo.createRecord(body, userId);
  }

  async getSummary() {
    return this.repo.getSummary();
  }

  async getSettings() {
    return this.repo.getSettings();
  }

  async updateSettings(body: Record<string, unknown>) {
    return this.repo.updateSettings(body);
  }

  async closeRecord(id: number, userId: number | null) {
    return this.repo.closeRecord(id, userId);
  }

  async markPaid(id: number, userId: number | null, notes?: string) {
    return this.repo.markPaid(id, userId, notes);
  }
}
