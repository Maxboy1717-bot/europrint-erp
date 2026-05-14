/**
 * @module i-pos-svc.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/result';

export interface IPosSvcRepository {
  findMovementTypes(): Promise<Result<object[]>>;
  findMovementTypeByCode(code: string): Promise<Result<any | null>>;
  createMovementType(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  findMovements(limit: number, offset: number): Promise<Result<object[]>>;
  findMovementById(id: number): Promise<Result<any | null>>;
  createMovement(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  updateMovementStatus(id: number, status: string): Promise<Result<Record<string, unknown>>>;
}

export const POS_SVC_REPO = 'IPosSvcRepository';
