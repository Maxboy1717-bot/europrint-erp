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

@Injectable()
export class DirectorAiStrategyService {
  private readonly logger = new Logger(DirectorAiStrategyService.name);

  constructor(
    private readonly ai:       AiRouterService,
    private readonly dataRepo: AiDataRepository,
  ) {}

  // ─── Strategik tavsiyalar ────────────────────────────────────────────────

  async generateStrategicRecommendations(
    businessContext: {
      currentRevenue: number;
      growthRate: number;
      mainChallenges: string[];
      strengths: string[];
      marketOpportunities: string[];
    },
    userId: number,
  ): Promise<StrategicRecommendations> {
    this.logger.log(`director ai strategy: AI tahlil boshlanmoqda`);
    const prompt = `
EuroPrint uchun strategik tavsiyalar ishlab chiqing.

BIZNES HOLATI:
Daromad: ${businessContext.currentRevenue.toLocaleString()} UZS
O'sish sur'ati: ${businessContext.growthRate}%
Asosiy muammolar: ${businessContext.mainChallenges.join('; ')}
Kuchli tomonlar: ${businessContext.strengths.join('; ')}
Bozor imkoniyatlari: ${businessContext.marketOpportunities.join('; ')}

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

    const aiResult = await this.ai.call({
      taskType: 'director.strategic_recommend',
      prompt,
      maxTokens: 900,
      temperature: 0.6,
      userId,
    });
    if (isErr(aiResult)) {
      this.logger.warn(`AI so'rovi xato: ${aiResult.error.message}`);
      return {
        shortTerm: ['Ma\'lumot yetarli emas'],
        mediumTerm: [],
        longTerm: [],
        topPriority: '',
        estimatedROI: 'Aniqlanmadi',
      };
    }

    const jsonMatch = aiResult.data.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = safeJsonParse<StrategicRecommendations>(jsonMatch[0]);
      if (parsed) return parsed;
    }

    return {
      shortTerm: ['Ma\'lumot yetarli emas'],
      mediumTerm: [],
      longTerm: [],
      topPriority: aiResult.data.text.substring(0, MAX_NAME_LENGTH),
      estimatedROI: 'Aniqlanmadi',
    };
  }

  // ─── Ijroiya xulosasi (Avto-yakuniy hisobot) ───────────────────────────

  async generateExecutiveSummary(userId: number): Promise<Result<object, AppError>>{
    return safeCall(async () => {
      this.logger.log(`director ai strategy: AI tahlil boshlanmoqda`);
      const today = _time.now();
      const { totalEmployees, activeLeads, activeDeals, openPositions } =
        await this.dataRepo.getExecutiveSummaryMetrics();

      const prompt = `
  EuroPrint bugungi ijroiya xulosasi.

  REAL MA'LUMOTLAR (${today.toLocaleDateString('uz-UZ')}):
  - Jami xodimlar: ${totalEmployees}
  - Faol leadlar: ${activeLeads}
  - Faol bitimlar: ${activeDeals}
  - Rekruting funnelda: ${openPositions} nomzod

  EuroPrint bosma kompaniyasi, Toshkent.

  Qisqa ijroiya xulosasi (1 paragraf), asosiy metriklar va tavsiyalar.

  JSON formatda:
  {
    "date": "${today.toISOString().split('T')[0]}",
    "headline": "...",
    "keyMetrics": [
      {"name": "Xodimlar", "value": "${totalEmployees}", "trend": "STABLE"},
      {"name": "Faol leadlar", "value": "${activeLeads}", "trend": "UP"},
      {"name": "Faol bitimlar", "value": "${activeDeals}", "trend": "STABLE"}
    ],
    "alerts": ["..."],
    "recommendations": ["...", "..."],
    "overallHealth": "EXCELLENT|GOOD|FAIR|POOR"
  }
  `;
  
      const aiResult = await this.ai.call({
        taskType: 'director.kpi_explain',
        prompt,
        maxTokens: 700,
        temperature: 0.4,
        userId,
      });
      if (isErr(aiResult)) {
        this.logger.warn(`AI so'rovi xato: ${aiResult.error.message}`);
        return {
          date: today.toISOString().split('T')[0],
          headline: 'EuroPrint kunlik holat',
          keyMetrics: [
            { name: 'Xodimlar', value: String(totalEmployees), trend: 'STABLE' },
            { name: 'Leadlar', value: String(activeLeads), trend: 'STABLE' },
          ],
          alerts: [],
          recommendations: [],
          overallHealth: 'GOOD',
        };
      }
  
      const jsonMatch = aiResult.data.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = safeJsonParse<ExecutiveSummary>(jsonMatch[0]);
        if (parsed) return parsed;
      }
  
      return {
        date: today.toISOString().split('T')[0],
        headline: 'EuroPrint kunlik holat',
        keyMetrics: [
          { name: 'Xodimlar', value: String(totalEmployees), trend: 'STABLE' },
          { name: 'Leadlar', value: String(activeLeads), trend: 'STABLE' },
        ],
        alerts: [],
        recommendations: [],
        overallHealth: 'GOOD',
      };
    });
  }
}
