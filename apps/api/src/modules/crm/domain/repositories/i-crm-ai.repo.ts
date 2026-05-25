/**
 * @module i-crm-ai.repo
 * @description Domain repository interface for CRM AI / scoring queries.
 *   Concrete implementation lives at
 *   `infrastructure/repositories/crm-ai.repository.ts`.
 * @layer Domain (CRM)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export const CRM_AI_REPO = Symbol('CRM_AI_REPO');

export interface ICrmAiRepo {
  getLeadWithActivity(lid: number): Promise<Result<Row | null>>;
  updateLeadScore(lid: number, score: number): Promise<void>;
  getLeadWithDeals(lid: number): Promise<Result<Row | null>>;
  updateLeadScoreSimple(lid: number, score: number): Promise<void>;
  getDealWithActivity(did: number): Promise<Result<Row | null>>;
  getLeadDashboard(mid: number | null): Promise<Result<Row>>;
  getDealDashboard(mid: number | null): Promise<Result<Row>>;
  getEntityActivities(entityType: string, eid: number): Promise<Result<Row[]>>;
  getRecentActivity(lid: number | null, did: number | null): Promise<Result<Row | null>>;
}
