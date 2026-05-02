import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { isErr, safeJsonParse, Result, AppError, safeCall } from '@common/result';
import { AiRouterService } from '../application/services/ai-router.service';
import { db } from '@shared/db';
import {
  hrToolTestResults,
  users,
  positions,
} from '@europrint/schemas';
import { eq } from 'drizzle-orm';
import type { ToolTestAnalysis } from './hr-ai.service';

@Injectable()
export class HrAiExtService {
  private readonly logger = new Logger(HrAiExtService.name);

  constructor(private readonly ai: AiRouterService) {}

  async analyzeToolTest(toolTestId: number, positionTitle: string, userId: number): Promise<Result<object, AppError>>{
    return safeCall(async () => {
      this.logger.log(`hr ai ext: AI tahlil boshlanmoqda`);
      const [test] = (await db
        .select()
        .from(hrToolTestResults)
        .where(eq(hrToolTestResults.id, toolTestId))
        .limit(1)) as Array<Record<string, unknown>>;
  
      if (!test) throw new InternalServerErrorException(`Tool Test #${toolTestId} topilmadi`);
  
      const prompt = `
  HR CAPITAL Tool Test natijasini tahlil qiling.
  
  LAVOZIM: ${positionTitle}
  
  NATIJALAR (har biri -100 dan +100 gacha):
  A (Diqqat/Внимание):       ${test.pointA ?? 'N/A'}
  B (Strategiya/Стратегия):  ${test.pointB ?? 'N/A'}
  C (Nazorat/Контроль):      ${test.pointC ?? 'N/A'}
  D (Ishonch/Уверенность):   ${test.pointD ?? 'N/A'}
  E (Energiya/Энергия):      ${test.pointE ?? 'N/A'}
  F (Qat'iyat/Решительность):${test.pointF ?? 'N/A'}
  G (Himoya/Оборона):        ${test.pointG ?? 'N/A'}
  H (Taktika/Тактика):       ${test.pointH ?? 'N/A'}
  I (Empatiya/Эмпатия):      ${test.pointI ?? 'N/A'}
  J (Muloqot/Общение):       ${test.pointJ ?? 'N/A'}
  
  Kompulsiv nuqtalar: ${((test.compulsivePoints as string[] | undefined) ?? []).join(', ') || 'yo\'q'}
  Umumiy ball: ${test.totalScore ?? 'N/A'}
  
  TAHLIL QILING (O'zbek tilida):
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
  }
  `;
  
      const aiResult = await this.ai.call({
        taskType: 'hr.skill_gap_analysis',
        prompt,
        maxTokens: 900,
        temperature: 0.3,
        userId,
      });
      if (isErr(aiResult)) {
        this.logger.warn(`AI so'rovi xato: ${aiResult.error.message}`);
        return {
          summary: '',
          topStrengths: [],
          topWeaknesses: [],
          positionFit: 'Tahlil qilib bo\'lmadi',
          riskFactors: [],
          recommendation: 'Qo\'lda tahlil qiling',
        };
      }
  
      const jsonMatch = aiResult.data.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = safeJsonParse<ToolTestAnalysis>(jsonMatch[0]);
        if (parsed) return parsed;
      }
  
      return {
        summary: aiResult.data.text.substring(0, 300),
        topStrengths: [],
        topWeaknesses: [],
        positionFit: 'Tahlil qilib bo\'lmadi',
        riskFactors: [],
        recommendation: 'Qo\'lda tahlil qiling',
      };
    });
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
    const [emp] = await db
      .select({
        fullName: users.fullName,
        positionName: (positions).name,
      })
      .from(users)
      .leftJoin(positions, eq(users.positionId, positions.id))
      .where(eq(users.id, employeeId))
      .limit(1);

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
