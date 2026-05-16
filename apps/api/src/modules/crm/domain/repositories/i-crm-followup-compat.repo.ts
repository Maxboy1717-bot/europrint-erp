/**
 * @module i-crm-followup-compat.repo
 * @description Domain repository interface for CRM follow-up activities
 *   (compat shim). Concrete implementation lives at
 *   `infrastructure/repositories/crm-followup-compat.repository.ts`.
 * @layer Domain (CRM)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export interface ICrmFollowupCompatRepo {
  list(lid: number | null, lim: number, off: number): Promise<Result<Row[]>>;
  today(): Promise<Result<Row[]>>;
  create(body: Record<string, unknown>): Promise<Result<Row>>;
  update(id: number, body: Record<string, unknown>): Promise<Result<Row | null>>;
  delete(id: number): Promise<void>;
}

export const CRM_FOLLOWUP_COMPAT_REPO = Symbol('CRM_FOLLOWUP_COMPAT_REPO');
