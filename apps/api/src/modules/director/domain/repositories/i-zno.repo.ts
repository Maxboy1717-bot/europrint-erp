/**
 * @module i-zno.repo
 * @description Domain repository interface for director ZNO requests.
 *   Concrete implementation lives at
 *   `infrastructure/repositories/zno.repository.ts`.
 * @layer Domain (Director)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export interface IZnoRepo {
  createZno(
    departmentId: number | null,
    submittedBy: number,
    submitterName: string | null,
    amount: number,
    purpose: string,
    paymentDate: string | null,
  ): Promise<Result<Row>>;
  listZno(
    status: string | null,
    departmentId: number | null,
    maxRows: number,
  ): Promise<Result<Row[]>>;
  findById(id: number): Promise<Result<Row[]>>;
  approveZno(id: number, reviewedBy: number, comment: string | null): Promise<Result<Row>>;
  rejectZno(id: number, reviewedBy: number, comment: string | null): Promise<Result<Row>>;
  updateZno(
    id: number,
    status: string | null,
    comment: string | null,
    userId: number,
  ): Promise<Result<Row>>;
}

export const ZNO_REPO = Symbol('ZNO_REPO');
