/**
 * @module fmea.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppError } from '@common/result';
import { safeNum } from '@common/math/math-utils';
import { Calculation } from '@common/decorators/calculation.decorator';
import { ROUND_2DP_FACTOR, PERCENT_MULTIPLIER } from '@common/constants/app.constants';
import {
  FMEA_CRITICAL_RPN,
  FMEA_HIGH_RPN,
  FMEA_MEDIUM_RPN,
  FMEA_SOD_MIN,
  FMEA_SOD_MAX,
  DPMO_PER_MILLION,
  MOTOROLA_SIGMA_SHIFT,
  DPMO_WORLD_CLASS_MAX,
  SIGMA_6_THRESHOLD,
  SIGMA_5_THRESHOLD,
  SIGMA_4_THRESHOLD,
  SIGMA_3_THRESHOLD,
  PARETO_VITAL_FEW_PCT,
} from '../../constants/qc.constants';

export type RpnPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface RpnResult {
  rpn: number;
  priority: RpnPriority;
  requiresMitigation: boolean;
  requiresStopProduction: boolean;
}

export interface FmeaItem {
  failureMode: string;
  severity: number;
  occurrence: number;
  detection: number;
  rpn?: number;
  priority?: RpnPriority;
}

export interface DpmoResult {
  dpmo: number;
  sigmaLevel: number;
  isWorldClass: boolean;
  grade: string;
}

export interface ParetoItem {
  category: string;
  count: number;
  percentage: number;
  cumulative: number;
  isVital: boolean;
}

/**
 * TZ-31 + TZ-32 + TZ-33: FMEA, DPMO + Six Sigma, Defect Pareto
 *
 * FMEA:
 *   RPN = S × O × D  (har biri 1..10)
 *   RPN > 200 → ishlab chiqarishni to'xtatish
 *   RPN > 100 → mitigation talab qilinadi
 *
 * DPMO:
 *   DPMO = (Defects / (Opportunities × Units)) × 10⁶
 *   σ-level = Φ⁻¹(1 − DPMO/10⁶) + 1.5  (Motorola 1.5-shift)
 *
 * Pareto (80/20):
 *   Kamchiliklar soni bo'yicha kamayish tartibida saralash
 *   Kumulyativ % ≤ 80 → vital few (asosiy sabablar)
 */
@Injectable()
export class FmeaService {
  // -------------------------------------------------------------------------
  // TZ-32: FMEA RPN
  // -------------------------------------------------------------------------
  @Calculation('qc.fmea.rpn')
  async calculateRpn(
    severity: number,
    occurrence: number,
    detection: number,
  ): Promise<Result<RpnResult, AppError>> {
    const vals = [severity, occurrence, detection];
    if (vals.some(v => !Number.isInteger(v) || v < FMEA_SOD_MIN || v > FMEA_SOD_MAX)) {
      return Err({ code: 'BAD_REQUEST', message: 'S, O, D har biri 1..10 oralig\'ida bo\'lishi kerak' });
    }

    const rpn = severity * occurrence * detection;
    const priority: RpnPriority =
      rpn > FMEA_CRITICAL_RPN ? 'CRITICAL' :
      rpn > FMEA_HIGH_RPN     ? 'HIGH'     :
      rpn > FMEA_MEDIUM_RPN   ? 'MEDIUM'   : 'LOW';

    return Ok({
      rpn,
      priority,
      requiresMitigation:     rpn > FMEA_HIGH_RPN,
      requiresStopProduction: rpn > FMEA_CRITICAL_RPN,
    });
  }

  @Calculation('qc.fmea.analyze')
  async analyzeFmea(items: FmeaItem[]): Promise<Result<FmeaItem[], AppError>> {
    if (!items.length) {
      return Err({ code: 'BAD_REQUEST', message: 'FMEA elementi kiritilmagan' });
    }

    for (const item of items) {
      const vals = [item.severity, item.occurrence, item.detection];
      if (vals.some(v => !Number.isInteger(v) || v < FMEA_SOD_MIN || v > FMEA_SOD_MAX)) {
        return Err({ code: 'BAD_REQUEST', message: `FMEA '${item.failureMode}': S/O/D har biri 1..10 bo'lishi kerak` });
      }
    }

    const results: FmeaItem[] = items.map(item => {
      const rpn = safeNum(item.severity) * safeNum(item.occurrence) * safeNum(item.detection);
      const priority: RpnPriority =
        rpn > FMEA_CRITICAL_RPN ? 'CRITICAL' :
        rpn > FMEA_HIGH_RPN     ? 'HIGH'     :
        rpn > FMEA_MEDIUM_RPN   ? 'MEDIUM'   : 'LOW';
      return { ...item, rpn, priority };
    });

    return Ok(results.sort((a, b) => (b.rpn ?? 0) - (a.rpn ?? 0)));
  }

  // -------------------------------------------------------------------------
  // TZ-31: DPMO + Six Sigma darajasi
  // -------------------------------------------------------------------------

  /**
   * Φ⁻¹ taqribiy hisoblash — Abramowitz & Stegun (A&S) algoritmi
   * Standart normal taqsimotning teskari CDF
   */
  private _invNormCdf(p: number): number {
    if (p <= 0) return -8;
    if (p >= 1) return  8;
    const a = [0, -3.969683028665376e+01, 2.209460984245205e+02,
      -2.759285104469687e+02, 1.383577518672690e+02,
      -3.066479806614716e+01, 2.506628277459239e+00];
    const b = [0, -5.447609879822406e+01, 1.615858368580409e+02,
      -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
    const c = [0, -7.784894002430293e-03, -3.223964580411365e-01,
      -2.400758277161838e+00, -2.549732539343734e+00,
       4.374664141464968e+00,  2.938163982698783e+00];
    const d = [0, 7.784695709041462e-03, 3.224671290700398e-01,
      2.445134137142996e+00, 3.754408661907416e+00];

    const pLow  = 0.02425;
    const pHigh = 1 - pLow;

    if (p < pLow) {
      const q = Math.sqrt(-2 * Math.log(p));
      return (((((c[1]*q+c[2])*q+c[3])*q+c[4])*q+c[5])*q+c[6]) /
             ((((d[1]*q+d[2])*q+d[3])*q+d[4])*q+1);
    }
    if (p <= pHigh) {
      const q = p - 0.5;
      const r = q * q;
      return (((((a[1]*r+a[2])*r+a[3])*r+a[4])*r+a[5])*r+a[6])*q /
             (((((b[1]*r+b[2])*r+b[3])*r+b[4])*r+b[5])*r+1);
    }
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[1]*q+c[2])*q+c[3])*q+c[4])*q+c[5])*q+c[6]) /
              ((((d[1]*q+d[2])*q+d[3])*q+d[4])*q+1);
  }

  @Calculation('qc.dpmo.calculate')
  async calculateDpmo(
    defects: number,
    opportunities: number,
    units: number,
  ): Promise<Result<DpmoResult, AppError>> {
    if (opportunities <= 0 || units <= 0) {
      return Err({ code: 'BAD_REQUEST', message: 'opportunities va units > 0 bo\'lishi kerak' });
    }
    if (defects < 0) {
      return Err({ code: 'BAD_REQUEST', message: 'defects ≥ 0 bo\'lishi kerak' });
    }

    const dpmo = safeNum((defects / (opportunities * units)) * DPMO_PER_MILLION);

    // Motorola MOTOROLA_SIGMA_SHIFT σ shift: σ = Φ⁻¹(1 − DPMO/10⁶) + MOTOROLA_SIGMA_SHIFT
    let sigmaLevel = 0;
    const prob = 1 - dpmo / DPMO_PER_MILLION;
    if (prob > 0 && prob < 1) {
      sigmaLevel = Math.max(0, this._invNormCdf(prob) + MOTOROLA_SIGMA_SHIFT);
    }

    const grade =
      sigmaLevel >= SIGMA_6_THRESHOLD ? '6σ (world-class)' :
      sigmaLevel >= SIGMA_5_THRESHOLD ? '5σ (excellent)'   :
      sigmaLevel >= SIGMA_4_THRESHOLD ? '4σ (good)'         :
      sigmaLevel >= SIGMA_3_THRESHOLD ? '3σ (average)'      : '<3σ (poor)';

    return Ok({
      dpmo:         Math.round(dpmo * ROUND_2DP_FACTOR) / ROUND_2DP_FACTOR,
      sigmaLevel:   Math.round(sigmaLevel * ROUND_2DP_FACTOR) / ROUND_2DP_FACTOR,
      isWorldClass: dpmo <= DPMO_WORLD_CLASS_MAX,
      grade,
    });
  }

  // -------------------------------------------------------------------------
  // TZ-33: Defect Pareto Tahlili (80/20)
  // -------------------------------------------------------------------------
  @Calculation('qc.pareto.analyze')
  async paretoAnalysis(
    defectCounts: Record<string, number>,
  ): Promise<Result<ParetoItem[], AppError>> {
    const entries = Object.entries(defectCounts);
    if (!entries.length) {
      return Err({ code: 'BAD_REQUEST', message: 'Kamchilik ma\'lumotlari kiritilmagan' });
    }

    const total = entries.reduce((s, [, n]) => s + safeNum(n), 0);
    if (total === 0) {
      return Err({ code: 'BAD_REQUEST', message: 'Jami kamchilik soni 0' });
    }

    const sorted = [...entries].sort((a, b) => safeNum(b[1]) - safeNum(a[1]));
    let cumulative = 0;

    const result: ParetoItem[] = sorted.map(([category, count]) => {
      const pct = safeNum((count / total) * PERCENT_MULTIPLIER);
      cumulative += pct;
      return {
        category,
        count: safeNum(count),
        percentage: Math.round(pct * 10) / 10,
        cumulative: Math.round(cumulative * 10) / 10,
        isVital: cumulative <= PARETO_VITAL_FEW_PCT,
      };
    });

    return Ok(result);
  }
}
