/**
 * @module qc.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result } from '@common/result';
import { Inspection } from '../../domain/aggregates/inspection.aggregate';

/**
 * Optional transaction handle. Drizzle's `db.transaction(async (tx) => ...)`
 * supplies a `tx` whose API mirrors `db`. We accept it as an opaque value so
 * callers can pin reads + writes to the same transaction without leaking
 * Drizzle types into the domain interface.
 */
export type DrizzleExecutor = unknown;

export interface IQcRepository {
  save(inspection: Inspection, tx?: DrizzleExecutor): Promise<void>;
  findById(id: string, tx?: DrizzleExecutor): Promise<Inspection | null>;
  findByOrderId(orderId: number): Promise<Inspection[]>;
  delete(id: string): Promise<void>;

  /**
   * Runs the supplied work inside a Drizzle transaction. Lets callers keep the
   * transaction boundary inside the repo layer (handlers don't need `db`).
   */
  withTransaction<T>(
    work: (tx: DrizzleExecutor) => Promise<Result<T>>,
  ): Promise<Result<T>>;
}

/**
 * DI token for IQcRepository — Symbol-based to avoid string-literal collisions.
 * (P2-20: replaces the legacy `'IQcRepository'` string token.)
 *
 * The exported name `QC_REPOSITORY_PROVIDER` is preserved for back-compat with
 * existing consumers (`qc.module.ts`); only its underlying value changed from
 * a string to a unique Symbol.
 */
export const QC_REPOSITORY_PROVIDER = Symbol('QC_REPOSITORY_PROVIDER');
