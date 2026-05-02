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
      return db
        .select({ id: crmLeads.id })
        .from(crmLeads)
        .where(
          and(
            isNull(crmLeads.deleted_at),
            eq(crmLeads.status, 'new'),
            sql`${crmLeads.metadata}->>'aiScore' IS NULL`,
          ),
        )
        .limit(limit);
      }, 'DB_ERROR');
  }

  async updateLeadWithAiScore(leadId: number, aiScore: number, aiGrade: string, aiScoredAt: string, aiSuggestedActions: string[]): Promise<void> {
    await db
      .update(crmLeads)
      .set({
        metadata: sql`COALESCE(${crmLeads.metadata}, '{}'::jsonb) || ${JSON.stringify({ aiScore, aiGrade, aiScoredAt, aiSuggestedActions })}::jsonb`,
        updated_at: _time.now(),
      })
      .where(eq(crmLeads.id, leadId));
  }

  async updateDealWithProbability(dealId: number, aiProbability: number, aiExpectedClose: string, aiUpdatedAt: string): Promise<void> {
    await db
      .update(crmDeals)
      .set({
        metadata: sql`COALESCE(${crmDeals.metadata}, '{}'::jsonb) || ${JSON.stringify({ aiProbability, aiExpectedClose, aiUpdatedAt })}::jsonb`,
        updated_at: _time.now(),
      })
      .where(eq(crmDeals.id, dealId));
  }

  async updateLeadAiScoreEvent(leadId: number, aiScore: number, aiGrade: string, aiScoredAt: string): Promise<void> {
    await db
      .update(crmLeads)
      .set({
        metadata: sql`COALESCE(${crmLeads.metadata}, '{}'::jsonb) || ${JSON.stringify({ aiScore, aiGrade, aiScoredAt })}::jsonb`,
        updated_at: _time.now(),
      })
      .where(eq(crmLeads.id, leadId));
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
