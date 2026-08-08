/**
 * @module i-pp-material-reservations.repo
 * @description Port for the PP material-reservation ledger (pp_material_reservations) —
 *   vision 07-pp#30 (EP-PP-068). A PP-owned MRP reservation records which production
 *   order gets first claim on a scarce material, ranked by priority (1=Shoshilinch ..
 *   4=Past) then FIFO (reserved_at) on equal priority; only director/owner may manually
 *   override a priority (with a written reason, audited). Distinct from the WMS physical
 *   reservation ledger (stock_reservations) — this is the planning decision, not a stock
 *   hold. Kept as a small port so the controller/service stay DB-free (Rule 15).
 */

import type { Result } from '@common/result';

/**
 * Reservation lifecycle. reserved = active claim; waiting = "material yetarli emas —
 * kutish" (an estimated date is shown to the second plan); released = freed; issued =
 * consumed by goods-issue.
 */
export type ReservationStatus = 'reserved' | 'waiting' | 'released' | 'issued';

/** One reservation row for the API (camelCase view of pp_material_reservations). */
export interface MaterialReservationRow {
  id: number;
  productionOrderId: number;
  materialId: number;
  qty: number;
  /** 1=Shoshilinch(urgent) 2=Yuqori(high) 3=Oddiy(normal) 4=Past(low); lower = first. */
  priority: number;
  reservedAt: string;
  status: ReservationStatus;
  estimatedAvailableDate: string | null;
  priorityOverriddenBy: number | null;
  overrideReason: string | null;
  overriddenAt: string | null;
  releasedAt: string | null;
  createdAt: string;
}

/**
 * Create payload. `priority` is optional — when omitted the reservation inherits the
 * production order's own priority (production_orders.priority), falling back to 3.
 */
export interface CreateReservationInput {
  productionOrderId: number;
  materialId: number;
  qty: number;
  priority?: number;
}

export interface IPpMaterialReservationsRepo {
  /**
   * The ranked allocation queue for one material: active (reserved|waiting) rows
   * ORDER BY priority ASC, reserved_at ASC — i.e. ustuvorlik -> teng bo'lsa FIFO.
   * Returns Ok([]) when nothing is reserved against the material (no fabrication).
   */
  allocationQueue(materialId: number): Promise<Result<MaterialReservationRow[]>>;

  /** All reservations for a production order, newest first. */
  findByOrder(productionOrderId: number): Promise<Result<MaterialReservationRow[]>>;

  /** Single reservation, or Ok(null) so the controller can raise a 404. */
  findById(id: number): Promise<Result<MaterialReservationRow | null>>;

  /** Insert a reservation (priority inherits the order's when omitted). */
  create(input: CreateReservationInput): Promise<Result<MaterialReservationRow>>;

  /**
   * Director/owner manual priority override (YOZMA + sabab, audited via
   * priority_overridden_by / override_reason / overridden_at). Ok(null) if the id
   * does not exist.
   */
  overridePriority(
    id: number,
    newPriority: number,
    overriddenBy: number,
    reason: string,
  ): Promise<Result<MaterialReservationRow | null>>;

  /** Mark a reservation waiting ("material yetarli emas — kutish") + estimated date. */
  markWaiting(
    id: number,
    estimatedAvailableDate: string,
  ): Promise<Result<MaterialReservationRow | null>>;

  /** Release a reservation (frees the claim). Ok(null) if the id does not exist. */
  release(id: number): Promise<Result<MaterialReservationRow | null>>;
}

export const PP_MATERIAL_RESERVATIONS_REPO = Symbol('IPpMaterialReservationsRepo');
