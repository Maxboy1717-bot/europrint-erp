/**
 * @module hr-ai-ext.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { isErr, safeJsonParse, Result, AppError, safeCall } from '@common/result';
import { AiRouterService } from '../application/services/ai-router.service';
import { AiDataRepository } from './ai-data.repository';
import type { ToolTestAnalysis } from './hr-ai.service';

interface ToolTestRow {
  pointA?: unknown; pointB?: unknown; pointC?: unknown; pointD?: unknown; pointE?: unknown;
  pointF?: unknown; pointG?: unknown; pointH?: unknown; pointI?: unknown; pointJ?: unknown;
  compulsivePoints?: string[]; totalScore?: unknown;
}

const TOOL_TEST_FALLBACK: ToolTestAnalysis = {
  summary: '',
  topStrengths: [],
  topWeaknesses: [],
  positionFit: 'Tahlil qilib bo\'lmadi',
  riskFactors: [],
  recommendation: 'Qo\'lda tahlil qiling',
};

@Injectable()
export class HrAiExtService {
  private readonly logger = new Logger(HrAiExtService.name);

  constructor(
    private readonly ai:       AiRouterService,
    private readonly dataRepo: AiDataRepository,
    private readonly i18n:     I18nService,
  ) {}

  async analyzeToolTest(toolTestId: number, positionTitle: string, userId: number): Promise<Result<object, AppError>>{
    return safeCall(async () => {
      this.logger.log(`hr ai ext: AI tahlil boshlanmoqda`);
      const test = await this.dataRepo.getToolTestById(toolTestId);
      if (!test) throw new InternalServerErrorException(await this.i18n.t('errors.toolTestNotFoundWithId', { args: { id: toolTestId } }));

      const prompt = this.buildToolTestPrompt(test as ToolTestRow, positionTitle);
      const aiResult = await this.ai.call({
        taskType: 'hr.skill_gap_analysis', prompt, maxTokens: 900, temperature: 0.3, userId,
      });
      if (isErr(aiResult)) {
        this.logger.warn(`AI so'rovi xato: ${aiResult.error.message}`);
        return TOOL_TEST_FALLBACK;
      }
      const parsed = this.parseToolTestJson(aiResult.data.text);
      return parsed ?? { ...TOOL_TEST_FALLBACK, summary: aiResult.data.text.substring(0, 300) };
    });
  }

  private buildToolTestPrompt(test: ToolTestRow, positionTitle: string): string {
    const compulsive = ((test.compulsivePoints) ?? []).join(', ') || 'yo\'q';
    return `
  HR CAPITAL Tool Test natijasini tahlil qiling.

  LAVOZIM: ${positionTitle}

  NATIJALAR (har biri -100 dan +100 gacha):
${this.formatToolTestScores(test)}

  Kompulsiv nuqtalar: ${compulsive}
  Umumiy ball: ${test.totalScore ?? 'N/A'}

${this.buildToolTestInstructions(positionTitle)}
  `;
  }

  private buildToolTestInstructions(positionTitle: string): string {
    return `  TAHLIL QILING (O'zbek tilida):
  1. Umumiy xarakteristika (2-3 jumla)
  2. Kuchli tomonlari (top 3)
  3. Zaif tomonlari (top 3)
  4. ${positionTitle} lavozimiga moslik (foiz va izoh)
  5. Xavf omillari (mavjud bo'lsa)
  6. Yakuniy tavsiya

  JSON formatda:
  {
    "summary": "...",
    "topStrengths": ["...", "...", "..."],
    "topWeaknesses": ["...", "...", "..."],
    "positionFit": "...",
    "riskFactors": ["..."],
    "recommendation": "..."
  }`;
  }

  private formatToolTestScores(test: ToolTestRow): string {
    return [
      `  A (Diqqat/Внимание):       ${test.pointA ?? 'N/A'}`,
      `  B (Strategiya/Стратегия):  ${test.pointB ?? 'N/A'}`,
      `  C (Nazorat/Контроль):      ${test.pointC ?? 'N/A'}`,
      `  D (Ishonch/Уверенность):   ${test.pointD ?? 'N/A'}`,
      `  E (Energiya/Энергия):      ${test.pointE ?? 'N/A'}`,
      `  F (Qat'iyat/Решительность):${test.pointF ?? 'N/A'}`,
      `  G (Himoya/Оборона):        ${test.pointG ?? 'N/A'}`,
      `  H (Taktika/Тактика):       ${test.pointH ?? 'N/A'}`,
      `  I (Empatiya/Эмпатия):      ${test.pointI ?? 'N/A'}`,
      `  J (Muloqot/Общение):       ${test.pointJ ?? 'N/A'}`,
    ].join('\n');
  }

  private parseToolTestJson(text: string): ToolTestAnalysis | null {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return safeJsonParse<ToolTestAnalysis>(jsonMatch[0]) ?? null;
  }

  async generateOnboardingPlan(
    positionTitle: string,
    department: string,
    employeeName: string,
    userId: number,
  ): Promise<{ weeklyGoals: string[]; keyMilestones: string[]; successMetrics: string[] }> {
    this.logger.log(`hr ai ext: AI tahlil boshlanmoqda`);
    const prompt = `
EuroPrint kompaniyasi uchun "${positionTitle}" lavozimiga yangi xodim "${employeeName}" onboarding rejasini yarating.
Bo'lim: ${department}

90 kunlik (3 oy) onboarding uchun:
1. Har haftaning asosiy maqsadlari (6 hafta uchun)
2. Asosiy bosqich tekshiruv nuqtalari (30, 60, 90 kun)
3. Muvaffaqiyat mezonlari (o'lchov mumkin bo'lgan)

JSON formatda (O'zbek tilida):
{
  "weeklyGoals": ["1-hafta: ...", "2-hafta: ...", ...],
  "keyMilestones": ["30-kun: ...", "60-kun: ...", "90-kun: ..."],
  "successMetrics": ["...", "...", "..."]
}
`;

    const aiResult = await this.ai.call({
      taskType: 'hr.onboarding_plan',
      prompt,
      maxTokens: 900,
      temperature: 0.6,
      userId,
    });
    if (isErr(aiResult)) {
      this.logger.warn(`AI so'rovi xato: ${aiResult.error.message}`);
      return {
        weeklyGoals: ['1-hafta: Kompaniya bilan tanishish va asosiy jarayonlarni o\'rganish'],
        keyMilestones: ['30-kun: Asosiy vazifalarni mustaqil bajarish'],
        successMetrics: ['90 kunda KPI bajarilishi 70%+'],
      };
    }

    const jsonMatch = aiResult.data.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = safeJsonParse<{ weeklyGoals: string[]; keyMilestones: string[]; successMetrics: string[] }>(jsonMatch[0]);
      if (parsed) return parsed;
    }

    return {
      weeklyGoals: ['1-hafta: Kompaniya bilan tanishish va asosiy jarayonlarni o\'rganish'],
      keyMilestones: ['30-kun: Asosiy vazifalarni mustaqil bajarish'],
      successMetrics: ['90 kunda KPI bajarilishi 70%+'],
    };
  }

  async performanceReview(
    employeeId: number,
    period: string,
    kpiData: Record<string, unknown>,
    userId: number,
  ): Promise<{ overallRating: string; achievements: string[]; improvements: string[]; nextGoals: string[] }> {
    const emp = await this.dataRepo.getEmployeeWithPosition(employeeId);

    const prompt = `
EuroPrint xodimi performance tahlili.

XODIM: ${emp?.fullName ?? `ID:${employeeId}`}
LAVOZIM: ${emp?.positionName ?? 'noma\'lum'}
DAVR: ${period}

KPI MA'LUMOTLARI:
${JSON.stringify(kpiData, null, 2)}

TAHLIL (O'zbek tilida):
1. Umumiy baho (A'lo/Yaxshi/Qoniqarli/Qoniqarsiz)
2. Asosiy yutuqlar (3 ta)
3. Yaxshilash kerak bo'lgan sohalar (2-3 ta)
4. Keyingi davr maqsadlari (3 ta)

JSON formatda:
{
  "overallRating": "A'lo|Yaxshi|Qoniqarli|Qoniqarsiz",
  "achievements": ["...", "...", "..."],
  "improvements": ["...", "..."],
  "nextGoals": ["...", "...", "..."]
}
`;

    const aiResult = await this.ai.call({
      taskType: 'hr.performance_review',
      prompt,
      maxTokens: 700,
      temperature: 0.4,
      userId,
    });
    if (isErr(aiResult)) {
      this.logger.warn(`AI so'rovi xato: ${aiResult.error.message}`);
      return {
        overallRating: 'Qoniqarli',
        achievements: ['Ma\'lumot yetarli emas'],
        improvements: ['Qo\'shimcha baholash kerak'],
        nextGoals: ['KPI-larni aniqlash'],
      };
    }

    const jsonMatch = aiResult.data.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = safeJsonParse<{ overallRating: string; achievements: string[]; improvements: string[]; nextGoals: string[] }>(jsonMatch[0]);
      if (parsed) return parsed;
    }

    return {
      overallRating: 'Qoniqarli',
      achievements: ['Ma\'lumot yetarli emas'],
      improvements: ['Qo\'shimcha baholash kerak'],
      nextGoals: ['KPI-larni aniqlash'],
    };
  }
}
