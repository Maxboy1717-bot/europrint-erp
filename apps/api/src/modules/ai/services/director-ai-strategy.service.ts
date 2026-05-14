/**
 * @module director-ai-strategy.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { MAX_NAME_LENGTH } from '@common/constants/app.constants';
/**
 * Director AI Strategy Service — Strategic recommendations, Executive summary
 */
import { Injectable, Logger } from '@nestjs/common';
import { isErr, safeJsonParse, Result, AppError, safeCall } from '@common/result';
import { AiRouterService } from '../application/services/ai-router.service';
import { AiDataRepository } from './ai-data.repository';
import type { StrategicRecommendations, ExecutiveSummary } from './director-ai.types';
export type { StrategicRecommendations, ExecutiveSummary };

interface StrategicContext {
  currentRevenue: number;
  growthRate: number;
  mainChallenges: string[];
  strengths: string[];
  marketOpportunities: string[];
}

interface SummaryMetrics {
  totalEmployees: number;
  activeLeads: number;
  activeDeals: number;
  openPositions: number;
}

@Injectable()
export class DirectorAiStrategyService {
  private readonly logger = new Logger(DirectorAiStrategyService.name);

  constructor(
    private readonly ai:       AiRouterService,
    private readonly dataRepo: AiDataRepository,
  ) {}

  // ─── Strategik tavsiyalar ────────────────────────────────────────────────

  async generateStrategicRecommendations(
    businessContext: StrategicContext,
    userId: number,
  ): Promise<StrategicRecommendations> {
    this.logger.log(`director ai strategy: AI tahlil boshlanmoqda`);
    const prompt = this.buildStrategyPrompt(businessContext);
    const aiResult = await this.ai.call({
      taskType: 'director.strategic_recommend',
      prompt,
      maxTokens: 900,
      temperature: 0.6,
      userId,
    });
    if (isErr(aiResult)) {
      this.logger.warn(`AI so'rovi xato: ${aiResult.error.message}`);
      return this.buildStrategyFallback('');
    }
    const parsed = this.parseStrategyJson(aiResult.data.text);
    if (parsed) return parsed;
    return this.buildStrategyFallback(aiResult.data.text.substring(0, MAX_NAME_LENGTH));
  }

  private buildStrategyPrompt(c: StrategicContext): string {
    return `
EuroPrint uchun strategik tavsiyalar ishlab chiqing.

BIZNES HOLATI:
Daromad: ${c.currentRevenue.toLocaleString()} UZS
O'sish sur'ati: ${c.growthRate}%
Asosiy muammolar: ${c.mainChallenges.join('; ')}
Kuchli tomonlar: ${c.strengths.join('; ')}
Bozor imkoniyatlari: ${c.marketOpportunities.join('; ')}

EuroPrint — Toshkentdagi bosma mahsulotlar, dizayn va brend yechimlar kompaniyasi.
Raqobatchilar: Avrora, Pixel, boshqa mahalliy bosmachilar.

JSON formatda:
{
  "shortTerm": ["...", "...", "..."],
  "mediumTerm": ["...", "...", "..."],
  "longTerm": ["...", "..."],
  "topPriority": "...",
  "estimatedROI": "..."
}
`;
  }

  private parseStrategyJson(text: string): StrategicRecommendations | null {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return safeJsonParse<StrategicRecommendations>(jsonMatch[0]) ?? null;
  }

  private buildStrategyFallback(topPriority: string): StrategicRecommendations {
    return {
      shortTerm: ['Ma\'lumot yetarli emas'],
      mediumTerm: [],
      longTerm: [],
      topPriority,
      estimatedROI: 'Aniqlanmadi',
    };
  }

  // ─── Ijroiya xulosasi (Avto-yakuniy hisobot) ───────────────────────────

  async generateExecutiveSummary(userId: number): Promise<Result<object, AppError>>{
    return safeCall(async () => {
      this.logger.log(`director ai strategy: AI tahlil boshlanmoqda`);
      const today = _time.now();
      const metrics = await this.dataRepo.getExecutiveSummaryMetrics();
      const prompt = this.buildSummaryPrompt(today, metrics);
      const aiResult = await this.ai.call({
        taskType: 'director.kpi_explain', prompt, maxTokens: 700, temperature: 0.4, userId,
      });
      if (isErr(aiResult)) {
        this.logger.warn(`AI so'rovi xato: ${aiResult.error.message}`);
        return this.buildSummaryFallback(today, metrics);
      }
      const parsed = this.parseSummaryJson(aiResult.data.text);
      return parsed ?? this.buildSummaryFallback(today, metrics);
    });
  }

  private buildSummaryPrompt(today: Date, m: SummaryMetrics): string {
    return `
  EuroPrint bugungi ijroiya xulosasi.

  REAL MA'LUMOTLAR (${today.toLocaleDateString('uz-UZ')}):
  - Jami xodimlar: ${m.totalEmployees}
  - Faol leadlar: ${m.activeLeads}
  - Faol bitimlar: ${m.activeDeals}
  - Rekruting funnelda: ${m.openPositions} nomzod

  EuroPrint bosma kompaniyasi, Toshkent.

  Qisqa ijroiya xulosasi (1 paragraf), asosiy metriklar va tavsiyalar.

  JSON formatda:
  {
    "date": "${today.toISOString().split('T')[0]}",
    "headline": "...",
    "keyMetrics": [
      {"name": "Xodimlar", "value": "${m.totalEmployees}", "trend": "STABLE"},
      {"name": "Faol leadlar", "value": "${m.activeLeads}", "trend": "UP"},
      {"name": "Faol bitimlar", "value": "${m.activeDeals}", "trend": "STABLE"}
    ],
    "alerts": ["..."],
    "recommendations": ["...", "..."],
    "overallHealth": "EXCELLENT|GOOD|FAIR|POOR"
  }
  `;
  }

  private parseSummaryJson(text: string): ExecutiveSummary | null {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return safeJsonParse<ExecutiveSummary>(jsonMatch[0]) ?? null;
  }

  private buildSummaryFallback(today: Date, m: SummaryMetrics): ExecutiveSummary {
    return {
      date: today.toISOString().split('T')[0],
      headline: 'EuroPrint kunlik holat',
      keyMetrics: [
        { name: 'Xodimlar', value: String(m.totalEmployees), trend: 'STABLE' },
        { name: 'Leadlar', value: String(m.activeLeads), trend: 'STABLE' },
      ],
      alerts: [],
      recommendations: [],
      overallHealth: 'GOOD',
    };
  }
}
