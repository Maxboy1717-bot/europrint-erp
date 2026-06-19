/**
 * @module mes.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { ProductionSession, ChecklistStatus } from '../aggregates/production-session.aggregate';
import { Result, Ok, Err } from '@common/result';
import type { DrizzleExecutor } from '../../../../common/types/drizzle.types';
export type { DrizzleExecutor };

export interface IMesRepository {
  saveSession(session: ProductionSession, tx?: DrizzleExecutor): Promise<Result<number>>;
  getSession(id: number, tx?: DrizzleExecutor): Promise<Result<ProductionSession>>;
  getSessionByPpId(ppId: number): Promise<Result<ProductionSession>>;
  getAllSessionsByStatus(status: string): Promise<Result<ProductionSession[]>>;
  checkOperatorCertification(operatorId: number, courseId: number): Promise<Result<Record<string, unknown>>>;

  /**
   * Loads the TB-safety / smena-readiness checklist status for a session from the
   * canonical `setup_checklists` + `checklist_items` tables (required items only).
   * Feeds {@link ProductionSession.passChecklist} so the start gate is real (Q-40).
   */
  getChecklistStatus(sessionId: number, tx?: DrizzleExecutor): Promise<Result<ChecklistStatus>>;

  /**
   * Runs the supplied work inside a Drizzle transaction. Lets callers keep the
   * transaction boundary inside the repo layer (handlers don't need `db`).
   */
  withTransaction<T>(
    work: (tx: DrizzleExecutor) => Promise<Result<T>>,
  ): Promise<Result<T>>;
}

/**
 * DI token for IMesRepository — Symbol-based to avoid string-literal collisions.
 * (P2-20: replaces the legacy `'IMesRepository'` string token.)
 */
export const MES_REPO = Symbol('MES_REPO');

/**
 * DI token for the Drizzle Downtime repository.
 * (P2-20: replaces the legacy `'IDowntimeRepository'` string token.)
 */
export const DOWNTIME_REPO = Symbol('DOWNTIME_REPO');
