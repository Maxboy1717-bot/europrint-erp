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

/**
 * A live (karta, xodim) juftligi — faol org_functions kartasi + unga
 * `users.org_function_id` orqali biriktirilgan xodim. Haftalik avto-tsikl
 * (2.18) shu ro'yxat bo'yicha evaluate() ni chaqiradi. Barcha maydonlar DB'dan
 * (fabrikatsiya emas); profile/requirements ichidagi `null` qiymatlar shunchaki
 * hali to'ldirilmagan master-data'ni bildiradi.
 */
export interface ActiveCardAssignmentRow {
  employeeId:         number;
  cardId:             number;
  employeeProfile:    Record<string, unknown>;
  cardRequirements:   Record<string, unknown>;
}

export interface IAiFitRepo {
  insertScore(dto: InsertFitScoreDto): Promise<Result<FitScoreRow>>;
  findLatestByEmployee(employeeId: number): Promise<Result<FitScoreRow | null>>;
  listScores(filters: ListFitScoreFilters): Promise<Result<FitScoreRow[]>>;
  /** Faol karta + biriktirilgan xodim juftliklari (haftalik avto-tsikl uchun). */
  listActiveCardAssignments(): Promise<Result<ActiveCardAssignmentRow[]>>;
}

export const AI_FIT_REPO = Symbol('AI_FIT_REPO');
