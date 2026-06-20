/**
 * @module crm-extras.repository (infrastructure)
 * @description Drizzle implementation of {@link ICrmExtrasRepo}.
 *   Wave 13 PR1 — umbrella that delegates to 4 concern-scoped sub-repos
 *   (comments+history / dashboard+pipeline / tasks / documents).
 *   Provider symbol `CRM_EXTRAS_REPO` and consumers are unchanged.
 * @layer Infrastructure (CRM)
 */

import { Injectable } from '@nestjs/common';
import type { Result } from '@common/result';
import type { ICrmExtrasRepo, CrmActivityRow } from '../../domain/repositories/i-crm-extras.repo';
import { CrmExtrasCommentsRepository } from './crm-extras-comments.repository';
import { CrmExtrasDashboardRepository } from './crm-extras-dashboard.repository';
import { CrmExtrasTasksRepository } from './crm-extras-tasks.repository';
import { CrmExtrasDocumentsRepository } from './crm-extras-documents.repository';

type Row = Record<string, unknown>;

@Injectable()
export class CrmExtrasRepository implements ICrmExtrasRepo {
  constructor(
    private readonly comments: CrmExtrasCommentsRepository,
    private readonly dashboard: CrmExtrasDashboardRepository,
    private readonly tasks: CrmExtrasTasksRepository,
    private readonly documents: CrmExtrasDocumentsRepository,
  ) {}

  listComments(leadId: number | null, dealId: number | null, lim: number, off: number): Promise<Result<Row[]>> {
    return this.comments.listComments(leadId, dealId, lim, off);
  }
  createComment(leadId: number | null, dealId: number | null, text: string, authorId: number): Promise<Result<Row | null>> {
    return this.comments.createComment(leadId, dealId, text, authorId);
  }
  getHistory(entityType: string | null, entityId: number | null, lim: number, off: number): Promise<Result<Row[]>> {
    return this.comments.getHistory(entityType, entityId, lim, off);
  }

  getDashboardLeads(): Promise<Result<Row[]>>      { return this.dashboard.getDashboardLeads(); }
  getDashboardDeals(): Promise<Result<Row>>        { return this.dashboard.getDashboardDeals(); }
  getDashboardActivities(): Promise<Result<number>> { return this.dashboard.getDashboardActivities(); }
  getPipeline(stageId: number | null): Promise<Result<Row[]>> { return this.dashboard.getPipeline(stageId); }
  getLeadStages(): Promise<Result<Row[]>>          { return this.dashboard.getLeadStages(); }

  listTasks(assignedTo: number | null, status: string | null, lim: number, off: number): Promise<Result<Row[]>> {
    return this.tasks.listTasks(assignedTo, status, lim, off);
  }
  createTask(body: Row): Promise<Result<Row | null>> {
    return this.tasks.createTask(body);
  }

  listInvoices(lim: number, off: number): Promise<Result<Row[]>>  { return this.documents.listInvoices(lim, off); }
  listProposals(lim: number, off: number): Promise<Result<Row[]>> { return this.documents.listProposals(lim, off); }

  getEntityActivities(entityType: string, entityId: number): Promise<Result<CrmActivityRow[]>> {
    return this.dashboard.getEntityActivities(entityType, entityId);
  }
}
