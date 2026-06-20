/**
 * @module i-qc-extended.repo
 * @description Domain repository interface for QC extended ops
 *   (standards / final inspections / in-process inspections / root causes).
 *   Concrete implementation at
 *   `infrastructure/repositories/qc-extended.repository.ts`.
 * @layer Domain (QC)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export const QC_EXTENDED_REPO = Symbol('QC_EXTENDED_REPO');

export interface IQcExtendedRepo {
  listStandards(category: string | undefined, lim: number, off: number): Promise<Result<Row[]>>;
  getStandard(id: number): Promise<Result<Row[]>>;
  createStandard(name: string, category: string | null, description: string | null, parameters: Record<string, unknown> | null, is_active: boolean | null): Promise<Result<Row>>;
  updateStandard(id: number, name: string | null, category: string | null, description: string | null, is_active: boolean | null): Promise<Result<Row[]>>;
  listFinalInspections(status: string | undefined, oid: number | null, lim: number, off: number): Promise<Result<Row[]>>;
  createFinalInspection(order_id: number | null, inspector_id: number | null, status: string | null, notes: string | null, passed: boolean | null, sampleSize: number, defectCount: number, passedCount: number, defectRate: number | null): Promise<Result<Row>>;
  updateFinalInspection(id: number, status: string | null, notes: string | null, passed: boolean | null): Promise<Result<Row[]>>;
  getFinalOrders(lim: number): Promise<Result<Row[]>>;
  completeFinalInspection(id: number, inspResult: string | null, notes: string | null, defect_count: number, passed: boolean): Promise<Result<Row[]>>;
  listInProcess(sid: number | null, status: string | undefined, lim: number): Promise<Result<Row[]>>;
  createInProcessInspection(session_id: number, inspector_id: number | null, check_point: string | null, total: number, defects: number, status: string, notes: string | null): Promise<Result<Row>>;
  listRootCauses(): Promise<Result<Row[]>>;
  createRootCause(name: string, description?: string, category?: string): Promise<Result<Row>>;
  updateRootCause(id: number, name: string | null, description: string | null, category: string | null): Promise<Result<Row[]>>;
}
