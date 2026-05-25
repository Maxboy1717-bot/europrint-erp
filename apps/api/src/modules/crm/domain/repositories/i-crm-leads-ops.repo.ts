/**
 * @module i-crm-leads-ops.repo
 * @description Domain repository interface for CRM lead operations
 *   (update / stage transitions / convert-to-deal).
 *   Concrete implementation lives at
 *   `infrastructure/repositories/crm-leads-ops.repository.ts`.
 * @layer Domain (CRM)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export const CRM_LEADS_OPS_REPO = Symbol('CRM_LEADS_OPS_REPO');

export interface ICrmLeadsOpsRepo {
  updateLead(lid: number, body: Row): Promise<Result<Row[]>>;
  findStage(stageId: number): Promise<Result<boolean>>;
  updateLeadStage(lid: number, stageId: number): Promise<Result<Row[]>>;
  insertActivityNote(lid: number, notes: string): Promise<void>;
  findLead(lid: number): Promise<Result<Row | null>>;
  insertDeal(lid: number, name: string, companyId: unknown, expectedAmount: number): Promise<Result<Row>>;
  convertLead(lid: number): Promise<void>;
  leadExists(lid: number): Promise<Result<boolean>>;
  deleteLead(lid: number): Promise<void>;
}
