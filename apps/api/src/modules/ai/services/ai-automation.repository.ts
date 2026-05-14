/**
 * @module ai-automation.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { db } from '@shared/db';
import {
  crmLeads,
  crmDeals,
  hrCandidateFunnels,
  aiUsageLogs,
  glDocuments,
} from '@europrint/schemas';
import { eq, isNull, and, count, gte, sql } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';

@Injectable()
export class AiAutomationRepository {
  private readonly logger = new Logger(AiAutomationRepository.name);

  async getTodayAiOpsCount(today: Date): Promise<Result<number>> {
    return safeCall(async () => {
      const [row] = await db.select({ cnt: count() }).from(aiUsageLogs).where(gte(aiUsageLogs.createdAt, today));
      return Number(row?.cnt ?? 0);
      }, 'DB_ERROR');
  }

  async getUnscoredLeadsCount(): Promise<Result<number>> {
    return safeCall(async () => {
      const [row] = await db.select({ cnt: count() }).from(crmLeads).where(and(isNull(crmLeads.deleted_at), eq(crmLeads.status, 'new')));
      return Number(row?.cnt ?? 0);
      }, 'DB_ERROR');
  }

  async getUnscreenedCandidatesCount(): Promise<Result<number>> {
    return safeCall(async () => {
      const [row] = await db.select({ cnt: count() }).from(hrCandidateFunnels).where(and(eq(hrCandidateFunnels.funnelStage, 'NEW'), eq(hrCandidateFunnels.isActive, true), isNull(hrCandidateFunnels.screeningScore)));
      return Number(row?.cnt ?? 0);
      }, 'DB_ERROR');
  }

  async logAutomationUsage(data: { module: string; action: string; model: string }): Promise<void> {
    await db.insert(aiUsageLogs).values({
      id:          sql`DEFAULT`,
      module:      data.module,
      action:      data.action,
      model:       data.model,
      inputTokens: 0,
      outputTokens: 0,
      cost:        '0',
      status:      'success',
    }).catch((e: unknown) => { this.logger.warn('[AiAuto] logAutomationUsage failed', String(e)); });
  }

  async getUnscoredLeadIds(limit = 10): Promise<Result<Array<{ id: number }>>> {
    return safeCall(async () => {
      // crm_leads has no metadata column; return all 'new' unscored leads
      return db
        .select({ id: crmLeads.id })
        .from(crmLeads)
        .where(
          and(
            isNull(crmLeads.deleted_at),
            eq(crmLeads.status, 'new'),
          ),
        )
        .limit(limit);
      }, 'DB_ERROR');
  }

  /** crm_leads has no metadata column — no-op until column is added */
  async updateLeadWithAiScore(_leadId: number, _aiScore: number, _aiGrade: string, _aiScoredAt: string, _aiSuggestedActions: string[]): Promise<void> { /* no-op */ }

  async updateDealWithProbability(dealId: number, aiProbability: number, aiExpectedClose: string, aiUpdatedAt: string): Promise<void> {
    await db
      .update(crmDeals)
      .set({
        metadata: sql`COALESCE(${crmDeals.metadata}, '{}'::jsonb) || ${JSON.stringify({ aiProbability, aiExpectedClose, aiUpdatedAt })}::jsonb`,
        updated_at: _time.now(),
      })
      .where(eq(crmDeals.id, dealId));
  }

  /** crm_leads has no metadata column — no-op until column is added */
  async updateLeadAiScoreEvent(_leadId: number, _aiScore: number, _aiGrade: string, _aiScoredAt: string): Promise<void> { /* no-op */ }

  async getUnscreenedCandidates(limit = 5): Promise<Result<Array<{ funnelId: number; candidateId: number }>>> {
    return safeCall(async () => {
      const rows = await db
        .select({ funnelId: hrCandidateFunnels.id, candidateId: hrCandidateFunnels.candidateId })
        .from(hrCandidateFunnels)
        .where(and(
          eq(hrCandidateFunnels.funnelStage, 'NEW'),
          eq(hrCandidateFunnels.isActive, true),
          isNull(hrCandidateFunnels.screeningScore),
        ))
        .limit(limit);
      return rows as Array<{ funnelId: number; candidateId: number }>;
    }, 'DB_ERROR');
  }

  async updateCandidateFunnelScreening(
    funnelId: number,
    data: { screeningScore: string; initialScreeningNotes: string; productivityCategory: string },
  ): Promise<void> {
    await db
      .update(hrCandidateFunnels)
      .set({
        screeningScore:        data.screeningScore,
        initialScreeningNotes: data.initialScreeningNotes,
        productivityCategory:  data.productivityCategory as string,
        updatedAt:             _time.now(),
      })
      .where(eq(hrCandidateFunnels.id, funnelId));
  }

  async rejectCandidateFunnel(funnelId: number, quickRejectionReason: string): Promise<void> {
    await db
      .update(hrCandidateFunnels)
      .set({
        funnelStage:          'REJECTED',
        isActive:             false,
        rejectedAt:           _time.now(),
        isQuickRejected:      true,
        quickRejectionReason,
        updatedAt:            _time.now(),
      })
      .where(eq(hrCandidateFunnels.id, funnelId));
  }

  async getActiveDeals(limit = 20): Promise<Array<{ id: number }>> {
    const rows = await db
      .select({ id: crmDeals.id })
      .from(crmDeals)
      .where(isNull(crmDeals.deleted_at))
      .limit(limit);
    return rows as Array<{ id: number }>;
  }

  async updateGlDocumentAiCategory(invoiceId: number, aiData: { aiCategory: string; aiSubcategory: string; aiTaxCode: string; aiConfidence: number; aiClassifiedAt: string }): Promise<void> {
    await db
      .update(glDocuments)
      .set({
        metadata: sql`COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify(aiData)}::jsonb`,
        updatedAt: _time.now(),
      })
      .where(eq(glDocuments.id, invoiceId));
  }
}
