import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
/**
 * AI Automation Events Service — Real-time event triggerlar
 *  - crm.lead.created     → avtomatik lead score
 *  - hr.candidate.added   → avtomatik CV skrining
 *  - finance.invoice.created → avtomatik invoice tasnifi
 */

import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { Result, AppError, safeCall } from '@common/result';
import { OnEvent } from '@nestjs/event-emitter';
import { hrCandidateFunnels } from '@europrint/schemas';
import { db } from '@shared/db';
import { eq } from 'drizzle-orm';

import { HrAiService } from './hr-ai.service';
import { CrmAiService } from './crm-ai.service';
import { FinanceAiAnalysisService } from './finance-ai-analysis.service';
import { AiAutomationRepository } from './ai-automation.repository';

const SYSTEM_USER_ID = 1;

@Injectable()
export class AiAutomationEventsService {
  private readonly logger = new Logger(AiAutomationEventsService.name);

  constructor(
    private readonly hrAi: HrAiService,
    private readonly crmAi: CrmAiService,
    private readonly financeAnalysis: FinanceAiAnalysisService,
    private readonly automationRepo: AiAutomationRepository,
  ) {}

  @OnEvent('crm.lead.created')

  async onLeadCreated(event: { leadId: number; userId: number }): Promise<Result<void, AppError>> {
    return safeCall(async () => {
      const scoreR = await this.crmAi.scoreLead(event.leadId, event.userId);
      if (!scoreR.ok) throw new InternalServerErrorException(scoreR.error.message);
      const result = scoreR.data as { score: number; grade: string };
      await this.automationRepo.updateLeadAiScoreEvent(event.leadId, result.score, result.grade, _time.now().toISOString());
      this.logger.debug(`[AI-EVENT] Lead #${event.leadId} real-time score: ${result.score} (${result.grade})`);
    });
  }

  @OnEvent('hr.candidate.added')
  async onCandidateAdded(event: { candidateId: number; funnelId: number; userId: number }) {
    try {
      const screenR = await this.hrAi.screenCandidate(event.candidateId, event.userId);
      if (!screenR.ok) return;
      const result = screenR.data as { score: number; recommendation: string; aiNotes: string; productivityCategory: string };
      await db
        .update(hrCandidateFunnels)
        .set({
          screeningScore: String(result.score),
          initialScreeningNotes: `[AI Real-time] ${result.recommendation} | ${result.aiNotes.substring(0, 150)}`,
          productivityCategory: result.productivityCategory as string,
          updatedAt: _time.now(),
        })
        .where(eq(hrCandidateFunnels.id, event.funnelId));
      this.logger.debug(`[AI-EVENT] Nomzod #${event.candidateId} real-time skrining: ${result.score}/100`);
    } catch (err) {
      this.logger.warn(`[AI-EVENT] onCandidateAdded xatosi: ${(err as Error).message}`);
    }
  }

  @OnEvent('finance.invoice.created')
  async onInvoiceCreated(event: { invoiceId: number; description: string; amount: number; vendor: string; userId: number }) {
    try {
      const result = await this.financeAnalysis.classifyInvoice(
        event.description,
        event.amount,
        event.vendor,
        event.userId,
      );
      this.logger.debug(
        `[AI-EVENT] Faktura #${event.invoiceId} tasnifi: ${result.category}/${result.subcategory} (${result.confidence}%)`,
      );
      await this.automationRepo.updateGlDocumentAiCategory(event.invoiceId, {
        aiCategory:     result.category,
        aiSubcategory:  result.subcategory,
        aiTaxCode:      result.taxCode,
        aiConfidence:   result.confidence,
        aiClassifiedAt: _time.now().toISOString(),
      });
    } catch (err) {
      this.logger.warn(`[AI-EVENT] onInvoiceCreated xatosi: ${(err as Error).message}`);
    }
  }
}
