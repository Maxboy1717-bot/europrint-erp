/**
 * @module qc-extended.repository (infrastructure)
 * @description Drizzle implementation of {@link IQcExtendedRepo}.
 *   Wave 13 PR1 — umbrella that delegates to 4 aggregate-scoped sub-repos
 *   (standards / final inspections / in-process inspections / root causes).
 *   Provider symbol `QC_EXTENDED_REPO` and consumers are unchanged.
 * @layer Infrastructure (QC)
 */

import { Injectable } from '@nestjs/common';
import type { Result } from '@common/result';
import type { IQcExtendedRepo } from '../../domain/repositories/i-qc-extended.repo';
import { QcExtendedStandardsRepository } from './qc-extended-standards.repository';
import { QcExtendedFinalRepository } from './qc-extended-final.repository';
import { QcExtendedInProcessRepository } from './qc-extended-in-process.repository';
import { QcExtendedRootCausesRepository } from './qc-extended-root-causes.repository';

type Row = Record<string, unknown>;

@Injectable()
export class QcExtendedRepository implements IQcExtendedRepo {
  constructor(
    private readonly standards: QcExtendedStandardsRepository,
    private readonly finalInspections: QcExtendedFinalRepository,
    private readonly inProcess: QcExtendedInProcessRepository,
    private readonly rootCauses: QcExtendedRootCausesRepository,
  ) {}

  listStandards(category: string | undefined, lim: number, off: number): Promise<Result<Row[]>> {
    return this.standards.listStandards(category, lim, off);
  }
  getStandard(id: number): Promise<Result<Row[]>> {
    return this.standards.getStandard(id);
  }
  createStandard(name: string, category: string | null, description: string | null, parameters: Record<string, unknown> | null, is_active: boolean | null): Promise<Result<Row>> {
    return this.standards.createStandard(name, category, description, parameters, is_active);
  }
  updateStandard(id: number, name: string | null, category: string | null, description: string | null, is_active: boolean | null): Promise<Result<Row[]>> {
    return this.standards.updateStandard(id, name, category, description, is_active);
  }

  listFinalInspections(status: string | undefined, oid: number | null, lim: number, off: number): Promise<Result<Row[]>> {
    return this.finalInspections.listFinalInspections(status, oid, lim, off);
  }
  createFinalInspection(order_id: number | null, inspector_id: number | null, status: string | null, notes: string | null, passed: boolean | null, sampleSize: number, defectCount: number, passedCount: number, defectRate: number | null): Promise<Result<Row>> {
    return this.finalInspections.createFinalInspection(order_id, inspector_id, status, notes, passed, sampleSize, defectCount, passedCount, defectRate);
  }
  updateFinalInspection(id: number, status: string | null, notes: string | null, passed: boolean | null): Promise<Result<Row[]>> {
    return this.finalInspections.updateFinalInspection(id, status, notes, passed);
  }
  getFinalOrders(lim: number): Promise<Result<Row[]>> {
    return this.finalInspections.getFinalOrders(lim);
  }
  completeFinalInspection(id: number, inspResult: string | null, notes: string | null, defect_count: number, passed: boolean): Promise<Result<Row[]>> {
    return this.finalInspections.completeFinalInspection(id, inspResult, notes, defect_count, passed);
  }

  listInProcess(sid: number | null, status: string | undefined, lim: number): Promise<Result<Row[]>> {
    return this.inProcess.listInProcess(sid, status, lim);
  }
  createInProcessInspection(session_id: number, inspector_id: number | null, check_point: string | null, total: number, defects: number, status: string, notes: string | null): Promise<Result<Row>> {
    return this.inProcess.createInProcessInspection(session_id, inspector_id, check_point, total, defects, status, notes);
  }

  listRootCauses(): Promise<Result<Row[]>> {
    return this.rootCauses.listRootCauses();
  }
  createRootCause(name: string, description?: string, category?: string): Promise<Result<Row>> {
    return this.rootCauses.createRootCause(name, description, category);
  }
  updateRootCause(id: number, name: string | null, description: string | null, category: string | null): Promise<Result<Row[]>> {
    return this.rootCauses.updateRootCause(id, name, description, category);
  }
}
