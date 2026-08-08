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
  // NOTE: brak creation moved off this repo — QC-birlashtirish (2026-07-02) routes
  // POST /qc/braks through ReportDefectCommand (CQRS), writing to qc_defects directly
  // (see qc-defects-extended.controller.ts createBrak + report-defect.handler.ts).
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
  getDashboardFlow(): Promise<Result<Row>>;
  listApprovals(type?: string, status?: string): Promise<Result<Row[]>>;
  createApproval(
    type: string,
    reference_id: number,
    approver_id: number | null,
    notes: string | null,
  ): Promise<Result<Row>>;
  updateApproval(id: number, status: string, notes: string | null): Promise<Result<Row[]>>;
  // NOTE: reclamation status/resolution updates moved to the CQRS command path
  // (ResolveReclamationCommand, application/commands/resolve-reclamation.*) —
  // the raw-SQL PATCH that used to live here wrote a `root_cause_id` column
  // that does not exist on qc_reclamations and crashed on every call.
}

export const QC_DEFECTS_EXTENDED_REPO = Symbol('QC_DEFECTS_EXTENDED_REPO');
