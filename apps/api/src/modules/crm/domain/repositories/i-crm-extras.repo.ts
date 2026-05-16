/**
 * @module i-crm-extras.repo
 * @description Domain repository interface for CRM extras
 *   (comments / history / dashboard / pipeline / tasks / invoices / proposals).
 *   Concrete implementation at
 *   `infrastructure/repositories/crm-extras.repository.ts`.
 * @layer Domain (CRM)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export const CRM_EXTRAS_REPO = Symbol('CRM_EXTRAS_REPO');

export interface ICrmExtrasRepo {
  listComments(leadId: number | null, dealId: number | null, lim: number, off: number): Promise<Result<Row[]>>;
  createComment(leadId: number | null, dealId: number | null, text: string, authorId: number): Promise<Result<Row | null>>;
  getHistory(entityType: string | null, entityId: number | null, lim: number, off: number): Promise<Result<Row[]>>;
  getDashboardLeads(): Promise<Result<Row[]>>;
  getDashboardDeals(): Promise<Result<Row>>;
  getDashboardActivities(): Promise<Result<number>>;
  getPipeline(stageId: number | null): Promise<Result<Row[]>>;
  listTasks(assignedTo: number | null, status: string | null, lim: number, off: number): Promise<Result<Row[]>>;
  createTask(body: Row): Promise<Result<Row | null>>;
  listInvoices(lim: number, off: number): Promise<Result<Row[]>>;
  listProposals(lim: number, off: number): Promise<Result<Row[]>>;
  getLeadStages(): Promise<Result<Row[]>>;
}
