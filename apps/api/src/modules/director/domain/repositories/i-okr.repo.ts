/**
 * @module i-okr.repo
 * @description Domain repository interface for director OKR objectives + key results.
 *   Concrete implementation lives at
 *   `infrastructure/repositories/okr.repository.ts`.
 * @layer Domain (Director)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export interface KeyResultsDashboard { avg_progress: number; total: number }

export interface IOkrRepo {
  listObjectives(
    type: string | null,
    year: number | null,
    quarter: string | null,
    status: string | null,
  ): Promise<Result<Row[]>>;
  getObjective(id: number): Promise<Result<Row[]>>;
  createObjective(
    title: string,
    type: string,
    year: number,
    quarter: string,
    description: string | null,
    ownerId: number,
  ): Promise<Result<Row>>;
  updateObjective(
    id: number,
    title: string | null,
    status: string | null,
    description: string | null,
  ): Promise<Result<Row>>;
  deleteObjective(id: number): Promise<void>;
  listKeyResults(objectiveId: number | null): Promise<Result<Row[]>>;
  createKeyResult(
    objectiveId: number,
    title: string,
    targetValue: number,
    currentValue: number,
    unit: string,
    ownerId: number,
  ): Promise<Result<Row>>;
  updateKeyResult(
    id: number,
    currentValue: number | null,
    status: string | null,
    title: string | null,
  ): Promise<Result<Row>>;
  deleteKeyResult(id: number): Promise<void>;
  getDashboardObjectives(): Promise<Result<unknown[]>>;
  getDashboardKeyResults(): Promise<Result<KeyResultsDashboard>>;
}

export const OKR_REPO = Symbol('OKR_REPO');
