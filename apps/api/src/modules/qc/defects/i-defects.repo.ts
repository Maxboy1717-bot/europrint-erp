/**
 * @module i-defects.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/result';

export type BrakRow = Record<string, unknown>;
export type ReclamationRow = Record<string, unknown>;

export interface IDefectsRepository {
  findAllBraks(limit: number, offset: number): Promise<Result<{ data: BrakRow[]; count: number }>>;
  findBrakById(id: number): Promise<Result<BrakRow | null>>;
  getBrakStats(): Promise<Result<{ byStage: BrakRow[]; topReasons: BrakRow[]; pendingRework: number }>>;
  findAllReclamations(limit: number, offset: number): Promise<Result<{ data: ReclamationRow[]; count: number }>>;
  createBrak(dto: Record<string, unknown>): Promise<Result<BrakRow>>;
  createReclamation(dto: Record<string, unknown>): Promise<Result<ReclamationRow>>;
}

export const DEFECTS_REPO = 'IDefectsRepository';
