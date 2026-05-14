/**
 * @module pos-mini-app.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { PosMiniAppRepository } from '../repositories/pos-mini-app.repository';

@Injectable()
export class PosMiniAppService {
  constructor(private readonly repo: PosMiniAppRepository) {}

  async getUserDetails(userId: number): Promise<Result<object | null, AppError>> {
    return this.repo.getUserDetails(userId);
  }

  async searchMaterials(q: string, warehouseId?: string) {
    return safeCall(() => {
      const search = `%${(q ?? '').trim()}%`;
      return this.repo.searchMaterials(search, warehouseId);
    });
  }

  async getHistory(userId: number, lmt: number, ofs: number) {
    return safeCall(async () => {
      const historyR = await this.repo.getHistory(userId, lmt, ofs);
      const { items, total } = (historyR.ok ? historyR.data : { items: [], total: 0 }) as { items: unknown[]; total: number };
      return { items, total, limit: lmt, offset: ofs };
    });
  }

  async getPendingApprovals(userId: number) {
    return this.repo.getPendingApprovals(userId);
  }

  async getWarehouses(userId: number) {
    return this.repo.getWarehouses(userId);
  }
}
