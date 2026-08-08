/**
 * @module qc-defects-extended.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Inject, Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { QC_DEFECTS_EXTENDED_REPO, type IQcDefectsExtendedRepo } from '../domain/repositories/i-qc-defects-extended.repo';

@Injectable()
export class QcDefectsExtendedService {
  constructor(@Inject(QC_DEFECTS_EXTENDED_REPO) private readonly repo: IQcDefectsExtendedRepo) {}

  async listBraks(sid: number | null, lim: number, off: number): Promise<Result<object, AppError>> {
    return this.repo.listBraks(sid, lim, off);
  }

  async getBrakStats(from?: string, to?: string) {
    return this.repo.getBrakStats(from, to);
  }

  async getBrakCostImpact(papkaOrderId: number) {
    return this.repo.getBrakCostImpact(papkaOrderId);
  }

  // NOTE: createBrak moved to CQRS — QcDefectsExtendedController.createBrak now dispatches
  // ReportDefectCommand directly via CommandBus (QC-birlashtirish, 2026-07-02).

  async listSupplierQuality(vid: number | null, lim: number) {
    return this.repo.listSupplierQuality(vid, lim);
  }

  async createSupplierQuality(vendor_id: number | null, supplier_name: string, receipt_id: number | null, material_id: number | null, batch_number: string | null, sample_size: number, defects_found: number, quality_score: number | null, notes: string | null, status: string | null) {
    return this.repo.createSupplierQuality(vendor_id, supplier_name, receipt_id, material_id, batch_number, sample_size, defects_found, quality_score, notes, status);
  }

  async getDashboardStats(from?: string, to?: string) {
    return this.repo.getDashboardStats(from, to);
  }

  async getDashboardFlow() {
    return this.repo.getDashboardFlow();
  }

  async listApprovals(type?: string, status?: string) {
    return this.repo.listApprovals(type, status);
  }

  async createApproval(type: string, reference_id: number, approver_id: number | null, notes: string | null) {
    return this.repo.createApproval(type, reference_id, approver_id, notes);
  }

  async updateApproval(id: number, status: string, notes: string | null) {
    return this.repo.updateApproval(id, status, notes);
  }

}
