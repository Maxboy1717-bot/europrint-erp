/**
 * @module director-ai.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { isErr, safeJsonParse, Result, AppError, safeCall } from '@common/result';
import { AiRouterService } from '../application/services/ai-router.service';
import { AiDataRepository } from './ai-data.repository';
import type { KpiExplanation, RiskAssessment, StrategicRecommendations, ExecutiveSummary } from './director-ai.types';
export type { KpiExplanation, RiskAssessment, StrategicRecommendations, ExecutiveSummary };

interface CompanyRiskData {
  revenue?: number;
  employees?: number;
  activeDeals?: number;
  openPositions?: number;
  pendingInvoices?: number;
}

interface SummaryMetrics {
  totalEmployees: number;
  activeLeads: number;
  activeDeals: number;
  openPositions: number;
}

@Injectable()
export class DirectorAiService {
  private readonly logger = new Logger(DirectorAiService.name);

  constructor(
    private readonly ai:       AiRouterService,
    private readonly dataRepo: AiDataRepository,
  ) {}

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
    companyData: CompanyRiskData,
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

  async generateExecutiveSummary(userId: number): Promise<Result<object, AppError>>{
    return safeCall(async () => {
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
