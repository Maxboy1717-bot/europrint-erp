/**
 * @module i-qc-defects-extended.repo
 * @description Domain repository interface for extended QC defect / brak /
 *   supplier-quality / approvals queries. Concrete implementation lives at
 *   `infrastructure/repositories/qc-defects-extended.repository.ts`.
 * @layer Domain (QC)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export interface IQcDefectsExtendedRepo {
  listBraks(sid: number | null, lim: number, off: number): Promise<Result<Row[]>>;
  getBrakStats(from?: string, to?: string): Promise<Result<Row>>;
  getBrakCostImpact(papkaOrderId: number): Promise<Result<Row[]>>;
  createBrak(
    session_id: number | null,
    material_id: number | null,
    quantity: number,
    reason: string | null,
    root_cause_id: number | null,
    reported_by: number | null,
    papka_order_id: number | null,
    brak_date: string | null,
    stage: string | null,
    description: string | null,
  ): Promise<Result<Row>>;
  listSupplierQuality(vid: number | null, lim: number): Promise<Result<Row[]>>;
  createSupplierQuality(
    vendor_id: number | null,
    supplier_name: string,
    receipt_id: number | null,
    material_id: number | null,
    batch_number: string | null,
    sample_size: number,
    defects_found: number,
    quality_score: number | null,
    notes: string | null,
    status: string | null,
  ): Promise<Result<Row>>;
  getDashboardStats(from?: string, to?: string): Promise<Result<Row>>;
  getDashboardFlow(): Promise<Result<Row[]>>;
  listApprovals(type?: string, status?: string): Promise<Result<Row[]>>;
  createApproval(
    type: string,
    reference_id: number,
    approver_id: number | null,
    notes: string | null,
  ): Promise<Result<Row>>;
  updateApproval(id: number, status: string, notes: string | null): Promise<Result<Row[]>>;
  updateReclamation(
    id: number,
    status: string | null,
    resolution: string | null,
    root_cause_id: number | null,
  ): Promise<Result<Row[]>>;
}

export const QC_DEFECTS_EXTENDED_REPO = Symbol('QC_DEFECTS_EXTENDED_REPO');
