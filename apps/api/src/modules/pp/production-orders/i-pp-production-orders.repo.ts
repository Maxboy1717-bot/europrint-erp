/**
 * @module i-pp-production-orders.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/result';
type Row = Record<string, unknown>;
export interface IPpProductionOrdersRepository {
  findAll(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>>;
  findById(id: number): Promise<Result<any | null>>;
  findByOrderNumber(orderNumber: string): Promise<Result<any | null>>;
  create(dto: Record<string, unknown>, createdBy?: number): Promise<Result<Record<string, unknown>>>;
  update(id: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  updateStatus(id: number, status: string, changedBy?: number): Promise<Result<Record<string, unknown>>>;
  /**
   * SB0237 (06-PP audit) — dedicated write-path for the EP-PP-097 (ZARUR/isUrgent) and
   * EP-PP-025/061 (frozen-zone no-preempt) flags. Kept separate from the generic
   * `update()` whitelist because these flags are owner/director-authority-gated at the
   * controller (@Roles), not general-purpose PATCH fields.
   */
  updateFlags(
    id: number,
    // VISION-3340 #23: reasonCodeId (pp_reason_codes.id) is an optional structured
    // reason tag persisted onto production_orders.reason_code_id alongside the flags.
    flags: { isUrgent?: boolean; isFrozen?: boolean; frozenUntil?: Date | null; reasonCodeId?: number },
  ): Promise<Result<Record<string, unknown>>>;
  softDelete(id: number): Promise<Result<void>>;
}
export const PP_PRODUCTION_ORDERS_REPO = 'IPpProductionOrdersRepository';
