/**
 * @module qc-supplier-regime.service
 * @description ISO 2859-1 kuchaytirilgan nazorat (tightened inspection) rejimini per-supplier +
 *   per-material kesimida yuritadi (vision 09-qc#8). Ketma-ket 2 partiya rad -> 'tightened';
 *   'tightened' ostida ketma-ket 5 partiya qabul -> 'normal'. Result<T> (Qoida 1); repo orqali (Qoida 15).
 * @layer Application Service (QC)
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppErr } from '@common/result';
import {
  DrizzleQcSupplierRegimeRepository,
  InspectionRegime,
  RegimeRow,
} from '../infrastructure/repositories/drizzle-qc-supplier-regime.repo';

/**
 * ISO 2859-1 switching thresholds. Fixed by the standard / owner vision 09-qc#8 — NOT tunable data.
 * Normal -> Tightened when consecutive rejected lots reach this count.
 */
export const TIGHTENED_TRIGGER_CONSECUTIVE_REJECTS = 2;
/** Tightened -> Normal when consecutive accepted lots (under tightened) reach this count. */
export const NORMAL_RETURN_CONSECUTIVE_ACCEPTS = 5;

export interface RegimeView {
  supplierId: number;
  materialId: number;
  regime: InspectionRegime;
  consecutiveRejections: number;
  consecutiveAccepts: number;
  tightenedAt: string | null;
}

interface RegimeState {
  regime: InspectionRegime;
  consecutiveRejections: number;
  consecutiveAccepts: number;
  tightenedAt: Date | null;
}

const DEFAULT_STATE: RegimeState = {
  regime: 'normal',
  consecutiveRejections: 0,
  consecutiveAccepts: 0,
  tightenedAt: null,
};

@Injectable()
export class QcSupplierRegimeService {
  constructor(private readonly repo: DrizzleQcSupplierRegimeRepository) {}

  /** Read the effective regime for a (supplier, material) pair; defaults to 'normal' when unseen. */
  async getRegime(supplierId: number, materialId: number): Promise<Result<RegimeView>> {
    const idErr = this.validateIds(supplierId, materialId);
    if (idErr) return idErr;
    const found = await this.repo.findRegime(supplierId, materialId);
    if (!found.ok) return Err<RegimeView>(found.error);
    const state = found.data ? this.toState(found.data) : DEFAULT_STATE;
    return Ok(this.toView(supplierId, materialId, state));
  }

  /**
   * Record one incoming-lot decision (rejected/accepted) and advance the ISO 2859 regime.
   * Read-modify-write on the per-(supplier, material) counter.
   */
  async recordLotResult(input: {
    supplierId: number;
    materialId: number;
    rejected: boolean;
    inspectionId?: number | null;
  }): Promise<Result<RegimeView>> {
    const idErr = this.validateIds(input.supplierId, input.materialId);
    if (idErr) return idErr;

    const found = await this.repo.findRegime(input.supplierId, input.materialId);
    if (!found.ok) return Err<RegimeView>(found.error);
    const current = found.data ? this.toState(found.data) : DEFAULT_STATE;
    const next = this.nextRegimeState(current, input.rejected);

    const saved = await this.repo.upsertRegime({
      supplierId: input.supplierId,
      materialId: input.materialId,
      regime: next.regime,
      consecutiveRejections: next.consecutiveRejections,
      consecutiveAccepts: next.consecutiveAccepts,
      tightenedAt: next.tightenedAt,
      lastInspectionId: input.inspectionId ?? null,
    });
    if (!saved.ok) return Err<RegimeView>(saved.error);
    return Ok(this.toView(input.supplierId, input.materialId, this.toState(saved.data)));
  }

  /** Pure ISO 2859-1 switching computation (no I/O). */
  private nextRegimeState(cur: RegimeState, rejected: boolean): RegimeState {
    let { regime, consecutiveRejections, consecutiveAccepts, tightenedAt } = cur;
    if (rejected) {
      consecutiveRejections += 1;
      consecutiveAccepts = 0;
      if (regime === 'normal' && consecutiveRejections >= TIGHTENED_TRIGGER_CONSECUTIVE_REJECTS) {
        regime = 'tightened';
        tightenedAt = new Date();
      }
    } else {
      consecutiveAccepts += 1;
      consecutiveRejections = 0;
      if (regime === 'tightened' && consecutiveAccepts >= NORMAL_RETURN_CONSECUTIVE_ACCEPTS) {
        regime = 'normal';
        tightenedAt = null;
      }
    }
    return { regime, consecutiveRejections, consecutiveAccepts, tightenedAt };
  }

  private validateIds(supplierId: number, materialId: number): Result<RegimeView> | null {
    if (!Number.isInteger(supplierId) || supplierId <= 0) {
      return Err<RegimeView>(AppErr('VALIDATION', "supplierId musbat butun son bo'lishi kerak"));
    }
    if (!Number.isInteger(materialId) || materialId <= 0) {
      return Err<RegimeView>(AppErr('VALIDATION', "materialId musbat butun son bo'lishi kerak"));
    }
    return null;
  }

  private toState(r: RegimeRow): RegimeState {
    return {
      regime: r.regime,
      consecutiveRejections: r.consecutiveRejections,
      consecutiveAccepts: r.consecutiveAccepts,
      tightenedAt: r.tightenedAt,
    };
  }

  private toView(supplierId: number, materialId: number, s: RegimeState): RegimeView {
    return {
      supplierId,
      materialId,
      regime: s.regime,
      consecutiveRejections: s.consecutiveRejections,
      consecutiveAccepts: s.consecutiveAccepts,
      tightenedAt: s.tightenedAt ? s.tightenedAt.toISOString() : null,
    };
  }
}
