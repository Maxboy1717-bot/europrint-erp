/**
 * @module ai-automation.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { safeCall, Ok, Result, AppError } from '@common/result';
import { HrAiService } from './hr-ai.service';
import { CrmAiService } from './crm-ai.service';
import { WmsAiService } from './wms-ai.service';
import { AiAutomationRepository } from './ai-automation.repository';

import { MAX_NAME_LENGTH, SYSTEM_USER_ID } from '@common/constants/app.constants';

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
      const unscreenedR = await this.repo.getUnscreenedCandidates(5);
      if (!unscreenedR.ok) { this.logger.warn(`[AI-AUTO] getUnscreenedCandidates: ${unscreenedR.error.message}`); return; }
      const unscreened = unscreenedR.data;
      if (unscreened.length === 0) return;
      this.logger.log(`[AI-AUTO] ${unscreened.length} ta nomzod skrining`);
      for (const item of unscreened) {
        await this.screenSingleCandidate(item);
      }
    } finally {
      this.isRunning['candidate_screen'] = false;
    }
  }

  private async screenSingleCandidate(item: { candidateId: number; funnelId: number }): Promise<void> {
    try {
      const screenR = await this.hrAi.screenCandidate(item.candidateId, SYSTEM_USER_ID);
      if (!screenR.ok) return;
      const result = screenR.data as { score: number; recommendation: string; aiNotes: string; productivityCategory: string; weaknesses: string[] };
      await this.repo.updateCandidateFunnelScreening(item.funnelId, {
        screeningScore:        String(result.score),
        initialScreeningNotes: `[AI] ${result.recommendation}: ${result.aiNotes.substring(0, MAX_NAME_LENGTH)}`,
        productivityCategory:  result.productivityCategory,
      });
      if (result.score < 30 && result.recommendation === 'REJECT') {
        await this.repo.rejectCandidateFunnel(
          item.funnelId,
          `[AI Avtomatik] Ball: ${result.score}/100. ${result.weaknesses.join('; ')}`,
        );
        this.logger.debug(`[AI-AUTO] Nomzod #${item.candidateId} rad etildi (${result.score})`);
      }
    } catch (err) {
      this.logger.warn(`[AI-AUTO] Nomzod #${item.candidateId} xatosi: ${(err as Error).message}`);
    }
  }

  @Cron('0 9 * * 1')
  async autoUpdateDealProbabilities(): Promise<Result<void, AppError>> {
    if (this.isRunning['deal_prob']) return Ok();
    this.isRunning['deal_prob'] = true;
    try {
      return await safeCall(async () => {
        const activeDeals = await this.repo.getActiveDeals(20);
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
    const [opsRes, leadsRes, candidatesRes] = await Promise.allSettled([
      this.repo.getTodayAiOpsCount(today),
      this.repo.getUnscoredLeadsCount(),
      this.repo.getUnscreenedCandidatesCount(),
    ]);
    const todayAiOpsCount = opsRes.status === 'fulfilled' && opsRes.value.ok
      ? opsRes.value.data
      : (this.logger.warn('[AI-AUTO] ai_usage_logs query failed, using fallback'), 0);
    const unscoredLeadsCount = leadsRes.status === 'fulfilled' && leadsRes.value.ok
      ? leadsRes.value.data
      : (this.logger.warn('[AI-AUTO] crm_leads query failed, using fallback'), 0);
    const unscreenedCandidatesCount = candidatesRes.status === 'fulfilled' && candidatesRes.value.ok
      ? candidatesRes.value.data
      : (this.logger.warn('[AI-AUTO] hr_candidate_funnels query failed, using fallback'), 0);
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
