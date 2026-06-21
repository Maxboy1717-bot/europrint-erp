/**
 * @module i-ai-fit.repo
 * @description Domain repository interface for the AI-fit per-card scorer (P36).
 *   Concrete implementation lives at
 *   `infrastructure/repositories/drizzle-ai-fit.repo.ts`.
 * @layer Domain (AI)
 */

import type { Result } from '@common/result';

/** A persisted AI-fit score row (transport shape, ISO dates). */
export interface FitScoreRow {
  id:                   number;
  employeeId:           number;
  cardId:               number;
  fitScore:             number;
  fitReport:            Record<string, unknown> | null;
  bonusRecommendation:  number | null;
  successionCandidate:  boolean;
  aiProvider:           string | null;
  evaluatedAt:          string;
  createdAt:            string;
}

/** Insert payload for a new AI-fit score (id/timestamps are DB-defaulted). */
export interface InsertFitScoreDto {
  employeeId:           number;
  cardId:               number;
  fitScore:             number;
  fitReport?:           Record<string, unknown> | null;
  bonusRecommendation?: number | null;
  successionCandidate?: boolean;
  aiProvider?:          string | null;
}

/** Optional filters for listing AI-fit scores. */
export interface ListFitScoreFilters {
  employeeId?: number;
  cardId?:     number;
  limit?:      number;
}

export interface IAiFitRepo {
  insertScore(dto: InsertFitScoreDto): Promise<Result<FitScoreRow>>;
  findLatestByEmployee(employeeId: number): Promise<Result<FitScoreRow | null>>;
  listScores(filters: ListFitScoreFilters): Promise<Result<FitScoreRow[]>>;
}

export const AI_FIT_REPO = Symbol('AI_FIT_REPO');
