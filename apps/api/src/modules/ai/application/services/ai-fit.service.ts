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
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Ok, Err, AppErr, isOk, Result } from '@common/result';
import { z } from 'zod';
import { AiRouterService } from './ai-router.service';
import type { AiRequest, AiTaskType } from '../../domain/types/ai.types';
import {
  AI_FIT_REPO,
  type IAiFitRepo,
  type FitScoreRow,
  type ListFitScoreFilters,
} from '../../domain/repositories/i-ai-fit.repo';
import { hasFullAiFitVisibility } from '../../infrastructure/ai-fit-visibility.helper';
import { AI_FIT_LOW_SCORE_THRESHOLD } from '@common/constants/business.constants';

/** Kim so'ralayotganini bildiradi — per-karta RBAC (SB0505) uchun. */
export interface FitViewerContext {
  userId: number;
  role:   string | undefined | null;
}

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
    private readonly events: EventEmitter2,
  ) {}

  /**
   * Evaluate an employee↔card fit: build prompt → AI → parse → persist (graceful
   * on AI failure). `viewer` optional — omitted only for trusted internal callers
   * (runWeeklyCycle's own loop); HTTP entrypoint (controller) always passes it so
   * a scoped role (e.g. a single department's HR_MANAGER) cannot evaluate a card
   * outside their own managed org-department chain (SB0505 per-karta RBAC).
   */
  async evaluate(dto: FitEvaluateDto, viewer?: FitViewerContext): Promise<Result<FitScoreRow>> {
    if (viewer && !hasFullAiFitVisibility(viewer.role)) {
      const access = await this.repo.hasAccessToCard(dto.cardId, viewer.userId);
      if (!isOk(access)) return Err(access.error);
      if (!access.data) {
        return Err(AppErr('FORBIDDEN', `Karta #${dto.cardId} ustidan boshqaruv huquqi yo'q`));
      }
    }
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
    const inserted = await this.repo.insertScore({
      employeeId:          dto.employeeId,
      cardId:              dto.cardId,
      fitScore:            parsed.fitScore,
      fitReport:           parsed.report,
      bonusRecommendation: parsed.bonusRecommendation,
      successionCandidate: parsed.successionCandidate,
      aiProvider:          aiResult.data.provider,
    });

    // SB0504: past-moslik (fitScore < AI_FIT_LOW_SCORE_THRESHOLD) real AI baholash
    // natijasida chiqsa — 'ai.fit.low_score' domen hodisasini chiqaramiz (fallback
    // qatorlar uchun EMAS — 50 FALLBACK_FIT_SCORE haqiqiy baholash emas). Hodisa
    // bloklamaydi (Q-40: hech narsani avtomatik to'xtatmaydi) — faqat xabar beradi;
    // AiAlertsService @OnEvent orqali HR/rahbarga Telegram yuboradi (mavjud naqsh).
    if (isOk(inserted) && inserted.data.fitScore < AI_FIT_LOW_SCORE_THRESHOLD) {
      this.events.emit('ai.fit.low_score', {
        employeeId: dto.employeeId,
        cardId:     dto.cardId,
        fitScore:   inserted.data.fitScore,
        summary:    typeof inserted.data.fitReport?.['summary'] === 'string'
          ? (inserted.data.fitReport['summary'] as string)
          : null,
        timestamp: new Date(),
      });
    }

    return inserted;
  }

  /**
   * List persisted AI-fit scores (optionally filtered by employee/card).
   * SB0505 per-karta RBAC: a scoped viewer (not super_admin/director) querying
   * a specific `cardId` must have access to that card; without a `cardId`
   * filter, scoped viewers are restricted to cards they manage.
   */
  async listScores(filters: ListFitScoreFilters, viewer?: FitViewerContext): Promise<Result<FitScoreRow[]>> {
    if (viewer && !hasFullAiFitVisibility(viewer.role)) {
      if (filters.cardId != null) {
        const access = await this.repo.hasAccessToCard(filters.cardId, viewer.userId);
        if (!isOk(access)) return Err(access.error);
        if (!access.data) {
          return Err(AppErr('FORBIDDEN', `Karta #${filters.cardId} ustidan boshqaruv huquqi yo'q`));
        }
        return this.repo.listScores(filters);
      }
      return this.repo.listScoresForManagedCards(filters, viewer.userId);
    }
    return this.repo.listScores(filters);
  }

  /**
   * Haftalik avto-tsikl (2.18, MASTER-REJA-VIZYON): har faol karta (org_functions)
   * + unga biriktirilgan xodim uchun evaluate() ni ketma-ket chaqiradi. Har chaqiruv
   * o'zining graceful fallback mexanizmiga ega (evaluate() AI xato bo'lsa ham
   * FALLBACK_FIT_SCORE bilan yozadi, hech qachon throw qilmaydi) — shuning uchun bu
   * metod bitta karta muvaffaqiyatsiz bo'lsa ham navbatdagilarni davom ettiradi.
   */
  async runWeeklyCycle(): Promise<Result<{ total: number; succeeded: number; failed: number }>> {
    const assignments = await this.repo.listActiveCardAssignments();
    if (!isOk(assignments)) return Err(assignments.error);

    const rows = assignments.data;
    let succeeded = 0;
    let failed = 0;
    for (const row of rows) {
      const r = await this.evaluate({
        employeeId:       row.employeeId,
        cardId:           row.cardId,
        employeeProfile:  row.employeeProfile,
        cardRequirements: row.cardRequirements,
      });
      if (isOk(r)) {
        succeeded += 1;
      } else {
        failed += 1;
        this.logger.warn(`AI-fit haftalik tsikl: karta=${row.cardId} xodim=${row.employeeId} saqlanmadi — ${r.error}`);
      }
    }
    return Ok({ total: rows.length, succeeded, failed });
  }

  /**
   * Latest AI-fit report for an employee; Ok(null) when none (404 handled in
   * controller). SB0505 per-karta RBAC: a scoped viewer must manage the card
   * currently assigned to this employee.
   */
  async getReport(employeeId: number, viewer?: FitViewerContext): Promise<Result<FitScoreRow | null>> {
    if (viewer && !hasFullAiFitVisibility(viewer.role)) {
      const cardIdResult = await this.repo.findCardIdForEmployee(employeeId);
      if (!isOk(cardIdResult)) return Err(cardIdResult.error);
      const cardId = cardIdResult.data;
      if (cardId == null) {
        // No active card assignment found for this employee — nothing to scope
        // against; fall through to NOT_FOUND semantics via Ok(null) below.
        return Ok(null);
      }
      const access = await this.repo.hasAccessToCard(cardId, viewer.userId);
      if (!isOk(access)) return Err(access.error);
      if (!access.data) {
        return Err(AppErr('FORBIDDEN', `Xodim #${employeeId} kartasi ustidan boshqaruv huquqi yo'q`));
      }
    }
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
