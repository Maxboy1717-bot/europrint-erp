/**
 * @module hr-assets.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 *
 * Merged into hr module (PA3-17 Wave 3): originally lived in `modules/hr-assets/`.
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, isOk, Result } from '@common/result';
import { HrAssetsRepository, AssetFilter, HrAsset } from './hr-assets.repository';

@Injectable()
export class HrAssetsService {
  constructor(private readonly repo: HrAssetsRepository) {}

  async getAll(filter: AssetFilter) { return this.repo.findAll(filter); }

  async getById(id: string): Promise<Result<HrAsset>> {
    const r = await this.repo.findById(id);
    if (!isOk(r)) return Err(r.error);
    if (!r.data) return Err('NOT_FOUND');
    return Ok(r.data);
  }

  async create(data: { name: string; serial_number?: string; category: string; status: string; purchase_date?: string | null; value?: number; notes?: string }) { return this.repo.create(data); }
  async update(id: string, data: Partial<{ name: string; serial_number: string; category: string; status: string; purchase_date: string | null; value: number; notes: string }>) { return this.repo.update(id, data); }
  async remove(id: string) { return this.repo.remove(id); }
  async getByEmployee(employeeId: string) { return this.repo.findByEmployee(employeeId); }
  async assign(assetId: string, data: { employee_id: string; assigned_date: string; condition_on_assign: string; notes?: string }) { return this.repo.assign(assetId, data); }
  async returnAsset(assetId: string, data: { return_date: string; condition_on_return: string; notes?: string }) { return this.repo.returnAsset(assetId, data); }
  async reportIssue(assetId: string, data: { report_type: string; description: string }) { return this.repo.reportIssue(assetId, data); }
}
