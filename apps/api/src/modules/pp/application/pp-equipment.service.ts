/**
 * @module pp-equipment.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { PpEquipmentRepository } from './pp-equipment.repository';

@Injectable()
export class PpEquipmentService {
  constructor(private readonly repo: PpEquipmentRepository) {}

  async listEquipment(status: string | null, limit: number): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const rows = await this.repo.listEquipment(status, limit);
      if (rows.ok && rows.data.length > 0) return rows;
      return this.repo.listWorkCenters(limit);
    });
  }

  async getEquipment(id: number) {
    return this.repo.findById(id);
  }

  async createEquipment(body: Record<string, unknown>) {
    return this.repo.create(body);
  }

  async updateEquipment(id: number, body: Record<string, unknown>) {
    return this.repo.update(id, body);
  }
}
