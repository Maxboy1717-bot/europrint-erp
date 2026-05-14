/**
 * @module mes.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { ProductionSession } from '../aggregates/production-session.aggregate';
import { Result, Ok, Err } from '@common/result';

export interface IMesRepository {
  saveSession(session: ProductionSession): Promise<Result<number>>;
  getSession(id: number): Promise<Result<ProductionSession>>;
  getSessionByPpId(ppId: number): Promise<Result<ProductionSession>>;
  getAllSessionsByStatus(status: string): Promise<Result<ProductionSession[]>>;
  checkOperatorCertification(operatorId: number, courseId: number): Promise<Result<Record<string, unknown>>>;
}
