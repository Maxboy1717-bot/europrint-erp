/**
 * @module i-sd-payments.repo
 * @description Domain repository interface for SD payments / debitors / overdue / rentals.
 *   Concrete implementation lives at
 *   `infrastructure/repositories/sd-payments.repository.ts`.
 * @layer Domain (SD)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export interface ISdPaymentsRepo {
  list(customerId: number | null, status: string | null, lim: number, off: number): Promise<Result<Row[]>>;
  getDebitors(lim: number, off: number): Promise<Result<Row[]>>;
  getOverdue(lim: number, off: number): Promise<Result<Row[]>>;
  create(body: Row): Promise<Result<Row | null>>;
  getActiveRentals(lim: number, off: number): Promise<Result<Row[]>>;
}

export const SD_PAYMENTS_REPO = Symbol('SD_PAYMENTS_REPO');
