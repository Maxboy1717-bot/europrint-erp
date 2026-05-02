import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { MAX_NAME_LENGTH } from '@common/constants/app.constants';
/**
 * Director AI Strategy Service — Strategic recommendations, Executive summary
 */
import { Injectable, Logger } from '@nestjs/common';
import { isErr, safeJsonParse, Result, AppError, safeCall } from '@common/result';
import { AiRouterService } from '../application/services/ai-router.service';
import { db } from '@shared/db';
import {
  users,
  crmLeads,
  crmDeals,
  hrCandidateFunnels,
} from '@europrint/schemas';
import { count, eq, isNull } from 'drizzle-orm';

export interface StrategicRecommendations {
  shortTerm: string[];    // 1-3 oy
  mediumTerm: string[];   // 3-12 oy
  longTerm: string[];     // 1-3 yil
  topPriority: string;
  estimatedROI: string;
}

export interface ExecutiveSummary {
  date: string;
  headline: string;
  keyMetrics: Array<{ name: string; value: string; trend: 'UP' | 'DOWN' | 'STABLE' }>;
  alerts: string[];
  recommendations: string[];
  overallHealth: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
}

@Injectable()
export class DirectorAiStrategyService {
  private readonly logger = new Logger(DirectorAiStrategyService.name);

  constructor(private readonly ai: AiRouterService) {}

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
  
      const [totalEmployees] = await db
        .select({ cnt: count() })
        .from(users)
        .where(isNull(users.deletedAt));
  
      const [activeLeads] = await db
        .select({ cnt: count() })
        .from(crmLeads)
        .where(isNull(crmLeads.deleted_at));
  
      const [activeDeals] = await db
        .select({ cnt: count() })
        .from(crmDeals)
        .where(isNull(crmDeals.deleted_at));
  
      const [openPositions] = await db
        .select({ cnt: count() })
        .from(hrCandidateFunnels)
        .where(eq(hrCandidateFunnels.isActive, true));
  
      const prompt = `
  EuroPrint bugungi ijroiya xulosasi.
  
  REAL MA'LUMOTLAR (${today.toLocaleDateString('uz-UZ')}):
  - Jami xodimlar: ${totalEmployees?.cnt ?? 0}
  - Faol leadlar: ${activeLeads?.cnt ?? 0}
  - Faol bitimlar: ${activeDeals?.cnt ?? 0}
  - Rekruting funnelda: ${openPositions?.cnt ?? 0} nomzod
  
  EuroPrint bosma kompaniyasi, Toshkent.
  
  Qisqa ijroiya xulosasi (1 paragraf), asosiy metriklar va tavsiyalar.
  
  JSON formatda:
  {
    "date": "${today.toISOString().split('T')[0]}",
    "headline": "...",
    "keyMetrics": [
      {"name": "Xodimlar", "value": "${totalEmployees?.cnt ?? 0}", "trend": "STABLE"},
      {"name": "Faol leadlar", "value": "${activeLeads?.cnt ?? 0}", "trend": "UP"},
      {"name": "Faol bitimlar", "value": "${activeDeals?.cnt ?? 0}", "trend": "STABLE"}
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
            { name: 'Xodimlar', value: String(totalEmployees?.cnt ?? 0), trend: 'STABLE' },
            { name: 'Leadlar', value: String(activeLeads?.cnt ?? 0), trend: 'STABLE' },
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
          { name: 'Xodimlar', value: String(totalEmployees?.cnt ?? 0), trend: 'STABLE' },
          { name: 'Leadlar', value: String(activeLeads?.cnt ?? 0), trend: 'STABLE' },
        ],
        alerts: [],
        recommendations: [],
        overallHealth: 'GOOD',
      };
    });
  }
}
