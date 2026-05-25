/**
 * @module mm-materials-extras.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Inject, Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { MM_MATERIALS_EXTRAS_REPO, type IMmMaterialsExtrasRepo } from '../domain/repositories/i-mm-materials-extras.repo';

@Injectable()
export class MmMaterialsExtrasService {
  constructor(@Inject(MM_MATERIALS_EXTRAS_REPO) private readonly repo: IMmMaterialsExtrasRepo) {}

  async listRawMaterials(page: number, limit: number, search?: string): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const rowsR = await this.repo.listRawMaterials(limit, (page - 1) * limit, search);
      const rows = (rowsR.ok ? rowsR.data as Record<string, unknown>[] : []);
      if (rows.length > 0) return rows;
      return this.repo.listRawMaterialsFallback(limit, (page - 1) * limit, search);
    });
  }

  async listMaterialCards(page: number, limit: number, search?: string, category?: string) {
    return safeCall(() => this.repo.listMaterialCards(limit, (page - 1) * limit, search, category));
  }

  async getMaterialCard(id: number) {
    return this.repo.getMaterialCard(id);
  }
}
