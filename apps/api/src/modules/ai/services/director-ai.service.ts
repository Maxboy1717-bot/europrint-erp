import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
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
import type { KpiExplanation, RiskAssessment, StrategicRecommendations, ExecutiveSummary } from './director-ai.types';
import { MAX_NAME_LENGTH } from '@common/constants/app.constants';
export type { KpiExplanation, RiskAssessment, StrategicRecommendations, ExecutiveSummary };

@Injectable()
export class DirectorAiService {
  private readonly logger = new Logger(DirectorAiService.name);

  constructor(private readonly ai: AiRouterService) {}

  async explainKpi(
    kpiName: string,
    currentValue: number | string,
    targetValue: number | string,
    historicalValues: Array<{ period: string; value: number | string }>,
    context: string,
    userId: number,
  ): Promise<KpiExplanation> {
    const prompt = `
EuroPrint Rahbar KPI tahlili.

KPI: ${kpiName}
JORIY QIYMAT: ${currentValue}
MAQSAD: ${targetValue}
TARIX: ${(Array.isArray(historicalValues) ? historicalValues : []).map(h => `${h.period}: ${h.value}`).join(' | ')}
KONTEKST: ${context}

O'zbek tilida:
1. Status va qisqa tushuntirish
2. Asosiy sabablar (2-3 ta)
3. Tezkor yechim tavsiyalari (2-3 ta)

JSON formatda:
{
  "kpiName": "${kpiName}",
  "currentValue": "${currentValue}",
  "targetValue": "${targetValue}",
  "status": "ABOVE_TARGET|ON_TARGET|BELOW_TARGET|CRITICAL",
  "explanation": "...",
  "rootCauses": ["...", "..."],
  "quickWins": ["...", "..."]
}
`;

    const aiResult = await this.ai.call({
      taskType: 'director.kpi_explain',
      prompt,
      maxTokens: 600,
      temperature: 0.4,
      userId,
    });
    if (isErr(aiResult)) {
      this.logger.warn(`AI so'rovi xato: ${aiResult.error.message}`);
      return { kpiName, currentValue, targetValue, status: 'ON_TARGET', explanation: '', rootCauses: [], quickWins: [] };
    }

    const jsonMatch = aiResult.data.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = safeJsonParse<KpiExplanation>(jsonMatch[0]);
      if (parsed) return parsed;
    }

    return {
      kpiName,
      currentValue,
      targetValue,
      status: 'ON_TARGET',
      explanation: aiResult.data.text.substring(0, 300),
      rootCauses: [],
      quickWins: [],
    };
  }

  async assessRisks(
    companyData: {
      revenue?: number;
      employees?: number;
      activeDeals?: number;
      openPositions?: number;
      pendingInvoices?: number;
    },
    userId: number,
  ): Promise<RiskAssessment> {
    const prompt = `
EuroPrint kompaniyasi xavflarini baholang.

KOMPANIYA HOLATI:
Daromad: ${companyData.revenue?.toLocaleString() ?? 'N/A'} UZS
Xodimlar: ${companyData.employees ?? 'N/A'} ta
Faol bitimlar: ${companyData.activeDeals ?? 'N/A'} ta
Ochiq vakansiyalar: ${companyData.openPositions ?? 'N/A'} ta
Kutilayotgan to'lovlar: ${companyData.pendingInvoices ?? 'N/A'} ta

EuroPrint — Toshkentdagi bosma mahsulotlar va dizayn kompaniyasi.

Quyidagi sohalardagi xavflarni baholang:
- Moliya (liquidity, debtors)
- HR (kadrlar almashuvi, bo'sh lavozimlar)
- Bozor (raqobat, narx o'zgarishlari)
- Operatsion (uskunalar, ta'minotchilar)
- IT/Xavfsizlik

JSON formatda:
{
  "overallRiskLevel": "HIGH|MEDIUM|LOW",
  "risks": [
    {
      "area": "...",
      "riskDescription": "...",
      "probability": <0-100>,
      "impact": <0-100>,
      "mitigationActions": ["...", "..."]
    }
  ],
  "priorityActions": ["...", "...", "..."]
}
`;

    const aiResult = await this.ai.call({
      taskType: 'director.risk_assess',
      prompt,
      maxTokens: 900,
      temperature: 0.3,
      userId,
    });
    if (isErr(aiResult)) {
      this.logger.warn(`AI so'rovi xato: ${aiResult.error.message}`);
      return { overallRiskLevel: 'MEDIUM', risks: [], priorityActions: ['Batafsil tahlil uchun ma\'lumot to\'lang'] };
    }

    const jsonMatch = aiResult.data.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = safeJsonParse<RiskAssessment>(jsonMatch[0]);
      if (parsed) return parsed;
    }

    return { overallRiskLevel: 'MEDIUM', risks: [], priorityActions: ['Batafsil tahlil uchun ma\'lumot to\'lang'] };
  }

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
    this.logger.log(`director ai: AI tahlil boshlanmoqda`);
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
      return { shortTerm: ['Ma\'lumot yetarli emas'], mediumTerm: [], longTerm: [], topPriority: '', estimatedROI: 'Aniqlanmadi' };
    }

    const jsonMatch = aiResult.data.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = safeJsonParse<StrategicRecommendations>(jsonMatch[0]);
      if (parsed) return parsed;
    }

    return { shortTerm: ['Ma\'lumot yetarli emas'], mediumTerm: [], longTerm: [], topPriority: aiResult.data.text.substring(0, MAX_NAME_LENGTH), estimatedROI: 'Aniqlanmadi' };
  }

  async generateExecutiveSummary(userId: number): Promise<Result<object, AppError>>{
    return safeCall(async () => {
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
