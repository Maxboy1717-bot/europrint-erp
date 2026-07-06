/**
 * @module crm-ai.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { AI_SHORT_MAX_TOKENS, AI_MAX_TOKENS_STANDARD } from '@common/constants/app.constants';
/**
 * CRM AI Service — Lead scoring, Deal probability, Churn risk, Next best action
 */
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { isErr, safeJsonParse, Result, AppError, safeCall } from '@common/result';
import { AiRouterService } from '../application/services/ai-router.service';
import { AiDataRepository } from './ai-data.repository';
import type { LeadScoreResult, DealProbabilityResult, ChurnRiskResult } from './crm-ai.types';
export type { LeadScoreResult, DealProbabilityResult, ChurnRiskResult };

@Injectable()
export class CrmAiService {
  private readonly logger = new Logger(CrmAiService.name);

  constructor(
    private readonly ai:       AiRouterService,
    private readonly dataRepo: AiDataRepository,
    private readonly i18n:     I18nService,
  ) {}

  // ─── Lead Scoring ────────────────────────────────────────────────────────

  async scoreLead(leadId: number, userId: number): Promise<Result<object, AppError>>{
    return safeCall(async () => {
      const lead = await this.dataRepo.getLeadById(leadId);
      if (!lead) throw new InternalServerErrorException(await this.i18n.t('errors.leadNotFoundWithId', { args: { id: leadId } }));
      const prompt = this.buildLeadScorePrompt(lead);
      const aiResult = await this.ai.call({ taskType: 'crm.lead_score', prompt, maxTokens: AI_SHORT_MAX_TOKENS, temperature: 0.3, userId });
      if (isErr(aiResult)) {
        this.logger.warn(`AI so'rovi xato: ${aiResult.error.message}`);
        return { score: 50, grade: 'WARM', reasoning: '', suggestedActions: [] };
      }
      const jsonMatch = aiResult.data.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = safeJsonParse<LeadScoreResult>(jsonMatch[0]);
        if (parsed) return parsed;
      }
      return { score: 50, grade: 'WARM', reasoning: aiResult.data.text, suggestedActions: [] };
    });
  }

  private buildLeadScorePrompt(lead: Record<string, unknown>): string {
    return `
  EuroPrint CRM: Lead sifatini baholang.

  LEAD MA'LUMOTLARI:
  Nomi: ${(lead.title as string | null | undefined) ?? (lead.name as string | null | undefined) ?? 'noma\'lum'}
  Kompaniya: ${(lead.companyTitle as string | null | undefined) ?? 'ko\'rsatilmagan'}
  Manba: ${(lead.sourceId as string | number | null | undefined) ?? 'noma\'lum'}
  Status: ${(lead.statusId as string | number | null | undefined) ?? 'NEW'}
  Izoh: ${(lead.description as string | null | undefined) ?? 'yo\'q'}

  EuroPrint bosma mahsulotlar va dizayn kompaniyasi.
  B2B va B2C segmentlar.

  JSON formatda:
  {
    "score": <0-100>,
    "grade": "HOT|WARM|COLD",
    "reasoning": "...",
    "suggestedActions": ["...", "..."],
    "estimatedDealValue": <UZS yoki null>
  }
  `;
  }

  // ─── Deal Probability ────────────────────────────────────────────────────

  async predictDealProbability(dealId: number, userId: number): Promise<DealProbabilityResult> {
    const deal = await this.dataRepo.getDealById(dealId);
    if (!deal) throw new InternalServerErrorException(await this.i18n.t('errors.dealNotFoundWithId', { args: { id: dealId } }));
    const prompt = this.buildDealProbabilityPrompt(deal);
    const aiResult = await this.ai.call({ taskType: 'crm.deal_probability', prompt, maxTokens: AI_SHORT_MAX_TOKENS, temperature: 0.3, userId });
    if (isErr(aiResult)) {
      this.logger.warn(`AI so'rovi xato: ${aiResult.error.message}`);
      return { probability: 50, expectedCloseDate: '', riskFactors: [], successFactors: [], recommendation: '' };
    }
    const jsonMatch = aiResult.data.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = safeJsonParse<DealProbabilityResult>(jsonMatch[0]);
      if (parsed) return parsed;
    }
    return { probability: 50, expectedCloseDate: '', riskFactors: [], successFactors: [], recommendation: aiResult.data.text };
  }

  private buildDealProbabilityPrompt(deal: Record<string, unknown>): string {
    return `
EuroPrint CRM: Bitim yopilish ehtimolini bashorat qiling.

BITIM:
Nomi: ${(deal.title as string | null | undefined) ?? ''}
Qiymati: ${(deal.amount as number | null | undefined) ?? 0} UZS
Status: ${(deal.statusId as string | number | null | undefined) ?? 'noma\'lum'}
Bosqich: ${(deal.stageId as string | number | null | undefined) ?? 'noma\'lum'}
Yopilish sanasi: ${(deal.closeDate as string | null | undefined) ?? 'belgilanmagan'}
Izoh: ${(deal.description as string | null | undefined) ?? 'yo\'q'}

EuroPrint bosma mahsulotlar kompaniyasi.

JSON formatda:
{
  "probability": <0-100>,
  "expectedCloseDate": "YYYY-MM-DD yoki null",
  "riskFactors": ["...", "..."],
  "successFactors": ["...", "..."],
  "recommendation": "..."
}
`;
  }

  // ─── Churn Risk ──────────────────────────────────────────────────────────

  async assessChurnRisk(contactId: number, activityData: Record<string, unknown>, userId: number): Promise<ChurnRiskResult> {
    const contact = await this.dataRepo.getContactById(contactId);
    const prompt = this.buildChurnRiskPrompt(contact, contactId, activityData);
    const aiResult = await this.ai.call({ taskType: 'crm.churn_risk', prompt, maxTokens: AI_SHORT_MAX_TOKENS, temperature: 0.3, userId });
    if (isErr(aiResult)) {
      this.logger.warn(`AI so'rovi xato: ${aiResult.error.message}`);
      return { riskLevel: 'MEDIUM', riskScore: 50, mainReasons: [], retentionActions: [] };
    }
    const jsonMatch = aiResult.data.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = safeJsonParse<ChurnRiskResult>(jsonMatch[0]);
      if (parsed) return parsed;
    }
    return { riskLevel: 'MEDIUM', riskScore: 50, mainReasons: [], retentionActions: [] };
  }

  private buildChurnRiskPrompt(contact: Record<string, unknown> | null | undefined, contactId: number, activityData: Record<string, unknown>): string {
    return `
EuroPrint CRM: Mijoz ketish xavfini baholang.

MIJOZ: ${(contact?.name as string | null | undefined) ?? `ID:${contactId}`}
KOMPANIYA: ${(contact?.company as string | null | undefined) ?? 'noma\'lum'}

FAOLLIK MA'LUMOTLARI:
${JSON.stringify(activityData, null, 2)}

JSON formatda:
{
  "riskLevel": "HIGH|MEDIUM|LOW",
  "riskScore": <0-100>,
  "mainReasons": ["...", "..."],
  "retentionActions": ["...", "...", "..."]
}
`;
  }

  // ─── Email Template ──────────────────────────────────────────────────────

  async generateEmailTemplate(
    purpose: 'FOLLOW_UP' | 'PROPOSAL' | 'RE_ENGAGE' | 'THANK_YOU',
    contactName: string,
    context: string,
    userId: number,
  ): Promise<{ subject: string; body: string }> {
    this.logger.log(`crm ai: AI tahlil boshlanmoqda`);
    const purposeMap = {
      FOLLOW_UP: 'follow-up (kuzatuv xati)',
      PROPOSAL: 'taklif-komerstsiya xati',
      RE_ENGAGE: 'qayta aloqa o\'rnatish xati',
      THANK_YOU: 'minnatdorlik xati',
    };

    const prompt = `
EuroPrint kompaniyasi nomidan ${purposeMap[purpose]} yozing.

QABUL QILUVCHI: ${contactName}
KONTEKST: ${context}

EuroPrint — bosma mahsulotlar, dizayn va brend yechimlar kompaniyasi.

Xat O'zbek yoki Rus tilida bo'lishi mumkin (kontekstga qarab tanlang).
Qisqa, professional, samimiy.

JSON formatda:
{
  "subject": "...",
  "body": "..."
}
`;

    const aiResult = await this.ai.call({
      taskType: 'crm.email_template',
      prompt,
      maxTokens: 600,
      temperature: 0.7,
      userId,
    });
    if (isErr(aiResult)) {
      this.logger.warn(`AI so'rovi xato: ${aiResult.error.message}`);
      return { subject: 'EuroPrint — Aloqa', body: '' };
    }

    const jsonMatch = aiResult.data.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = safeJsonParse<{ subject: string; body: string }>(jsonMatch[0]);
      if (parsed) return parsed;
    }

    return { subject: 'EuroPrint — Aloqa', body: aiResult.data.text };
  }

  // ─── Next Best Action ────────────────────────────────────────────────────

  async nextBestAction(
    dealId: number,
    lastActivities: string[],
    userId: number,
  ): Promise<{ action: string; priority: 'HIGH' | 'MEDIUM' | 'LOW'; deadline: string; script?: string }> {
    const deal = await this.dataRepo.getDealSummaryById(dealId);

    const prompt = `
EuroPrint CRM: Keyingi eng yaxshi harakat nima?

BITIM: ${deal?.title ?? `#${dealId}`}
QIYMAT: ${deal?.amount ?? 0} UZS
BOSQICH: ${deal?.stage_id ?? 'noma\'lum'}

OXIRGI HARAKATLAR:
${(Array.isArray(lastActivities) ? lastActivities : []).map((a, i) => `${i + 1}. ${a}`).join('\n')}

JSON formatda:
{
  "action": "...",
  "priority": "HIGH|MEDIUM|LOW",
  "deadline": "bugun|ertaga|bu hafta|...",
  "script": "optional telefon/xat skripti"
}
`;

    const aiResult = await this.ai.call({
      taskType: 'crm.next_best_action',
      prompt,
      maxTokens: AI_MAX_TOKENS_STANDARD,
      temperature: 0.5,
      userId,
    });
    if (isErr(aiResult)) {
      this.logger.warn(`AI so'rovi xato: ${aiResult.error.message}`);
      return { action: '', priority: 'MEDIUM', deadline: 'bu hafta' };
    }

    const jsonMatch = aiResult.data.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = safeJsonParse<{ action: string; priority: 'HIGH' | 'MEDIUM' | 'LOW'; deadline: string; script?: string }>(jsonMatch[0]);
      if (parsed) return parsed;
    }

    return { action: aiResult.data.text, priority: 'MEDIUM', deadline: 'bu hafta' };
  }
}
