import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { safeCall, Ok, Result, AppError } from '@common/result';
import { db } from '@shared/db';
import {
  crmLeads,
  crmDeals,
  hrCandidateFunnels,
  users,
} from '@europrint/schemas';
import {
  eq,
  isNull,
  and,
  isNotNull,
  desc,
  sql,
} from 'drizzle-orm';
import { HrAiService } from './hr-ai.service';
import { CrmAiService } from './crm-ai.service';
import { WmsAiService } from './wms-ai.service';
import { AiAutomationRepository } from './ai-automation.repository';

import { MAX_NAME_LENGTH } from '@common/constants/app.constants';
const SYSTEM_USER_ID = 1;

@Injectable()
export class AiAutomationService {
  private readonly logger = new Logger(AiAutomationService.name);
  private isRunning: Record<string, boolean> = {};

  constructor(
    private readonly hrAi: HrAiService,
    private readonly crmAi: CrmAiService,
    private readonly wmsAi: WmsAiService,
    private readonly repo: AiAutomationRepository,
  ) {}

  @Cron('*/15 * * * *')

  async autoScoreNewLeads(): Promise<void> {
    if (this.isRunning['lead_score']) return;
    this.isRunning['lead_score'] = true;
    try {
      const unscoredResult = await this.repo.getUnscoredLeadIds(10);
      const unscored = unscoredResult.ok ? unscoredResult.data : [];
      if (unscored.length === 0) return;
      this.logger.log(`[AI-AUTO] ${unscored.length} ta lead scoring`);
      for (const lead of unscored) {
        try {
          const scoreR = await this.crmAi.scoreLead(lead.id, SYSTEM_USER_ID);
          if (!scoreR.ok) continue;
          const result = scoreR.data as { score: number; grade: string; suggestedActions: string[] };
          await this.repo.updateLeadWithAiScore(lead.id, result.score, result.grade, _time.now().toISOString(), result.suggestedActions);
          this.logger.debug(`[AI-AUTO] Lead #${lead.id}: ${result.score} (${result.grade})`);
        } catch (err) {
          this.logger.warn(`[AI-AUTO] Lead #${lead.id} scoring xatosi: ${(err as Error).message}`);
        }
      }
    } finally {
      this.isRunning['lead_score'] = false;
    }
  }

  @Cron('*/30 * * * *')
  async autoScreenNewCandidates() {
    if (this.isRunning['candidate_screen']) return;
    this.isRunning['candidate_screen'] = true;
    try {
      const unscreened = await db
        .select({ funnelId: hrCandidateFunnels.id, candidateId: hrCandidateFunnels.candidateId })
        .from(hrCandidateFunnels)
        .where(
          and(
            eq(hrCandidateFunnels.funnelStage, 'NEW'),
            eq(hrCandidateFunnels.isActive, true),
            isNull(hrCandidateFunnels.screeningScore),
          ),
        )
        .limit(5);
      if (unscreened.length === 0) return;
      this.logger.log(`[AI-AUTO] ${unscreened.length} ta nomzod skrining`);
      for (const item of unscreened) {
        try {
          const screenR = await this.hrAi.screenCandidate(item.candidateId, SYSTEM_USER_ID);
          if (!screenR.ok) continue;
          const result = screenR.data as { score: number; recommendation: string; aiNotes: string; productivityCategory: string; weaknesses: string[] };
          const productivityCategory: string = result.productivityCategory;
          await db
            .update(hrCandidateFunnels)
            .set({
              screeningScore: String(result.score),
              initialScreeningNotes: `[AI] ${result.recommendation}: ${result.aiNotes.substring(0, MAX_NAME_LENGTH)}`,
              productivityCategory,
              updatedAt: _time.now(),
            })
            .where(eq(hrCandidateFunnels.id, item.funnelId));
          if (result.score < 30 && result.recommendation === 'REJECT') {
            await db
              .update(hrCandidateFunnels)
              .set({
                funnelStage: 'REJECTED',
                isActive: false,
                rejectedAt: _time.now(),
                isQuickRejected: true,
                quickRejectionReason: `[AI Avtomatik] Ball: ${result.score}/100. ${result.weaknesses.join('; ')}`,
                updatedAt: _time.now(),
              })
              .where(eq(hrCandidateFunnels.id, item.funnelId));
            this.logger.debug(`[AI-AUTO] Nomzod #${item.candidateId} rad etildi (${result.score})`);
          }
        } catch (err) {
          this.logger.warn(`[AI-AUTO] Nomzod #${item.candidateId} xatosi: ${(err as Error).message}`);
        }
      }
    } finally {
      this.isRunning['candidate_screen'] = false;
    }
  }

  @Cron('0 9 * * 1')
  async autoUpdateDealProbabilities(): Promise<Result<void, AppError>> {
    if (this.isRunning['deal_prob']) return Ok();
    this.isRunning['deal_prob'] = true;
    try {
      return await safeCall(async () => {
        const activeDeals = await db
          .select({ id: crmDeals.id })
          .from(crmDeals)
          .where(isNull(crmDeals.deleted_at))
          .limit(20);
        this.logger.log(`[AI-AUTO] ${activeDeals.length} ta bitim ehtimolini yangilash`);
        for (const deal of activeDeals) {
          try {
            const result = await this.crmAi.predictDealProbability(deal.id, SYSTEM_USER_ID);
            await this.repo.updateDealWithProbability(deal.id, result.probability, result.expectedCloseDate, _time.now().toISOString());
          } catch (err) {
            this.logger.warn(`[AI-AUTO] Deal #${deal.id} xatosi: ${(err as Error).message}`);
          }
        }
      });
    } finally {
      this.isRunning['deal_prob'] = false;
    }
  }

  async runAllPendingJobs() {
    this.logger.log('[AI-AUTO] Barcha pending AI ishlar boshlanmoqda...');
    await Promise.allSettled([
      this.autoScoreNewLeads(),
      this.autoScreenNewCandidates(),
    ]);
    this.logger.log('[AI-AUTO] Pending joblar tugadi');
  }

  async getAutomationStatus() {
    const today = _time.now();
    today.setHours(0, 0, 0, 0);
    let todayAiOpsCount = 0;
    let unscoredLeadsCount = 0;
    let unscreenedCandidatesCount = 0;
    try { const r = await this.repo.getTodayAiOpsCount(today); if (r.ok) todayAiOpsCount = r.data; }
    catch { this.logger.warn('[AI-AUTO] ai_usage_logs query failed, using fallback'); }
    try { const r = await this.repo.getUnscoredLeadsCount(); if (r.ok) unscoredLeadsCount = r.data; }
    catch { this.logger.warn('[AI-AUTO] crm_leads query failed, using fallback'); }
    try { const r = await this.repo.getUnscreenedCandidatesCount(); if (r.ok) unscreenedCandidatesCount = r.data; }
    catch { this.logger.warn('[AI-AUTO] hr_candidate_funnels query failed, using fallback'); }
    return {
      todayAiOperations: todayAiOpsCount,
      pendingLeadScores: unscoredLeadsCount,
      pendingCandidateScreenings: unscreenedCandidatesCount,
      runningJobs: Object.entries(this.isRunning).filter(([, v]) => v).map(([k]) => k),
      automationCoverage: {
        hrRecruitment: '80%', crmLeads: '80%', finance: '70%', wms: '60%', marketing: '75%', director: '85%',
      },
    };
  }
}
