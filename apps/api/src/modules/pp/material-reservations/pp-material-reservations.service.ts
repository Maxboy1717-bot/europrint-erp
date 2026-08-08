/**
 * @module pp-material-reservations.service
 * @description Thin application service for the PP material-reservation ledger
 *   (vision 07-pp#30 / EP-PP-068). Delegates every operation to the repository
 *   (Rule 15 — no db.* here). The priority -> FIFO ranking is expressed as the
 *   repository's ORDER BY (allocationQueue); the director-override audit fields are
 *   written by overridePriority. No business arithmetic lives here.
 */

import { Inject, Injectable } from '@nestjs/common';
import type { Result } from '@common/result';
import {
  PP_MATERIAL_RESERVATIONS_REPO,
  type IPpMaterialReservationsRepo,
  type MaterialReservationRow,
  type CreateReservationInput,
} from './i-pp-material-reservations.repo';

@Injectable()
export class PpMaterialReservationsService {
  constructor(
    @Inject(PP_MATERIAL_RESERVATIONS_REPO)
    private readonly repo: IPpMaterialReservationsRepo,
  ) {}

  /** Ranked allocation queue for a material (ustuvorlik -> teng bo'lsa FIFO). */
  allocationQueue(materialId: number): Promise<Result<MaterialReservationRow[]>> {
    return this.repo.allocationQueue(materialId);
  }

  /** All reservations tied to a production order. */
  findByOrder(productionOrderId: number): Promise<Result<MaterialReservationRow[]>> {
    return this.repo.findByOrder(productionOrderId);
  }

  /** Create a reservation (priority inherits the order's when omitted). */
  create(input: CreateReservationInput): Promise<Result<MaterialReservationRow>> {
    return this.repo.create(input);
  }

  /** Director/owner manual priority override (YOZMA + sabab). Ok(null) if id not found. */
  overridePriority(
    id: number,
    newPriority: number,
    overriddenBy: number,
    reason: string,
  ): Promise<Result<MaterialReservationRow | null>> {
    return this.repo.overridePriority(id, newPriority, overriddenBy, reason);
  }

  /**
   * Mark waiting + estimated date ("material yetarli emas — kutish"). Ok(null) if
   * id not found.
   */
  markWaiting(
    id: number,
    estimatedAvailableDate: string,
  ): Promise<Result<MaterialReservationRow | null>> {
    return this.repo.markWaiting(id, estimatedAvailableDate);
  }

  /** Release a reservation. Ok(null) if id not found. */
  release(id: number): Promise<Result<MaterialReservationRow | null>> {
    return this.repo.release(id);
  }
}
