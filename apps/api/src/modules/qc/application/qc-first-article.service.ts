/**
 * @module qc-first-article.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 *
 * 09-qc #62 — the first article halts the run. getReleaseState/assertRunReleased are the
 * halt mechanism; a run may only start once its first article is approved.
 */

import { Injectable } from '@nestjs/common';
import { Result, Ok, Err, AppErr } from '@common/result';
import {
  QcFirstArticleRepository,
  FirstArticleDecision,
  FirstArticleGateRow,
} from '../infrastructure/repositories/qc-first-article.repository';

export interface FirstArticleReleaseState {
  productionOrderId: number;
  status: string;    // 'pending' when no gate row exists yet
  released: boolean; // true ONLY when status === 'approved'
  gate: FirstArticleGateRow | null;
}

@Injectable()
export class QcFirstArticleService {
  constructor(private readonly repo: QcFirstArticleRepository) {}

  /** Record (upsert) the first-article inspection decision for a run. */
  async recordDecision(input: {
    productionOrderId: number;
    decision: FirstArticleDecision;
    sampleSize: number;
    defectCount: number;
    inspectionId: number | null;
    decidedBy: number | null;
    notes: string | null;
  }): Promise<Result<FirstArticleGateRow>> {
    const exists = await this.repo.productionOrderExists(input.productionOrderId);
    if (!exists.ok) return Err(exists.error);
    if (!exists.data) {
      return Err(AppErr('NOT_FOUND', `Ishlab chiqarish buyurtmasi ${input.productionOrderId} topilmadi`));
    }
    return this.repo.recordDecision(input);
  }

  /** Current gate state for a run; released only when the first article is approved. */
  async getReleaseState(productionOrderId: number): Promise<Result<FirstArticleReleaseState>> {
    const gate = await this.repo.findGate(productionOrderId);
    if (!gate.ok) return Err(gate.error);
    const row = gate.data;
    const status = row?.status ?? 'pending';
    return Ok({ productionOrderId, status, released: status === 'approved', gate: row });
  }

  /**
   * HALT enforcement: a production run may only start when its first article is approved.
   * Returns CONFLICT (409) while the run is halted — this is the gate a run-start guard calls.
   */
  async assertRunReleased(productionOrderId: number): Promise<Result<FirstArticleReleaseState>> {
    const state = await this.getReleaseState(productionOrderId);
    if (!state.ok) return state;
    if (!state.data.released) {
      return Err(AppErr(
        'CONFLICT',
        state.data.status === 'rejected'
          ? `Birinchi namuna rad etilgan — tiraj to'xtatilgan (buyurtma ${productionOrderId})`
          : `Birinchi namuna hali tasdiqlanmagan — tiraj to'xtatilgan (buyurtma ${productionOrderId})`,
      ));
    }
    return state;
  }
}
