/**
 * @module hr-ai.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { AI_MAX_TOKENS_STANDARD, AI_MAX_TOKENS_MEDIUM } from '@common/constants/app.constants';
import { isErr, safeJsonParse, Result, AppError, safeCall } from '@common/result';
import { AiRouterService } from '../application/services/ai-router.service';
import { HrAiRepository } from './hr-ai.repository';

export interface CandidateScreeningResult {
  score: number;
  recommendation: 'PASS' | 'REJECT' | 'HOLD';
  strengths: string[];
  weaknesses: string[];
  productivityCategory: 'FLAGMAN' | 'PROTSESSNIK' | 'TRABLDAYKER' | 'UNKNOWN';
  suggestedNextStep: string;
  aiNotes: string;
}

export interface InterviewQuestionsResult {
  openingQuestions: string[];
  productivityQuestions: string[];
  technicalQuestions: string[];
  flagmanCheckQuestions: string[];
  closingQuestions: string[];
}

export interface ToolTestAnalysis {
  summary: string;
  topStrengths: string[];
  topWeaknesses: string[];
  positionFit: string;
  riskFactors: string[];
  recommendation: string;
}

@Injectable()
export class HrAiService {
  private readonly logger = new Logger(HrAiService.name);

  constructor(
    private readonly ai: AiRouterService,
    private readonly hrAiRepo: HrAiRepository,
  ) {}

  async screenCandidate(candidateId: number, userId: number): Promise<Result<object, AppError>>{
    return safeCall(async () => {
      const candidate = await this.loadCandidate(candidateId);
      const vacancyInfo = await this.loadVacancyInfo(candidate);
      const prompt = this.buildScreeningPrompt(candidate, vacancyInfo);
      const aiResult = await this.ai.call({
        taskType: 'hr.evaluate_candidate',
        prompt,
        systemPrompt: 'Siz EuroPrint HR AI asisentiasiz. Faqat JSON formatda javob bering.',
        maxTokens: 800,
        temperature: 0.3,
        userId,
      });
      if (isErr(aiResult)) {
        this.logger.warn(`AI so'rovi xato: ${aiResult.error.message}`);
        return this.buildScreeningFallback('');
      }
      const parsed = this.parseScreeningJson(aiResult.data.text);
      return parsed ?? this.buildScreeningFallback(aiResult.data.text.substring(0, 300));
    });
  }

  private async loadCandidate(candidateId: number): Promise<Record<string, unknown>> {
    const candidateResult = await this.hrAiRepo.getCandidateById(candidateId);
    if (!candidateResult.ok) throw new InternalServerErrorException(candidateResult.error.message);
    if (!candidateResult.data) throw new InternalServerErrorException(`Nomzod #${candidateId} topilmadi`);
    return candidateResult.data as Record<string, unknown>;
  }

  private async loadVacancyInfo(candidate: Record<string, unknown>): Promise<string> {
    if (!candidate['vacancyId']) return '';
    const vacResult = await this.hrAiRepo.getVacancyById(Number(candidate['vacancyId']));
    if (!vacResult.ok || !vacResult.data) return '';
    const vac = vacResult.data as Record<string, unknown>;
    return `Vakansiya: ${vac['title']}\n${vac['description'] ?? ''}`;
  }

  private buildScreeningPrompt(c: Record<string, unknown>, vacancyInfo: string): string {
    return `Sen EuroPrint kompaniyasi uchun HR rekruter AI asisentiasan (HR CAPITAL metodologiyasi).

  NOMZOD MA'LUMOTLARI:
  Ism: ${c['fullName']}
  Telefon: ${c['phone']}
  Email: ${c['email'] ?? 'ko\'rsatilmagan'}
  Manba: ${c['source'] ?? 'noma\'lum'}
  Izohlar: ${c['notes'] ?? 'yo\'q'}
  ${vacancyInfo}

  HR CAPITAL metodologiyasiga asoslanib ushbu nomzodni baholа va JSON formatda javob ber:
  {
    "score": <0-100>,
    "recommendation": "PASS|REJECT|HOLD",
    "strengths": ["...", "..."],
    "weaknesses": ["...", "..."],
    "productivityCategory": "FLAGMAN|PROTSESSNIK|TRABLDAYKER|UNKNOWN",
    "suggestedNextStep": "...",
    "aiNotes": "..."
  }`;
  }

  private parseScreeningJson(text: string): CandidateScreeningResult | null {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return safeJsonParse<CandidateScreeningResult>(jsonMatch[0]) ?? null;
  }

  private buildScreeningFallback(aiNotes: string): CandidateScreeningResult {
    return {
      score: 50,
      recommendation: 'HOLD',
      strengths: ['Ma\'lumot yetarli emas'],
      weaknesses: ['Qo\'shimcha baholash kerak'],
      productivityCategory: 'UNKNOWN',
      suggestedNextStep: 'Qo\'shimcha ma\'lumot to\'plang va qayta baholang',
      aiNotes,
    };
  }

  async classifyProductivity(
    candidateId: number,
    interviewNotes: string,
    userId: number,
  ): Promise<{ category: 'FLAGMAN' | 'PROTSESSNIK' | 'TRABLDAYKER' | 'UNKNOWN'; reasoning: string; confidence: number }> {
    const prompt = `HR CAPITAL metodologiyasi bo'yicha nomzod kategoriyasini aniqlang.

INTERVYU IZOHLAR:
${interviewNotes}

KATEGORIYALAR:
- FLAGMAN: Aniq o'lchov mumkin bo'lgan natijalarga erishgan, mustaqil ishlagan, proaktiv
- PROTSESSNIK: Jarayonlarga amal qiladi, ko'rsatma kutadi, lekin vijdonan bajaradi
- TRABLDAYKER: Na aniq natija, na izchil jarayon ko'rsata olmaydi

JSON: { "category": "...", "reasoning": "...", "confidence": <0-100> }`;

    const aiResult = await this.ai.call({ taskType: 'hr.evaluate_candidate', prompt, maxTokens: AI_MAX_TOKENS_STANDARD, temperature: 0.2, userId });
    if (isErr(aiResult)) {
      this.logger.warn(`AI xato: ${aiResult.error.message}`);
      return { category: 'UNKNOWN', reasoning: '', confidence: 0 };
    }
    const jsonMatch = aiResult.data.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = safeJsonParse<{ category: 'FLAGMAN' | 'PROTSESSNIK' | 'TRABLDAYKER' | 'UNKNOWN'; reasoning: string; confidence: number }>(jsonMatch[0]);
      if (parsed) return parsed;
    }
    return { category: 'UNKNOWN', reasoning: aiResult.data.text, confidence: 0 };
  }

  async generateInterviewQuestions(positionTitle: string, candidateBackground: string, userId: number): Promise<InterviewQuestionsResult> {
    const prompt = `HR CAPITAL metodologiyasiga asoslanib "${positionTitle}" lavozimi uchun intervyu savollar yarating.

NOMZOD BACKGROUND: ${candidateBackground}

O'ZBEK TILIDA JSON:
{
  "openingQuestions": ["...", "...", "..."],
  "productivityQuestions": ["...", "...", "...", "...", "..."],
  "technicalQuestions": ["...", "...", "...", "..."],
  "flagmanCheckQuestions": ["...", "...", "..."],
  "closingQuestions": ["...", "..."]
}`;
    const aiResult = await this.ai.call({ taskType: 'hr.generate_interview_questions', prompt, maxTokens: AI_MAX_TOKENS_MEDIUM, temperature: 0.7, userId });
    const fallback: InterviewQuestionsResult = { openingQuestions: ['O\'zingiz haqingizda qisqacha gapirib bering'], productivityQuestions: ['Oxirgi ish joyingizda eng katta natijangiz nima bo\'ldi?'], technicalQuestions: ['Ushbu lavozim uchun muhim ko\'nikmalaringiz qanday?'], flagmanCheckQuestions: ['Ko\'rsatma berilmasdan topshiriq etsalar qanday harakat qilasiz?'], closingQuestions: ['Bizning kompaniyada ishlashni xohlaysizmi va nima uchun?'] };
    if (isErr(aiResult)) { this.logger.warn(`AI xato: ${aiResult.error.message}`); return fallback; }
    const jsonMatch = aiResult.data.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) { const parsed = safeJsonParse<InterviewQuestionsResult>(jsonMatch[0]); if (parsed) return parsed; }
    return fallback;
  }

  async analyzeToolTest(toolTestId: number, positionTitle: string, userId: number): Promise<ToolTestAnalysis> {
    const testResult = await this.hrAiRepo.getToolTestById(toolTestId);
    if (!testResult.ok) throw new InternalServerErrorException(testResult.error.message);
    if (!testResult.data) throw new InternalServerErrorException(`Tool Test #${toolTestId} topilmadi`);
    const test = testResult.data as Record<string, unknown>;

    const prompt = `HR CAPITAL Tool Test natijasini tahlil qiling.
LAVOZIM: ${positionTitle}
NATIJALAR: A:${test['pointA'] ?? 'N/A'} B:${test['pointB'] ?? 'N/A'} C:${test['pointC'] ?? 'N/A'} D:${test['pointD'] ?? 'N/A'} E:${test['pointE'] ?? 'N/A'} F:${test['pointF'] ?? 'N/A'} G:${test['pointG'] ?? 'N/A'} H:${test['pointH'] ?? 'N/A'} I:${test['pointI'] ?? 'N/A'} J:${test['pointJ'] ?? 'N/A'}
Kompulsiv: ${((test['compulsivePoints'] as string[] | undefined) ?? []).join(', ') || 'yo\'q'} | Umumiy: ${test['totalScore'] ?? 'N/A'}

JSON (O'zbek tilida):
{
  "summary": "...",
  "topStrengths": ["...", "...", "..."],
  "topWeaknesses": ["...", "...", "..."],
  "positionFit": "...",
  "riskFactors": ["..."],
  "recommendation": "..."
}`;

    const aiResult = await this.ai.call({ taskType: 'hr.skill_gap_analysis', prompt, maxTokens: 900, temperature: 0.3, userId });
    const fallback: ToolTestAnalysis = { summary: '', topStrengths: [], topWeaknesses: [], positionFit: 'Tahlil qilib bo\'lmadi', riskFactors: [], recommendation: 'Qo\'lda tahlil qiling' };
    if (isErr(aiResult)) { this.logger.warn(`AI xato: ${aiResult.error.message}`); return fallback; }
    const jsonMatch = aiResult.data.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) { const parsed = safeJsonParse<ToolTestAnalysis>(jsonMatch[0]); if (parsed) return parsed; }
    return { ...fallback, summary: aiResult.data.text.substring(0, 300) };
  }
}
