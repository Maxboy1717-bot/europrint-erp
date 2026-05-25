/**
 * @module ai-automation-events.service
 * @description Wave 4 round-3 (PA2-18): canonical CQRS `@EventsHandler` form
 *   for the three AI automation triggers. Migrated from the legacy
 *   `@OnEvent('crm.lead.created' | 'hr.candidate.added' | 'finance.invoice.created')`
 *   string topics. Each listener now lives in its own class. EventBridge
 *   re-emits to the legacy string topics for any non-migrated consumers
 *   (none today, but kept defensively) — see EVENT_NAME_MAP entries in
 *   event-bridge.service.ts.
 *
 *   AI Automation Events — Real-time triggerlar:
 *     - CrmLeadCreatedEvent       → avtomatik lead score (AiLeadScoreHandler)
 *     - HrCandidateAddedEvent     → avtomatik CV skrining (AiCandidateScreeningHandler)
 *     - FinanceInvoiceCreatedEvent → avtomatik invoice tasnifi (AiInvoiceClassifyHandler)
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();

import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { Result, AppError, safeCall } from '@common/result';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { HrAiService } from './hr-ai.service';
import { CrmAiService } from './crm-ai.service';
import { FinanceAiAnalysisService } from './finance-ai-analysis.service';
import { AiAutomationRepository } from './ai-automation.repository';
import { CrmLeadCreatedEvent } from '../domain/events/crm-lead-created.event';
import { HrCandidateAddedEvent } from '../domain/events/hr-candidate-added.event';
import { FinanceInvoiceCreatedEvent } from '../domain/events/finance-invoice-created.event';

// ---------------------------------------------------------------------------
// CrmLeadCreatedEvent — auto-score the freshly created lead and persist
// score + grade.
// ---------------------------------------------------------------------------
@Injectable()
@EventsHandler(CrmLeadCreatedEvent)
export class AiLeadScoreHandler implements IEventHandler<CrmLeadCreatedEvent> {
  private readonly logger = new Logger(AiLeadScoreHandler.name);

  constructor(
    private readonly crmAi: CrmAiService,
    private readonly automationRepo: AiAutomationRepository,
  ) {}

  async handle(event: CrmLeadCreatedEvent): Promise<Result<void, AppError>> {
    const { leadId, userId } = event.props;
    return safeCall(async () => {
      const scoreR = await this.crmAi.scoreLead(leadId, userId);
      if (!scoreR.ok) throw new InternalServerErrorException(scoreR.error.message);
      const result = scoreR.data as { score: number; grade: string };
      await this.automationRepo.updateLeadAiScoreEvent(
        leadId,
        result.score,
        result.grade,
        _time.now().toISOString(),
      );
      this.logger.debug(
        `[AI-EVENT] Lead #${leadId} real-time score: ${result.score} (${result.grade})`,
      );
    });
  }
}

// ---------------------------------------------------------------------------
// HrCandidateAddedEvent — auto-screen the candidate's CV.
// ---------------------------------------------------------------------------
@Injectable()
@EventsHandler(HrCandidateAddedEvent)
export class AiCandidateScreeningHandler
  implements IEventHandler<HrCandidateAddedEvent>
{
  private readonly logger = new Logger(AiCandidateScreeningHandler.name);

  constructor(
    private readonly hrAi: HrAiService,
    private readonly automationRepo: AiAutomationRepository,
  ) {}

  async handle(event: HrCandidateAddedEvent): Promise<void> {
    const { candidateId, funnelId, userId } = event.props;
    try {
      const screenR = await this.hrAi.screenCandidate(candidateId, userId);
      if (!screenR.ok) return;
      const result = screenR.data as {
        score: number;
        recommendation: string;
        aiNotes: string;
        productivityCategory: string;
      };
      await this.automationRepo.updateCandidateFunnelScreening(funnelId, {
        screeningScore:        String(result.score),
        initialScreeningNotes: `[AI Real-time] ${result.recommendation} | ${result.aiNotes.substring(0, 150)}`,
        productivityCategory:  result.productivityCategory as string,
      });
      this.logger.debug(
        `[AI-EVENT] Nomzod #${candidateId} real-time skrining: ${result.score}/100`,
      );
    } catch (err) {
      this.logger.warn(`[AI-EVENT] onCandidateAdded xatosi: ${(err as Error).message}`);
    }
  }
}

// ---------------------------------------------------------------------------
// FinanceInvoiceCreatedEvent — auto-classify the new invoice.
// ---------------------------------------------------------------------------
@Injectable()
@EventsHandler(FinanceInvoiceCreatedEvent)
export class AiInvoiceClassifyHandler
  implements IEventHandler<FinanceInvoiceCreatedEvent>
{
  private readonly logger = new Logger(AiInvoiceClassifyHandler.name);

  constructor(
    private readonly financeAnalysis: FinanceAiAnalysisService,
    private readonly automationRepo: AiAutomationRepository,
  ) {}

  async handle(event: FinanceInvoiceCreatedEvent): Promise<void> {
    const { invoiceId, description, amount, vendor, userId } = event.props;
    try {
      const result = await this.financeAnalysis.classifyInvoice(
        description,
        amount,
        vendor,
        userId,
      );
      this.logger.debug(
        `[AI-EVENT] Faktura #${invoiceId} tasnifi: ${result.category}/${result.subcategory} (${result.confidence}%)`,
      );
      await this.automationRepo.updateGlDocumentAiCategory(invoiceId, {
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

// Back-compat marker — ai.module.ts still imports/exports
// `AiAutomationEventsService`. Keep an empty class so module wiring continues
// to compile while the three handlers above own the runtime behaviour.
@Injectable()
export class AiAutomationEventsService {}
