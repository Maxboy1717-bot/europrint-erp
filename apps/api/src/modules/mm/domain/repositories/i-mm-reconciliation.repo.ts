/**
 * @module i-mm-reconciliation.repo
 * @description Domain port for vendor reconciliation (sverka akti) data access.
 *   Concrete impl: infrastructure/repositories/mm-reconciliation.repository.ts.
 * @layer Domain (MM)
 */

import type { Result } from '@common/result';

export const MM_RECONCILIATION_REPO = Symbol('MM_RECONCILIATION_REPO');

/** Single-row aggregates for one vendor over a period (pg numeric -> string). */
export interface VendorReconciliationRow {
  vendor_name: string | null;
  opening: string;
  invoiced: string;
  payments: string;
  receipts: string;
}

/** One discrepant vendor for the month-end digest. */
export interface DiscrepancyDigestRow {
  vendor_id: number;
  vendor_name: string | null;
  invoiced: string;
  receipts: string;
  discrepancy: string;
}

export interface IMmReconciliationRepo {
  getVendorReconciliation(
    vendorId: number,
    fromDate: string,
    toDate: string,
  ): Promise<Result<VendorReconciliationRow | null>>;
  getDiscrepancyDigest(
    fromDate: string,
    toDate: string,
    epsilon: number,
  ): Promise<Result<DiscrepancyDigestRow[]>>;
  findUserIdsByRoles(roles: string[]): Promise<Result<number[]>>;
}
