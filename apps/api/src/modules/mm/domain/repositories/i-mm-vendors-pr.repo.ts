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
  createRequisition(
    title: unknown,
    requested_by: number | null,
    needed_by: unknown,
    notes: unknown,
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
