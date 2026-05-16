/**
 * @module pp-equipment.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Inject, Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { PP_EQUIPMENT_REPO, type IPpEquipmentRepo } from '../domain/repositories/i-pp-equipment.repo';

@Injectable()
export class PpEquipmentService {
  constructor(@Inject(PP_EQUIPMENT_REPO) private readonly repo: IPpEquipmentRepo) {}

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
