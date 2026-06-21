/**
 * @module drizzle-ai-fit.repo
 * @description Repository / data-access layer for the AI-fit per-card scorer (P36).
 *   Wraps Drizzle ORM queries over `ai_fit_scores`; returns Result<T>.
 * @layer Infrastructure (AI)
 */

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { DrizzleService } from '@common/services/drizzle.service';
import { safeCall, Result } from '@common/result';
import { aiFitScores } from '@europrint/schemas';
import {
  IAiFitRepo,
  FitScoreRow,
  InsertFitScoreDto,
  ListFitScoreFilters,
} from '../../domain/repositories/i-ai-fit.repo';

const DEFAULT_LIST_LIMIT = 100;

@Injectable()
export class DrizzleAiFitRepo implements IAiFitRepo {
  constructor(private readonly drizzle: DrizzleService) {}

  /** Map a raw Drizzle select row → transport FitScoreRow (numeric→number, dates→ISO). */
  private toRow(r: typeof aiFitScores.$inferSelect): FitScoreRow {
    return {
      id:                  r.id,
      employeeId:          r.employeeId,
      cardId:              r.cardId,
      fitScore:            r.fitScore != null ? Number(r.fitScore) : 0,
      fitReport:           (r.fitReport as Record<string, unknown> | null) ?? null,
      bonusRecommendation: r.bonusRecommendation != null ? Number(r.bonusRecommendation) : null,
      successionCandidate: r.successionCandidate ?? false,
      aiProvider:          r.aiProvider ?? null,
      evaluatedAt:         r.evaluatedAt?.toISOString() ?? '',
      createdAt:           r.createdAt?.toISOString() ?? '',
    };
  }

  async insertScore(dto: InsertFitScoreDto): Promise<Result<FitScoreRow>> {
    return safeCall(async () => {
      const [row] = await this.drizzle.db
        .insert(aiFitScores)
        .values({
          employeeId:          dto.employeeId,
          cardId:              dto.cardId,
          fitScore:            dto.fitScore.toFixed(2),
          fitReport:           dto.fitReport ?? null,
          bonusRecommendation: dto.bonusRecommendation != null ? dto.bonusRecommendation.toFixed(2) : null,
          successionCandidate: dto.successionCandidate ?? false,
          aiProvider:          dto.aiProvider ?? null,
        })
        .returning();
      if (!row) throw new InternalServerErrorException('AI-fit baho saqlanmadi: natija qaytmadi');
      return this.toRow(row);
    });
  }

  async findLatestByEmployee(employeeId: number): Promise<Result<FitScoreRow | null>> {
    return safeCall(async () => {
      const [row] = await this.drizzle.db
        .select()
        .from(aiFitScores)
        .where(eq(aiFitScores.employeeId, employeeId))
        .orderBy(desc(aiFitScores.evaluatedAt), desc(aiFitScores.id))
        .limit(1);
      return row ? this.toRow(row) : null;
    });
  }

  async listScores(filters: ListFitScoreFilters): Promise<Result<FitScoreRow[]>> {
    return safeCall(async () => {
      const conditions = [];
      if (filters.employeeId != null) conditions.push(eq(aiFitScores.employeeId, filters.employeeId));
      if (filters.cardId != null) conditions.push(eq(aiFitScores.cardId, filters.cardId));
      const limit = filters.limit && filters.limit > 0 ? Math.min(filters.limit, DEFAULT_LIST_LIMIT) : DEFAULT_LIST_LIMIT;
      const rows = await this.drizzle.db
        .select()
        .from(aiFitScores)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(aiFitScores.evaluatedAt), desc(aiFitScores.id))
        .limit(limit);
      return (Array.isArray(rows) ? rows : []).map((r) => this.toRow(r));
    });
  }
}
