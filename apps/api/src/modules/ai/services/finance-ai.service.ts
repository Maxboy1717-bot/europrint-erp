/**
 * @module finance-ai.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { isErr, safeJsonParse, Result, AppError, safeCall } from '@common/result';
import { AiRouterService } from '../application/services/ai-router.service';
import { FinanceAiRepository } from './finance-ai.repository';
import type { AnomalyResult, CashflowForecast, BudgetVarianceExplanation } from './finance-ai.types';
import { AI_SHORT_MAX_TOKENS } from '@common/constants/app.constants';
export type { AnomalyResult, CashflowForecast, BudgetVarianceExplanation };

@Injectable()
export class FinanceAiService {
  private readonly logger = new Logger(FinanceAiService.name);

  constructor(
    private readonly ai: AiRouterService,
    private readonly repo: FinanceAiRepository,
  ) {}

  // ─── Anomaliya aniqlash ──────────────────────────────────────────────────

  async detectAnomalies(
    periodDays: number = 30,
    userId: number,
  ): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      this.logger.log(`Finance AI: anomaliya tekshiruvi: so'nggi ${periodDays} kun`);
      const since = _time.now();
      since.setDate(since.getDate() - periodDays);

      let stats: { totalDocs: number; totalAmount: string } | undefined;
      let recentDocs: Array<{ docNumber: string | null; docType: string | null; status: string | null; date: Date | null }> = [];

      try {
        stats = await this.repo.loadGlStats(since);
        recentDocs = await this.repo.loadRecentDocs(20);
      } catch {
        this.logger.warn('Finance AI: gl_entries mavjud emas, fallback');
      }

      const prompt = `
EuroPrint moliya anomaliyalarini aniqlang.

DAVR: So'nggi ${periodDays} kun
JAMI HUJJATLAR: ${stats?.totalDocs ?? 0}

OXIRGI 20 TA HUJJAT:
${(Array.isArray(recentDocs) ? recentDocs : []).map(d => `${d.docType} | ${d.docNumber} | ${d.status} | ${d.date}`).join('\n')}

EuroPrint bosma mahsulotlar kompaniyasi.
Odatdagi operatsiyalar: to'lovlar, fakturalar, hisobotlar.

Quyidagilarni tekshiring:
- G'ayrioddiy miqdorlar
- Takroriy operatsiyalar
- Noto'g'ri tasniflar
- Fraud belgilari

JSON formatda:
{
  "hasAnomalies": true/false,
  "anomalies": [{"description": "...", "severity": "HIGH|MEDIUM|LOW", "amount": null}],
  "overallRiskScore": <0-100>,
  "recommendation": "..."
}
`;

      const aiResult = await this.ai.call({
        taskType: 'finance.anomaly_detect',
        prompt,
        maxTokens: 600,
        temperature: 0.2,
        userId,
      });
      if (isErr(aiResult)) {
        this.logger.warn(`AI so'rovi xato: ${aiResult.error.message}`);
        return { hasAnomalies: false, anomalies: [], overallRiskScore: 0, recommendation: '' };
      }

      const jsonMatch = aiResult.data.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = safeJsonParse<AnomalyResult>(jsonMatch[0]);
        if (parsed) return parsed;
      }

      return { hasAnomalies: false, anomalies: [], overallRiskScore: 0, recommendation: aiResult.data.text };
    });
  }

  // ─── Pul oqimi bashorati ─────────────────────────────────────────────────

  async forecastCashflow(
    historicalData: Array<{ month: string; inflow: number; outflow: number }>,
    userId: number,
  ): Promise<CashflowForecast> {
    const prompt = `
EuroPrint pul oqimi bashorati.

TARIXIY MA'LUMOTLAR (oxirgi oylar):
${(Array.isArray(historicalData) ? historicalData : []).map(d => `${d.month}: Kirim=${d.inflow.toLocaleString()} UZS, Chiqim=${d.outflow.toLocaleString()} UZS`).join('\n')}

EuroPrint bosma kompaniyasi. Yillik fasliylik: yanvar-mart pastroq, aprel-iyun yuqori.

Keyingi oy uchun bashorat:

JSON formatda:
{
  "nextMonthInflow": <UZS>,
  "nextMonthOutflow": <UZS>,
  "netCashflow": <UZS>,
  "confidence": <0-100>,
  "warnings": ["...", "..."],
  "opportunities": ["...", "..."]
}
`;

    const aiResult = await this.ai.call({
      taskType: 'finance.cashflow_forecast',
      prompt,
      maxTokens: AI_SHORT_MAX_TOKENS,
      temperature: 0.3,
      userId,
    });
    if (isErr(aiResult)) {
      this.logger.warn(`AI so'rovi xato: ${aiResult.error.message}`);
      return { nextMonthInflow: 0, nextMonthOutflow: 0, netCashflow: 0, confidence: 0, warnings: ['Tarixiy ma\'lumot yetarli emas'], opportunities: [] };
    }

    const jsonMatch = aiResult.data.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = safeJsonParse<CashflowForecast>(jsonMatch[0]);
      if (parsed) return parsed;
    }

    return { nextMonthInflow: 0, nextMonthOutflow: 0, netCashflow: 0, confidence: 0, warnings: ['Tarixiy ma\'lumot yetarli emas'], opportunities: [] };
  }
}
