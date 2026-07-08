/**
 * @module pp-reason-codes.service
 * @description Thin application service for the PP reason-code catalog. Delegates every
 *   operation to the repository (Rule 15 — no db.* here). Kept deliberately small: the
 *   catalog has no business arithmetic, only master-data persistence.
 */

import { Inject, Injectable } from '@nestjs/common';
import type { Result } from '@common/result';
import {
  PP_REASON_CODES_REPO,
  type IPpReasonCodesRepo,
  type PpReasonCodeRow,
  type CreatePpReasonCodeInput,
  type UpdatePpReasonCodeInput,
} from './i-pp-reason-codes.repo';

@Injectable()
export class PpReasonCodesService {
  constructor(
    @Inject(PP_REASON_CODES_REPO) private readonly repo: IPpReasonCodesRepo,
  ) {}

  /** Active codes, ordered by sort_order then id. */
  findActive(): Promise<Result<PpReasonCodeRow[]>> {
    return this.repo.findActive();
  }

  /** Create a new reason code. */
  create(dto: CreatePpReasonCodeInput): Promise<Result<PpReasonCodeRow>> {
    return this.repo.create(dto);
  }

  /** Partial update (incl. deactivate via is_active=false). Ok(null) if id not found. */
  update(id: number, patch: UpdatePpReasonCodeInput): Promise<Result<PpReasonCodeRow | null>> {
    return this.repo.update(id, patch);
  }
}
