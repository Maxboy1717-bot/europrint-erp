/**
 * @module i-pp-reason-codes.repo
 * @description Port for the PP reason-code catalog (pp_reason_codes) — the structured,
 *   reusable reason vocabulary that the order-flags path references via
 *   production_orders.reason_code_id (VISION-3340 #23). Kept as a small port so the
 *   controller/service stay DB-free (Rule 15). Mirrors the proven downtime_reason_codes
 *   shape (code/name/name_ru/category/color/is_active/sort_order).
 *
 *   The vocabulary itself is owner-defined master-data — this port never seeds rows;
 *   findActive() honestly returns [] until the owner creates codes (Q-40).
 */

import type { Result } from '@common/result';

/** One reason-code row for the API (camelCase view of the pp_reason_codes columns). */
export interface PpReasonCodeRow {
  id: number;
  code: string;
  name: string;
  nameRu: string | null;
  category: string;
  color: string | null;
  isActive: boolean;
  sortOrder: number;
}

/**
 * Create payload. `category` is required because pp_reason_codes.category is
 * NOT NULL (a reason code with no category is meaningless — the category groups
 * codes, e.g. urgent/freeze/quality). `color`/`sort_order` fall back to the DB
 * defaults ('#808080' / 0) when omitted; `is_active` is TRUE by DB default.
 */
export interface CreatePpReasonCodeInput {
  code: string;
  name: string;
  category: string;
  name_ru?: string;
  color?: string;
  sort_order?: number;
}

/** Partial update payload. Any subset; is_active=false is the deactivate path. */
export interface UpdatePpReasonCodeInput {
  name?: string;
  name_ru?: string;
  category?: string;
  color?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface IPpReasonCodesRepo {
  /**
   * Active codes only, ordered by sort_order then id. Returns Ok([]) when the
   * table is empty (owner has not defined the vocabulary yet — no fabrication).
   */
  findActive(): Promise<Result<PpReasonCodeRow[]>>;

  /** All codes (active + inactive), active-first then sort_order/id — for the management screen. */
  findAll(): Promise<Result<PpReasonCodeRow[]>>;

  /** Insert a new reason code; returns the created row. */
  create(dto: CreatePpReasonCodeInput): Promise<Result<PpReasonCodeRow>>;

  /**
   * Patch an existing code (incl. deactivate via is_active=false). Returns
   * Ok(null) when no row matched the id, so the controller can raise a 404.
   */
  update(id: number, patch: UpdatePpReasonCodeInput): Promise<Result<PpReasonCodeRow | null>>;
}

export const PP_REASON_CODES_REPO = Symbol('IPpReasonCodesRepo');
