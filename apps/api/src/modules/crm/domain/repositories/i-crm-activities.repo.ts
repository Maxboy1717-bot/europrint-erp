/**
 * @module i-crm-activities.repo
 * @description Domain repository interface for CRM activities.
 *   Concrete implementation lives at
 *   `infrastructure/repositories/crm-activities.repository.ts`.
 * @layer Domain (CRM)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export const CRM_ACTIVITIES_REPO = Symbol('CRM_ACTIVITIES_REPO');

export interface ICrmActivitiesRepo {
  list(lid: number | null, did: number | null, uid: number | null, type: string | undefined, status: string | undefined, lim: number, off: number): Promise<Result<Row[]>>;
  today(): Promise<Result<Row[]>>;
  getById(aid: number): Promise<Result<Row | null>>;
  create(type: unknown, subject: unknown, lead_id: unknown, deal_id: unknown, assigned_to: unknown, due_date: unknown, notes: unknown, status: unknown): Promise<Result<Row>>;
  update(aid: number, body: Row): Promise<Result<Row | null>>;
  complete(aid: number, outcome: unknown): Promise<Result<Row | null>>;
  delete(aid: number): Promise<void>;
}
