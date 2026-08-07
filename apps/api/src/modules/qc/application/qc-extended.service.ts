/**
 * @module qc-extended.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Inject, Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { getBusinessSettingNumber } from '../../../shared/config/business-settings.reader';
import { QC_EXTENDED_REPO, type IQcExtendedRepo } from '../domain/repositories/i-qc-extended.repo';

const QC_LOT_DEFECT_FAIL_RATIO_DEFAULT = 0.05;

@Injectable()
export class QcExtendedService {
  constructor(@Inject(QC_EXTENDED_REPO) private readonly repo: IQcExtendedRepo) {}

  async listStandards(category: string | undefined, lim: number, off: number): Promise<Result<object, AppError>> {
    return this.repo.listStandards(category, lim, off);
  }

  async getStandard(id: number) {
    return this.repo.getStandard(id);
  }

  async createStandard(name: string, category: string | null, description: string | null, parameters: Record<string, unknown> | null, is_active: boolean | null) {
    return this.repo.createStandard(name, category, description, parameters, is_active);
  }

  async updateStandard(id: number, name: string | null, category: string | null, description: string | null, is_active: boolean | null) {
    return this.repo.updateStandard(id, name, category, description, is_active);
  }

  async listFinalInspections(status: string | undefined, oid: number | null, lim: number, off: number) {
    return this.repo.listFinalInspections(status, oid, lim, off);
  }

  async createFinalInspection(
    order_id: number | null,
    inspector_id: number | null,
    status: string | null,
    notes: string | null,
    passed: boolean | null,
    sampleSize: number,
    defectCount: number,
    passedCount: number,
    defectRate: number | null,
  ) {
    return this.repo.createFinalInspection(order_id, inspector_id, status, notes, passed, sampleSize, defectCount, passedCount, defectRate);
  }

  async updateFinalInspection(id: number, status: string | null, notes: string | null, passed: boolean | null) {
    return this.repo.updateFinalInspection(id, status, notes, passed);
  }

  async getFinalOrders(lim: number) {
    return this.repo.getFinalOrders(lim);
  }

  async completeFinalInspection(id: number, inspResult: string | null, notes: string | null, defect_count: number, passed: boolean, parentOrderId: number | null = null, reworkCost: number | null = null) {
    return this.repo.completeFinalInspection(id, inspResult, notes, defect_count, passed, parentOrderId, reworkCost);
  }

  async listInProcess(sid: number | null, status: string | undefined, lim: number) {
    return this.repo.listInProcess(sid, status, lim);
  }

  deriveInspectionStatus(total: number, defects: number, failRatio = QC_LOT_DEFECT_FAIL_RATIO_DEFAULT): 'passed' | 'failed' | 'conditional' {
    return defects === 0 ? 'passed'
      : total > 0 && defects / total > failRatio ? 'failed'
      : 'conditional';
  }

  async createInProcessInspection(session_id: number, inspector_id: number | null, check_point: string | null, total: number, defects: number, notes: string | null) {
    // MN-1 (Magic-Numbers Independent Verification 2026-07-07, M6 2/4 gap): the 0.05
    // QC-lot auto-fail ratio is tunable rather than hardcoded -- falls back to 0.05 when unset.
    //
    // 2026-08-07 (audit 2026-08-06): was getConfigNumber('qc_lot_defect_fail_ratio'), which reads
    // the legacy generic `settings` table. That table had no row for the key AND has no CRUD/admin
    // screen, so the threshold was permanently stuck at the 0.05 fallback and the owner could never
    // change it -- violating the "threshold qiymatlar = doim CRUD" rule. Now reads the canonical
    // business_settings row (seeded by migrations-schema.ts, editable via the business-settings CRUD).
    const failRatio = await getBusinessSettingNumber('qc.lot_defect_fail_ratio', QC_LOT_DEFECT_FAIL_RATIO_DEFAULT);
    const status = this.deriveInspectionStatus(total, defects, failRatio);
    return this.repo.createInProcessInspection(session_id, inspector_id, check_point, total, defects, status, notes);
  }

  async listRootCauses() {
    return this.repo.listRootCauses();
  }

  async createRootCause(name: string, description?: string, category?: string) {
    return this.repo.createRootCause(name, description, category);
  }

  async updateRootCause(id: number, name: string | null, description: string | null, category: string | null) {
    return this.repo.updateRootCause(id, name, description, category);
  }
}
