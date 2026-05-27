/**
 * @module crm-ai.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Inject } from '@nestjs/common';
import { safeCall, Result, AppError, Err, Ok } from '@common/result';
import { CRM_AI_REPO, type ICrmAiRepo } from '../domain/repositories/i-crm-ai.repo';

import { MS_PER_DAY, CRM_LARGE_DEAL_THRESHOLD } from '@common/constants/app.constants';
@Injectable()
export class CrmAiService {
  constructor(@Inject(CRM_AI_REPO) private readonly repo: ICrmAiRepo) {}

  async analyzeLeadAi(lid: number): Promise<Result<object, AppError>> {
    const leadResult = await this.repo.getLeadWithActivity(lid);
    if (!leadResult.ok) return Err(leadResult.error);
    if (!leadResult.data) return Err({ code: 'NOT_FOUND' as const, message: `Lead #${lid} topilmadi` });
    const lead = leadResult.data as Record<string, unknown>;
    const score = this.scoreLead(lead);
    await this.repo.updateLeadScore(lid, score);
    const activityCount = Number(lead['activity_count'] ?? 0);
    return Ok({
      lead_id: lid,
      score,
      analysis: {
        activity_level: activityCount > 5 ? 'high' : activityCount > 2 ? 'medium' : 'low',
        recommendation: score >= 70 ? 'qualify' : score >= 40 ? 'nurture' : 'low_priority',
        stage: lead['stage_name'],
      },
    });
  }

  private scoreLead(lead: Record<string, unknown>): number {
    let score = 30;
    if (lead['email']) score += 10;
    if (lead['phone']) score += 10;
    if (lead['company_id']) score += 15;
    const ac = Number(lead['activity_count'] ?? 0);
    if (ac > 2) score += 10;
    if (ac > 5) score += 10;
    if (lead['last_activity_at']) {
      const daysSince = (Date.now() - new Date(String(lead['last_activity_at'])).getTime()) / MS_PER_DAY;
      if (daysSince < 7) score += 15;
    }
    return Math.min(100, score);
  }

  async scoreLeadV2(lid: number) {
    const leadResult = await this.repo.getLeadWithDeals(lid);
    if (!leadResult.ok) return Err(leadResult.error);
    if (!leadResult.data) return Err({ code: 'NOT_FOUND' as const, message: `Lead #${lid} topilmadi` });
    const lead = leadResult.data as Record<string, unknown>;
    return safeCall(async () => {
      const demographic = lead['company_id'] ? 25 : 10;
      const behavioral = Math.min(40, Number(lead['activities'] ?? 0) * 8);
      const intent = Number(lead['deals'] ?? 0) > 0 ? 35 : 0;
      const finalScore = demographic + behavioral + intent;
      await this.repo.updateLeadScoreSimple(lid, finalScore);
      return { lead_id: lid, score: finalScore, breakdown: { demographic, behavioral, intent }, grade: finalScore >= 75 ? 'A' : finalScore >= 50 ? 'B' : finalScore >= 25 ? 'C' : 'D' };
    });
  }

  async forecastDeal(did: number): Promise<Result<object, AppError>> {
    const dealResult = await this.repo.getDealWithActivity(did);
    if (!dealResult.ok) return Err(dealResult.error);
    if (!dealResult.data) return Err({ code: 'NOT_FOUND' as const, message: `Deal #${did} topilmadi` });
    const deal = dealResult.data as Record<string, unknown>;
    let probability = 30;
    if (Number(deal['activities'] ?? 0) > 3) probability += 20;
    if (Number(deal['age_days'] ?? 0) < 30) probability += 15;
    if (Number(deal['expected_amount'] ?? 0) > CRM_LARGE_DEAL_THRESHOLD) probability -= 10;
    probability = Math.min(95, Math.max(5, probability));
    return Ok({
      deal_id: did,
      win_probability: probability,
      forecast_amount: (Number(deal['expected_amount'] ?? 0) * probability) / 100,
      confidence: probability > 60 ? 'high' : probability > 30 ? 'medium' : 'low',
    });
  }

  async getDashboardAnalysis(mid: number | null) {
    return safeCall(async () => {
      const [leadsResult, dealsResult] = await Promise.all([
        this.repo.getLeadDashboard(mid),
        this.repo.getDealDashboard(mid),
      ]);
      const leads = leadsResult.ok ? leadsResult.data : [];
      const deals = dealsResult.ok ? dealsResult.data : [];
      return { leads, deals, period: '30 days' };
    });
  }

  async getNextBestAction(entityType: string, eid: number) {
    return safeCall(async () => {
      const actsResult = await this.repo.getEntityActivities(entityType, eid);
      const acts = actsResult.ok ? (actsResult.data as Record<string, unknown>[]) : [];
      const lastType = (acts[0] as Record<string, unknown> | undefined)?.['type'] as string | undefined ?? null;
      const nbaMap: Record<string, string[]> = {
        call: ['send_email', 'schedule_meeting'],
        email: ['make_call', 'send_proposal'],
        meeting: ['send_proposal', 'follow_up_call'],
      };
      const suggestions = (lastType ? nbaMap[lastType] : undefined) ?? ['make_call', 'send_email'];
      return { entity_type: entityType, entity_id: eid, recommended_action: suggestions[0], alternatives: suggestions.slice(1), reasoning: `Based on last activity type: ${lastType ?? 'none'}` };
    });
  }

  async suggestAction(lid: number | null, did: number | null) {
    return safeCall(async () => {
      const lastResult = await this.repo.getRecentActivity(lid, did);
      const last = lastResult.ok ? lastResult.data as Record<string, unknown> | null : null;
      const daysSince = last ? (Date.now() - new Date(String(last['created_at'])).getTime()) / MS_PER_DAY : 999;
      const action = daysSince > 7 ? 'follow_up_call' : daysSince > 3 ? 'send_email' : 'wait';
      return {
        suggested_action: action,
        urgency: daysSince > 14 ? 'high' : daysSince > 7 ? 'medium' : 'low',
        last_contact: last?.['created_at'] ?? null,
        days_since_contact: Math.round(daysSince),
      };
    });
  }
}
