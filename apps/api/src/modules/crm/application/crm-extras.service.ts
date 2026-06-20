/**
 * @module crm-extras.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Inject, Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { CRM_EXTRAS_REPO, type ICrmExtrasRepo } from '../domain/repositories/i-crm-extras.repo';

@Injectable()
export class CrmExtrasService {
  constructor(@Inject(CRM_EXTRAS_REPO) private readonly repo: ICrmExtrasRepo) {}

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
      const [leadsResult, dealsResult, activitiesResult] = await Promise.all([
        this.repo.getDashboardLeads(),
        this.repo.getDashboardDeals(),
        this.repo.getDashboardActivities(),
      ]);
      // Each repo method returns Result<T> — unwrap .data before reading fields.
      const leadsData   = leadsResult.ok   ? leadsResult.data   : [];
      const dealsData   = dealsResult.ok   ? (dealsResult.data as Record<string, unknown>) : {};
      const todayCount  = activitiesResult.ok ? activitiesResult.data : 0;
      return {
        leads_by_status: leadsData,
        pipeline_total:  dealsData.pipeline ?? 0,
        open_deals:      dealsData.total    ?? 0,
        today_activities: todayCount,
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
    return safeCall(async () => {
      const activitiesResult = await this.repo.getEntityActivities(entityType, entityId);
      const activities = activitiesResult.ok ? activitiesResult.data : [];

      const now = _time.now();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const lastActivity = activities[0] ?? null;

      // Derive recommended_action from last activity type
      let recommended_action = 'make_call';
      let alternatives: string[] = ['send_email', 'schedule_meeting'];
      if (lastActivity?.type === 'call') {
        recommended_action = 'send_email';
        alternatives = ['schedule_meeting', 'send_proposal'];
      } else if (lastActivity?.type === 'email') {
        recommended_action = 'make_call';
        alternatives = ['schedule_meeting', 'send_proposal'];
      } else if (lastActivity?.type === 'meeting') {
        recommended_action = 'send_proposal';
        alternatives = ['make_call', 'send_email'];
      }

      // Count overdue activities (due_date < NOW and status != 'completed')
      const overdueCount = activities.filter(
        a => a.due_date !== null && a.due_date < now && a.status !== 'completed',
      ).length;

      // If any overdue exists — add it to alternatives with priority 0
      const overdueAction = overdueCount > 0 ? 'overdue_followup' : null;

      // Determine urgency: high if last activity > 7 days ago or no activity at all
      const urgency =
        lastActivity === null ||
        (lastActivity.created_at !== null && lastActivity.created_at < sevenDaysAgo)
          ? 'high'
          : 'normal';

      const reasoning = lastActivity
        ? `Last activity type="${lastActivity.type ?? 'unknown'}" on ${lastActivity.created_at?.toISOString() ?? 'unknown'}`
        : 'No previous activities found — initiate first contact';

      return {
        entity_type: entityType,
        entity_id: entityId,
        recommended_action,
        alternatives: overdueAction ? [overdueAction, ...alternatives] : alternatives,
        reasoning,
        urgency,
        last_activity_at: lastActivity?.created_at ?? null,
        overdue_count: overdueCount,
        generated_at: now,
      };
    });
  }
}
