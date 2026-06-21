/**
 * @module ai-fit.service
 * @description Business-logic service for the AI-fit per-card scorer (P36).
 *   Builds a prompt from the employee profile + card requirements, calls the
 *   AiRouterService, parses the AI JSON defensively, and persists an
 *   ai_fit_scores row. If the AI call fails it STILL persists a graceful
 *   fallback row (fit_score=50, fit_report={raw:error}) — never throws.
 *   Returns Result<T> from @common/result.
 * @layer Application (AI)
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { Ok, Err, isOk, Result } from '@common/result';
import { z } from 'zod';
import { AiRouterService } from './ai-router.service';
import type { AiRequest, AiTaskType } from '../../domain/types/ai.types';
import {
  AI_FIT_REPO,
  type IAiFitRepo,
  type FitScoreRow,
  type ListFitScoreFilters,
} from '../../domain/repositories/i-ai-fit.repo';

// AI-fit evaluation = a per-card HR performance analysis → route via the existing
// 'hr.performance_review' task type (analysis-class). Kept as a const for clarity.
const FIT_TASK_TYPE: AiTaskType = 'hr.performance_review';
const FALLBACK_FIT_SCORE = 50;
const MIN_FIT_SCORE = 0;
const MAX_FIT_SCORE = 100;
const SUCCESSION_THRESHOLD = 85;
const FIT_MAX_TOKENS = 700;

export const FitEvaluateSchema = z.object({
  employeeId:        z.number().int().positive(),
  cardId:            z.number().int().positive(),
  employeeProfile:   z.record(z.string(), z.unknown()).default({}),
  cardRequirements:  z.record(z.string(), z.unknown()).default({}),
}).strict();

export type FitEvaluateDto = z.infer<typeof FitEvaluateSchema>;

interface ParsedFit {
  fitScore:            number;
  report:              Record<string, unknown>;
  bonusRecommendation: number | null;
  successionCandidate: boolean;
}

@Injectable()
export class AiFitService {
  private readonly logger = new Logger(AiFitService.name);

  constructor(
    private readonly aiRouter: AiRouterService,
    @Inject(AI_FIT_REPO) private readonly repo: IAiFitRepo,
  ) {}

  /** Evaluate an employee↔card fit: build prompt → AI → parse → persist (graceful on AI failure). */
  async evaluate(dto: FitEvaluateDto): Promise<Result<FitScoreRow>> {
    const req = this.buildRequest(dto);
    const aiResult = await this.aiRouter.call(req);

    if (!isOk(aiResult)) {
      this.logger.warn(`AI-fit baholash: AI ishlamadi (employee=${dto.employeeId}, card=${dto.cardId}) — fallback saqlanadi: ${aiResult.error}`);
      return this.repo.insertScore({
        employeeId:          dto.employeeId,
        cardId:              dto.cardId,
        fitScore:            FALLBACK_FIT_SCORE,
        fitReport:           { raw: 'error', error: String(aiResult.error) },
        bonusRecommendation: null,
        successionCandidate: false,
        aiProvider:          null,
      });
    }

    const parsed = this.parseAiResponse(aiResult.data.text);
    return this.repo.insertScore({
      employeeId:          dto.employeeId,
      cardId:              dto.cardId,
      fitScore:            parsed.fitScore,
      fitReport:           parsed.report,
      bonusRecommendation: parsed.bonusRecommendation,
      successionCandidate: parsed.successionCandidate,
      aiProvider:          aiResult.data.provider,
    });
  }

  /** List persisted AI-fit scores (optionally filtered by employee/card). */
  async listScores(filters: ListFitScoreFilters): Promise<Result<FitScoreRow[]>> {
    return this.repo.listScores(filters);
  }

  /** Latest AI-fit report for an employee; Ok(null) when none (404 handled in controller). */
  async getReport(employeeId: number): Promise<Result<FitScoreRow | null>> {
    return this.repo.findLatestByEmployee(employeeId);
  }

  private buildRequest(dto: FitEvaluateDto): AiRequest {
    const prompt = [
      'You are an HR fit-scoring expert. Evaluate how well an employee fits a job card.',
      '',
      `Employee profile (JSON): ${JSON.stringify(dto.employeeProfile)}`,
      `Card requirements (JSON): ${JSON.stringify(dto.cardRequirements)}`,
      '',
      'Respond with STRICT JSON only (no markdown), shape:',
      '{"fitScore": <0-100 number>, "report": {"strengths": string[], "gaps": string[], "summary": string},',
      ' "bonusRecommendation": <number|null>, "successionCandidate": <boolean>}',
    ].join('\n');

    return {
      taskType:     FIT_TASK_TYPE,
      prompt,
      systemPrompt: 'You are a precise HR analytics assistant. Output strict JSON only.',
      maxTokens:    FIT_MAX_TOKENS,
      temperature:  0.3,
      metadata:     { feature: 'ai-fit', employeeId: dto.employeeId, cardId: dto.cardId },
    };
  }

  /** Defensively parse the AI text into a fit result; never throws. */
  private parseAiResponse(text: string): ParsedFit {
    const fallback: ParsedFit = {
      fitScore:            FALLBACK_FIT_SCORE,
      report:              { raw: text },
      bonusRecommendation: null,
      successionCandidate: false,
    };
    const json = this.extractJson(text);
    if (!json) return fallback;

    const rawScore = this.coerceNumber(json['fitScore'] ?? json['fit_score'] ?? json['score']);
    const fitScore = rawScore != null ? this.clampScore(rawScore) : FALLBACK_FIT_SCORE;
    const reportVal = json['report'] ?? json['fitReport'] ?? json['fit_report'];
    const report = (reportVal && typeof reportVal === 'object')
      ? (reportVal as Record<string, unknown>)
      : { summary: typeof reportVal === 'string' ? reportVal : text };
    const bonus = this.coerceNumber(json['bonusRecommendation'] ?? json['bonus_recommendation']);
    const successionRaw = json['successionCandidate'] ?? json['succession_candidate'];

    return {
      fitScore,
      report,
      bonusRecommendation: bonus,
      successionCandidate: successionRaw === true || successionRaw === 'true' || fitScore >= SUCCESSION_THRESHOLD,
    };
  }

  /** Extract the first JSON object from a possibly-noisy AI string. */
  private extractJson(text: string): Record<string, unknown> | null {
    if (!text) return null;
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;
    try {
      const parsed = JSON.parse(text.slice(start, end + 1));
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }

  private coerceNumber(val: unknown): number | null {
    if (typeof val === 'number' && Number.isFinite(val)) return val;
    if (typeof val === 'string') {
      const n = Number(val);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }

  private clampScore(n: number): number {
    return Math.max(MIN_FIT_SCORE, Math.min(MAX_FIT_SCORE, n));
  }
}
