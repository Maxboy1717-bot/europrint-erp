/**
 * @module crm-extras.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { CrmExtrasRepository } from './crm-extras.repository';

@Injectable()
export class CrmExtrasService {
  constructor(private readonly repo: CrmExtrasRepository) {}

  async listComments(leadId: number | null, dealId: number | null, lim: number, off: number): Promise<Result<object, AppError>> {
    return this.repo.listComments(leadId, dealId, lim, off);
  }

  async createComment(leadId: number | null, dealId: number | null, text: string, authorId: number) {
    return this.repo.createComment(leadId, dealId, text, authorId);
  }

  async getHistory(entityType: string | null, entityId: number | null, lim: number, off: number) {
    return this.repo.getHistory(entityType, entityId, lim, off);
  }

  async getDashboard() {
    return safeCall(async () => {
      const [leads, deals, todayActivities] = await Promise.all([
        this.repo.getDashboardLeads(),
        this.repo.getDashboardDeals(),
        this.repo.getDashboardActivities(),
      ]);
      return {
        leads_by_status: leads,
        pipeline_total: (deals as Record<string, unknown>).pipeline ?? 0,
        open_deals: (deals as Record<string, unknown>).total ?? 0,
        today_activities: todayActivities,
      };
    });
  }

  async getPipeline(stageId: number | null) {
    return this.repo.getPipeline(stageId);
  }

  async listTasks(assignedTo: number | null, status: string | null, lim: number, off: number) {
    return this.repo.listTasks(assignedTo, status, lim, off);
  }

  async createTask(body: Record<string, unknown>) {
    return this.repo.createTask(body);
  }

  async listInvoices(lim: number, off: number) {
    return this.repo.listInvoices(lim, off);
  }

  async listProposals(lim: number, off: number) {
    return this.repo.listProposals(lim, off);
  }

  async getLeadStages() {
    return this.repo.getLeadStages();
  }

  async getNba(entityType: string, entityId: number) {
    return safeCall(async () => ({
      entity_type: entityType,
      entity_id: entityId,
      recommendations: [
        { action: 'follow_up_call', reason: 'No contact in 7 days', priority: 1 },
        { action: 'send_proposal', reason: 'Deal stage requires proposal', priority: 2 },
        { action: 'schedule_demo', reason: 'Product demo not done', priority: 3 },
      ],
      generated_at: _time.now(),
    }));
  }
}
