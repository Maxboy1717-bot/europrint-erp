/**
 * @module delta-e.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppError } from '@common/result';
import { safeNum } from '@common/math/math-utils';
import { Calculation } from '@common/decorators/calculation.decorator';
import {
  DELTA_E_PASS_MAX,
  DELTA_E_REVIEW_MAX,
  DELTA_E_REWORK_MAX,
  DELTA_E_ROUND_FACTOR,
} from '../../constants/qc.constants';

export interface LabColor {
  L: number;
  a: number;
  b: number;
}

export interface DeltaEResult {
  deltaE: number;
  grade: 'PASS' | 'REVIEW' | 'REWORK' | 'SCRAP';
  isPass: boolean;
  isScrap: boolean;
}

/**
 * TZ-38: Rang Delta-E CIEDE2000
 *
 * ΔE₀₀ = √[(ΔL'/(kₗSₗ))² + (ΔC'/(kᶜSᶜ))² + (ΔH'/(kₕSₕ))² + Rₜ(ΔC'ΔH'/(SᶜSₕ))]
 *
 * Standartlar:
 *   ΔE < 1.0  → PASS   (sezilmas farq)
 *   ΔE 1-3    → REVIEW (sezarli farq)
 *   ΔE 3-5    → REWORK (trigger)
 *   ΔE > 5    → SCRAP  (sezilarli farq)
 */
@Injectable()
export class DeltaEService {
  /**
   * CIE2000 to'liq formulasini hisoblaydi
   * kₗ = kᶜ = kₕ = 1 (standart sharoitda)
   */
  @Calculation('qc.deltaE.ciede2000')
  async compute(ref: LabColor, sample: LabColor): Promise<Result<DeltaEResult, AppError>> {
    const L1 = safeNum(ref.L);
    const a1 = safeNum(ref.a);
    const b1 = safeNum(ref.b);
    const L2 = safeNum(sample.L);
    const a2 = safeNum(sample.a);
    const b2 = safeNum(sample.b);

    const deltaE = this._ciede2000(L1, a1, b1, L2, a2, b2);

    const grade: DeltaEResult['grade'] =
      deltaE < DELTA_E_PASS_MAX   ? 'PASS'   :
      deltaE < DELTA_E_REVIEW_MAX ? 'REVIEW' :
      deltaE < DELTA_E_REWORK_MAX ? 'REWORK' : 'SCRAP';

    return Ok({
      deltaE:  Math.round(deltaE * DELTA_E_ROUND_FACTOR) / DELTA_E_ROUND_FACTOR,
      grade,
      isPass:  deltaE < DELTA_E_PASS_MAX,
      isScrap: deltaE >= DELTA_E_REWORK_MAX,
    });
  }

  _ciede2000(L1: number, a1: number, b1: number, L2: number, a2: number, b2: number): number {
    // CIEDE2000 to'liq algoritm (Sharma et al. 2005)
    const kL = 1, kC = 1, kH = 1;

    const C1 = Math.sqrt(a1 ** 2 + b1 ** 2);
    const C2 = Math.sqrt(a2 ** 2 + b2 ** 2);
    const Cbar = (C1 + C2) / 2;

    const G = 0.5 * (1 - Math.sqrt(Cbar ** 7 / (Cbar ** 7 + 25 ** 7)));
    const a1p = a1 * (1 + G);
    const a2p = a2 * (1 + G);

    const C1p = Math.sqrt(a1p ** 2 + b1 ** 2);
    const C2p = Math.sqrt(a2p ** 2 + b2 ** 2);

    const h1p = Math.atan2(b1, a1p) % (2 * Math.PI);
    const h2p = Math.atan2(b2, a2p) % (2 * Math.PI);
    const H1p = h1p < 0 ? h1p + 2 * Math.PI : h1p;
    const H2p = h2p < 0 ? h2p + 2 * Math.PI : h2p;

    const dLp = L2 - L1;
    const dCp = C2p - C1p;

    let dhp = 0;
    if (C1p * C2p !== 0) {
      const diff = H2p - H1p;
      if (Math.abs(diff) <= Math.PI)           dhp = diff;
      else if (diff > Math.PI)  dhp = diff - 2 * Math.PI;
      else                       dhp = diff + 2 * Math.PI;
    }
    const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(dhp / 2);

    const Lbarp = (L1 + L2) / 2;
    const Cbarp = (C1p + C2p) / 2;

    let Hbarp: number;
    if (C1p * C2p === 0) {
      Hbarp = H1p + H2p;
    } else if (Math.abs(H1p - H2p) <= Math.PI) {
      Hbarp = (H1p + H2p) / 2;
    } else {
      Hbarp = H1p + H2p < 2 * Math.PI
        ? (H1p + H2p + 2 * Math.PI) / 2
        : (H1p + H2p - 2 * Math.PI) / 2;
    }

    const T = 1
      - 0.17 * Math.cos(Hbarp - Math.PI / 6)
      + 0.24 * Math.cos(2 * Hbarp)
      + 0.32 * Math.cos(3 * Hbarp + Math.PI / 30)
      - 0.20 * Math.cos(4 * Hbarp - 63 * Math.PI / 180);

    const SL = 1 + 0.015 * (Lbarp - 50) ** 2 / Math.sqrt(20 + (Lbarp - 50) ** 2);
    const SC = 1 + 0.045 * Cbarp;
    const SH = 1 + 0.015 * Cbarp * T;

    const dTheta = (30 * Math.PI / 180) * Math.exp(-(Math.pow((Hbarp * 180 / Math.PI - 275) / 25, 2)));
    const RC = 2 * Math.sqrt(Cbarp ** 7 / (Cbarp ** 7 + 25 ** 7));
    const RT = -Math.sin(2 * dTheta) * RC;

    return Math.sqrt(
      (dLp / (kL * SL)) ** 2 +
      (dCp / (kC * SC)) ** 2 +
      (dHp / (kH * SH)) ** 2 +
      RT * (dCp / (kC * SC)) * (dHp / (kH * SH)),
    );
  }
}
