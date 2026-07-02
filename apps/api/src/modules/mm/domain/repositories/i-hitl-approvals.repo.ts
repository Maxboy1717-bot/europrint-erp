/**
 * @module i-hitl-approvals.repo
 * @description Repository contract for the `hitl_approvals` review-queue (Human-In-The-Loop).
 * Three MM listeners (PoRequiresDirectorApprovalListener, ThreeWayMatchFailedListener,
 * OrderMaterialWaitingListener) INSERT rows into `hitl_approvals`, but until now nothing could
 * ever transition a row out of 'pending' — a dead-end notification. This repo adds the missing
 * write side (approve/reject) alongside the existing read side (list pending).
 */
import { Result } from '@common/result';

export interface HitlApprovalRow {
  id: number;
  entityType: string;
  entityId: string;
  status: string;
  requestedBy: string | null;
  approvedBy: string | null;
  notes: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export const HITL_APPROVALS_REPO = Symbol('HITL_APPROVALS_REPO');

export interface IHitlApprovalsRepo {
  /** Pending rows, newest first (bounded — dashboard/review-queue list). */
  listPending(limit: number): Promise<Result<HitlApprovalRow[]>>;

  /** Single row by id, regardless of status. */
  findById(id: number): Promise<Result<HitlApprovalRow>>;

  /** Transitions a 'pending' row to 'approved'. Fails (CONFLICT) if the row is not pending. */
  approve(id: number, approvedBy: string, notes: string | null): Promise<Result<HitlApprovalRow>>;

  /** Transitions a 'pending' row to 'rejected'. Fails (CONFLICT) if the row is not pending. */
  reject(id: number, rejectedBy: string, reason: string | null): Promise<Result<HitlApprovalRow>>;
}
