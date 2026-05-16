/**
 * @module i-zvs.repo
 * @description Domain repository interface for director ZVS requests.
 *   Concrete implementation lives at
 *   `infrastructure/repositories/zvs.repository.ts`.
 * @layer Domain (Director)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

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
}

export const ZVS_REPO = Symbol('ZVS_REPO');
