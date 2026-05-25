/**
 * @module i-kaizen.repo
 * @description Domain repository interface for director kaizen suggestions.
 *   Concrete implementation lives at
 *   `infrastructure/repositories/kaizen.repository.ts`.
 * @layer Domain (Director)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export interface IKaizenRepo {
  createSuggestion(
    title: string,
    description: string,
    category: string,
    expectedBenefit: string | null,
    submittedBy: number,
  ): Promise<Result<Row>>;
  listSuggestions(
    status: string | null,
    category: string | null,
    lim: number,
    off: number,
  ): Promise<Result<Row[]>>;
  getSuggestion(id: number): Promise<Result<Row[]>>;
  updateSuggestion(
    id: number,
    status: string | null,
    reviewComment: string | null,
    implementationNotes: string | null,
    reviewedBy: number,
  ): Promise<Result<Row>>;
  getStats(): Promise<Result<Row>>;
}

export const KAIZEN_REPO = Symbol('KAIZEN_REPO');
