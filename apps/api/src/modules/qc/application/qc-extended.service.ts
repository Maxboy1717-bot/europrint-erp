import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { QcExtendedRepository } from './qc-extended.repository';

@Injectable()
export class QcExtendedService {
  constructor(private readonly repo: QcExtendedRepository) {}

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

  async createFinalInspection(order_id: number | null, inspector_id: number | null, status: string | null, notes: string | null, passed: boolean | null) {
    return this.repo.createFinalInspection(order_id, inspector_id, status, notes, passed);
  }

  async updateFinalInspection(id: number, status: string | null, notes: string | null, passed: boolean | null) {
    return this.repo.updateFinalInspection(id, status, notes, passed);
  }

  async getFinalOrders(lim: number) {
    return this.repo.getFinalOrders(lim);
  }

  async completeFinalInspection(id: number, inspResult: string | null, notes: string | null, defect_count: number, passed: boolean) {
    return this.repo.completeFinalInspection(id, inspResult, notes, defect_count, passed);
  }

  async listInProcess(sid: number | null, status: string | undefined, lim: number) {
    return this.repo.listInProcess(sid, status, lim);
  }

  deriveInspectionStatus(total: number, defects: number): 'passed' | 'failed' | 'conditional' {
    return defects === 0 ? 'passed'
      : total > 0 && defects / total > 0.05 ? 'failed'
      : 'conditional';
  }

  async createInProcessInspection(session_id: number, inspector_id: number | null, check_point: string | null, total: number, defects: number, notes: string | null) {
    const status = this.deriveInspectionStatus(total, defects);
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
