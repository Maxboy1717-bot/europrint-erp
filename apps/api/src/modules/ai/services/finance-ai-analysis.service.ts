/**
 * @module finance-ai-analysis.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { AI_SHORT_MAX_TOKENS } from '@common/constants/app.constants';
/**
 * Finance AI Analysis Service — Budget variance, Invoice classification, Fraud risk
 */
import { Injectable, Logger } from '@nestjs/common';
import { isErr, safeJsonParse, Result, AppError, safeCall } from '@common/result';
import { AiRouterService } from '../application/services/ai-router.service';

export interface BudgetVarianceExplanation {
  variancePercent: number;
  mainCauses: string[];
  isAcceptable: boolean;
  correctionActions: string[];
  trend: 'IMPROVING' | 'WORSENING' | 'STABLE';
}

@Injectable()
export class FinanceAiAnalysisService {
  private readonly logger = new Logger(FinanceAiAnalysisService.name);

  constructor(private readonly ai: AiRouterService) {}

  // ─── Byudjet og'ish tushuntirish ─────────────────────────────────────────

  async explainBudgetVariance(
    category: string,
    budgeted: number,
    actual: number,
    context: string,
    userId: number,
  ): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      this.logger.log(`Finance AI: byudjet farqi tahlili: ${category} (byudjet=${budgeted}, amalda=${actual})`);
      const variance = actual - budgeted;
      const variancePct = budgeted > 0 ? Math.round((variance / budgeted) * 100) : 0;
  
      const prompt = `
  EuroPrint byudjet og'ishini tushuntiring.
  
  KATEGORIYA: ${category}
  REJALASHTIRILGAN: ${budgeted.toLocaleString()} UZS
  HAQIQIY: ${actual.toLocaleString()} UZS
  OG'ISH: ${variance > 0 ? '+' : ''}${variance.toLocaleString()} UZS (${variancePct > 0 ? '+' : ''}${variancePct}%)
  
  KONTEKST: ${context}
  
  JSON formatda:
  {
    "variancePercent": ${variancePct},
    "mainCauses": ["...", "..."],
    "isAcceptable": true/false,
    "correctionActions": ["...", "..."],
    "trend": "IMPROVING|WORSENING|STABLE"
  }
  `;
  
      const aiResult = await this.ai.call({
        taskType: 'finance.budget_variance_explain',
        prompt,
        maxTokens: AI_SHORT_MAX_TOKENS,
        temperature: 0.3,
        userId,
      });
      if (isErr(aiResult)) {
        this.logger.warn(`AI so'rovi xato: ${aiResult.error.message}`);
        return {
          variancePercent: variancePct,
          mainCauses: ['Tahlil qilib bo\'lmadi'],
          isAcceptable: Math.abs(variancePct) < 10,
          correctionActions: [],
          trend: 'STABLE',
        };
      }
  
      const jsonMatch = aiResult.data.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = safeJsonParse<BudgetVarianceExplanation>(jsonMatch[0]);
        if (parsed) return parsed;
      }
  
      return {
        variancePercent: variancePct,
        mainCauses: ['Tahlil qilib bo\'lmadi'],
        isAcceptable: Math.abs(variancePct) < 10,
        correctionActions: [],
        trend: 'STABLE',
      };
    });
  }

  // ─── Invoice tasnifi ─────────────────────────────────────────────────────

  async classifyInvoice(
    description: string,
    amount: number,
    vendor: string,
    userId: number,
  ): Promise<{ category: string; subcategory: string; taxCode: string; confidence: number }> {
    const prompt = `
EuroPrint fakturasini tasniflay.

YETKAZUVCHI: ${vendor}
MIQDOR: ${amount.toLocaleString()} UZS
TAVSIF: ${description}

EuroPrint uchun odatdagi kategoriyalar:
- Materiallar (qog'oz, siyoh, plyonka)
- Texnik xizmat (uskunalar ta'miri)
- Kommunal to'lovlar
- Marketing va reklama
- IT va dasturiy ta'minot
- Ofis xarajatlari
- Transport va yetkazib berish
- HR va o'qitish

JSON formatda:
{
  "category": "...",
  "subcategory": "...",
  "taxCode": "...",
  "confidence": <0-100>
}
`;

    const aiResult = await this.ai.call({
      taskType: 'finance.invoice_classify',
      prompt,
      maxTokens: 300,
      temperature: 0.2,
      userId,
    });
    if (isErr(aiResult)) {
      this.logger.warn(`AI so'rovi xato: ${aiResult.error.message}`);
      return { category: 'Boshqa', subcategory: '', taxCode: '', confidence: 0 };
    }

    const jsonMatch = aiResult.data.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = safeJsonParse<{ category: string; subcategory: string; taxCode: string; confidence: number }>(jsonMatch[0]);
      if (parsed) return parsed;
    }

    return { category: 'Boshqa', subcategory: '', taxCode: '', confidence: 0 };
  }

  // ─── Fraud risk ──────────────────────────────────────────────────────────

  async assessFraudRisk(
    transactionData: Record<string, unknown>,
    userId: number,
  ): Promise<{ riskLevel: 'HIGH' | 'MEDIUM' | 'LOW'; riskScore: number; redFlags: string[] }> {
    const prompt = `
EuroPrint moliyaviy tranzaksiya fraud xavfini baholang.

TRANZAKSIYA:
${JSON.stringify(transactionData, null, 2)}

JSON formatda:
{
  "riskLevel": "HIGH|MEDIUM|LOW",
  "riskScore": <0-100>,
  "redFlags": ["...", "..."]
}
`;

    const aiResult = await this.ai.call({
      taskType: 'finance.fraud_risk',
      prompt,
      maxTokens: 300,
      temperature: 0.1,
      userId,
    });
    if (isErr(aiResult)) {
      this.logger.warn(`AI so'rovi xato: ${aiResult.error.message}`);
      return { riskLevel: 'LOW', riskScore: 0, redFlags: [] };
    }

    const jsonMatch = aiResult.data.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = safeJsonParse<{ riskLevel: 'HIGH' | 'MEDIUM' | 'LOW'; riskScore: number; redFlags: string[] }>(jsonMatch[0]);
      if (parsed) return parsed;
    }

    return { riskLevel: 'LOW', riskScore: 0, redFlags: [] };
  }
}
