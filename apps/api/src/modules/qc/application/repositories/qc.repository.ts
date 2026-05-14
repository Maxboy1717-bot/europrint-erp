/**
 * @module qc.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result } from '@common/result';
import { Inspection } from '../../domain/aggregates/inspection.aggregate';

export interface IQcRepository {
  save(inspection: Inspection): Promise<void>;
  findById(id: string): Promise<Inspection | null>;
  findByOrderId(orderId: number): Promise<Inspection[]>;
  delete(id: string): Promise<void>;
}

export const QC_REPOSITORY_PROVIDER = 'IQcRepository';
