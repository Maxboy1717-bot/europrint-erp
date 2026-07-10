/**
 * @module open-pr-warning.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 *   Vision 10-warehouse #4 — open-PR-quantity warning flag (Ochiq PR miqdori ogohlantirish bayrog'i).
 */
import { Injectable } from '@nestjs/common';
import { Result } from '@common/result';
import { OpenPrWarningRepository } from '../infrastructure/repositories/open-pr-warning.repository';

type Row = Record<string, unknown>;

@Injectable()
export class OpenPrWarningService {
  constructor(private readonly repo: OpenPrWarningRepository) {}

  /** Run the comparison job: recompute the open-qty warning flag across all purchase requests. */
  recompute(): Promise<Result<{ changed: number }>> {
    return this.repo.recomputeWarnings();
  }

  /** List purchase requests currently flagged with an open (unfulfilled) quantity. */
  listOpenWarnings(lim = 100): Promise<Result<Row[]>> {
    return this.repo.findOpenWarnings(lim);
  }
}
