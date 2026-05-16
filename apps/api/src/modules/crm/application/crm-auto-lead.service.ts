/**
 * @module crm-auto-lead.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Inject } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { CRM_AUTO_LEAD_REPO, type ICrmAutoLeadRepo } from '../domain/repositories/i-crm-auto-lead.repo';
import { MS_PER_DAY } from '@common/constants/app.constants';

@Injectable()
export class CrmAutoLeadService {
  constructor(@Inject(CRM_AUTO_LEAD_REPO) private readonly repo: ICrmAutoLeadRepo) {}

  async quickScore(entityType: string, eid: number): Promise<Result<object | null, AppError>> {
    return safeCall(async () => {
      if (entityType === 'lead') {
        const rResult = await this.repo.findLeadScore(eid);
        const r = (rResult.ok ? rResult.data : null) as Record<string, unknown> | null;
        return r ? { entity_type: 'lead', id: eid, score: r['ai_score'] ?? 0, status: r['status'] } : null;
      } else {
        const rResult = await this.repo.findDeal(eid);
        const r = (rResult.ok ? rResult.data : null) as Record<string, unknown> | null;
        return r ? { entity_type: 'deal', id: eid, score: 50, status: r['status'] } : null;
      }
    });
  }

  async getSupervisorDashboard() {
    return this.repo.getSupervisorDashboard();
  }

  async getAutoLeadSources() {
    return this.repo.getAutoLeadSources();
  }

  async ingestCallLead(phone: unknown, first_name: unknown, last_name: unknown, notes: unknown, source_meta: unknown) {
    return this.repo.ingestCallLead(phone, first_name, last_name, notes, source_meta);
  }

  async ingestFormLead(email: unknown, phone: unknown, first_name: unknown, last_name: unknown, form_name: unknown, notes: unknown) {
    return this.repo.ingestFormLead(email, phone, first_name, last_name, form_name, notes);
  }

  async ingestTelegramLead(telegram_id: unknown, first_name: unknown, last_name: unknown, username: unknown, message: unknown) {
    return this.repo.ingestTelegramLead(first_name, last_name, username, message);
  }

  async ingestWebsiteLead(email: unknown, phone: unknown, first_name: unknown, last_name: unknown, page_url: unknown, message: unknown) {
    return this.repo.ingestWebsiteLead(email, phone, first_name, last_name, page_url, message);
  }

  async churnRescue(entityType: string, eid: number): Promise<Result<object | null, AppError>> {
    return safeCall(async () => {
      const rResult = await this.repo.getChurnRisk(entityType, eid);
      const r = (rResult.ok ? rResult.data : null) as Record<string, unknown> | null;
      if (!r) return null;
      return this.buildRescuePlan(entityType, eid, r);
    });
  }

  private buildRescuePlan(entityType: string, eid: number, r: Record<string, unknown>): object {
    const updatedAt = r['updated_at'] ? new Date(r['updated_at'] as string) : new Date(r['created_at'] as string);
    const daysSinceUpdate = Math.floor((Date.now() - updatedAt.getTime()) / MS_PER_DAY);
    const riskLevel = daysSinceUpdate > 30 ? 'yuqori' : daysSinceUpdate > 14 ? "o'rta" : 'past';
    const riskScore = Math.min(100, Math.round((daysSinceUpdate / 45) * 100));
    return {
      entity_type: entityType,
      entity_id: eid,
      riskLevel,
      riskScore,
      riskFactors: [
        ...(daysSinceUpdate > 14 ? [`${daysSinceUpdate} kun davomida yangilanmagan`] : []),
        ...(r['status'] === 'stalled' ? ["Jarayon to'xtagan"] : []),
      ],
      rescueScenario: {
        actions: ["Shaxsiy qo'ng'iroq qilish", 'Maxsus taklif yuborish', 'Yuqori rahbariyat bilan aloqa'],
        timeline: '3-5 kun',
        successProbability: Math.max(20, 80 - riskScore),
        keyMessage: "Sizning ehtiyojlaringiz bizga muhim, birgalikda yechim topamiz",
      },
      retentionOffer: riskLevel === 'yuqori' ? '10% chegirma + bepul yetkazib berish' : null,
    };
  }
}
