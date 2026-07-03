/**
 * @module i-zvs.repo
 * @description Domain repository interface for director ZVS requests.
 *   Concrete implementation lives at
 *   `infrastructure/repositories/zvs.repository.ts`.
 * @layer Domain (Director)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

/** One approval_matrix_config row for document_type='zvs' — sozlanadigan summa-chegara (2.15). */
export interface ZvsMatrixRow {
  minAmount: number;
  maxAmount: number | null;
  approvalLevel: number;
  /** Vergul bilan ajratilgan rol ro'yxati (masalan "admin,director,ceo"). */
  approverRole: string;
}

/** Bitta org-zanjir bosqichi: rahbar (head_user_id) + bo'lim — org_departments ierarxiyasi bo'yicha. */
export interface ZvsOrgChainStep {
  depth: number;
  orgDepartmentId: number;
  approverUserId: number;
}

export interface IZvsRepo {
  createZvs(
    departmentId: number | null,
    submittedBy: number,
    submitterName: string | null,
    amount: number,
    purpose: string,
    priority: string,
    weekDate: string,
    level: number,
  ): Promise<Result<Row>>;
  listZvs(
    status: string | null,
    weekDate: string | null,
    departmentId: number | null,
  ): Promise<Result<Row[]>>;
  findById(id: number): Promise<Result<Row[]>>;
  approveZvs(id: number, reviewedBy: number, comment: string | null): Promise<Result<Row>>;
  rejectZvs(id: number, reviewedBy: number, comment: string | null): Promise<Result<Row>>;
  /** Sozlanadigan summa-chegaralar (approval_matrix_config, document_type='zvs'), min_amount bo'yicha o'sish tartibida. */
  getZvsApprovalMatrix(): Promise<Result<ZvsMatrixRow[]>>;
  /**
   * So'rov beruvchi (submitted_by = users.id) uchun birlamchi org-bo'limni topadi
   * (employee_org_departments.user_id, is_primary birinchi). Topilmasa null (EGASI-DATA —
   * fabrikatsiya qilinmaydi, zanjir bo'sh qoladi, role-based tasdiq ishlashda davom etadi).
   */
  findOrgDepartmentForSubmitter(submittedByUserId: number): Promise<Result<number | null>>;
  /**
   * Bo'limdan boshlab org-sxema bo'yicha yuqoriga tasdiq zanjiri
   * (org_departments.parent_id ierarxiyasi, head_user_id = tasdiqlovchi). Bo'lim/head topilmasa
   * bo'sh massiv (EGASI-DATA — fabrikatsiya qilinmaydi).
   */
  resolveOrgChainForDepartment(orgDepartmentId: number, excludeUserId?: number): Promise<Result<ZvsOrgChainStep[]>>;
}

export const ZVS_REPO = Symbol('ZVS_REPO');
