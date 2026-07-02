/**
 * @module i-mm-vendors-pr.repo
 * @description Domain repository interface for MM vendors and purchase
 *   requisition operations. Concrete implementation lives at
 *   `infrastructure/repositories/mm-vendors-pr.repository.ts`.
 * @layer Domain (MM)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export interface IMmVendorsPrRepo {
  listVendors(pat: string | null, lim: number, off: number): Promise<Result<Row[]>>;
  getVendor(id: number): Promise<Result<Row[]>>;
  createVendor(body: Row): Promise<Result<Row>>;
  updateVendor(id: number, body: Row): Promise<Result<Row[]>>;
  deleteVendor(id: number): Promise<Result<void>>;
  listRequisitions(status: string | undefined, lim: number, off: number): Promise<Result<Row[]>>;
  getRequisitionHeader(rid: number): Promise<Result<Row | null>>;
  getRequisitionItems(rid: number): Promise<Result<unknown[]>>;
  /**
   * Q-46 (2026-07-02): `mm_purchase_requisitions` is an updatable VIEW over the base
   * table `purchase_requisitions`, which has NOT NULL constraints on
   * requisition_number/material_id/required_quantity/required_date. `material_id` +
   * `required_quantity` (from the requisition's first real item — never fabricated)
   * and `required_date` (needed_by, or today if not given) must be supplied so the
   * INSERT doesn't crash with 23502. See mm-vendors-pr.repository.ts for detail.
   */
  createRequisition(
    title: unknown,
    requested_by: number | null,
    needed_by: unknown,
    notes: unknown,
    material_id: number,
    required_quantity: number,
  ): Promise<Result<Row>>;
  createRequisitionItem(
    requisition_id: unknown,
    material_id: unknown,
    quantity: unknown,
    unit_price: unknown,
  ): Promise<Result<void>>;
  updateRequisition(rid: number, body: Row): Promise<Result<Row[]>>;
  deleteRequisition(rid: number): Promise<Result<void>>;
}

export const MM_VENDORS_PR_REPO = Symbol('MM_VENDORS_PR_REPO');
