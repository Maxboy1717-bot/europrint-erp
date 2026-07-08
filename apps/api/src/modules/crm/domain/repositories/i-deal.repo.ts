/**
 * @module i-deal.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/types/result.type';
import { Deal } from '../aggregates/deal.aggregate';

export interface IDealRepository {
  save(deal: Deal): Promise<Result<Deal>>;
  findById(id: number): Promise<Result<Deal | null>>;
  findByLeadId(leadId: number): Promise<Result<Deal | null>>;
  findByCompanyId(companyId: number, limit: number, offset: number): Promise<Result<Deal[]>>;
  findByStatus(status: string, limit: number, offset: number): Promise<Result<Deal[]>>;
  update(deal: Deal): Promise<Result<void>>;
  delete(id: number): Promise<Result<void>>;
  countByStatus(status: string): Promise<Result<number>>;
  /**
   * VISION-3340 #31 — persist the structured loss-reason taxonomy FK
   * (crm_deals.lost_reason_id) on a lost deal. Additive; free-text lost_reason untouched.
   */
  updateLostReasonId(dealId: number, lostReasonId: number): Promise<Result<void>>;
}

/**
 * DI token for IDealRepository — Symbol-based to avoid string-literal collisions.
 * (P2-20: replaces the legacy `'IDealRepository'` string token.)
 */
export const DEAL_REPO = Symbol('DEAL_REPO');
