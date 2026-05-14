/**
 * @module dpmo.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { Calculation } from '@common/decorators/calculation.decorator';
import { safeDiv, safeNum } from '@common/math/math-utils';
import { Ok, Err, Result, AppError } from '@common/result';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

export const DPMO_SCALE = 1_000_000;

const SIGMA_TABLE = [
  { sigma: 6, dpmo: 3.4 },
  { sigma: 5, dpmo: 233 },
  { sigma: 4, dpmo: 6_210 },
  { sigma: 3, dpmo: 66_807 },
  { sigma: 2, dpmo: 308_537 },
  { sigma: 1, dpmo: 690_000 },
] as const;

// Abramowitz & Stegun constants
const A0 = 2.515517;
const A1 = 0.802853;
const A2 = 0.010328;
const B1 = 1.432788;
const B2 = 0.189269;
const B3 = 0.001308;
const MOTOROLA_SHIFT = 1.5;

export interface DpmoInput {
  defects: number;
  opportunities: number;
  units: number;
  usl?: number;
  lsl?: number;
  processMean?: number;
  processSigma?: number;
}

export interface DpmoResult {
  dpmo: number;
  sigmaLevel: number;
  qualityLevel: string;
  cp?: number;
  cpk?: number;
  dpmoTable: readonly { sigma: number; dpmo: number }[];
}

export interface ProcessDpmoData {
  defects: number;
  itemsChecked: number;
}

function normalQuantile(p: number): number {
  const q = p < 0.5 ? p : 1 - p;
  const t = Math.sqrt(-2 * Math.log(Math.max(q, 1e-15)));
  const z = t - (A0 + A1 * t + A2 * t * t) / (1 + B1 * t + B2 * t * t + B3 * t * t * t);
  return p < 0.5 ? -z : z;
}

const SIGMA_EPSILON = 1e-15;

function sigmaFromDpmo(dpmo: number): number {
  const defectProb = safeDiv(dpmo, DPMO_SCALE);
  // Clamp p into (SIGMA_EPSILON, 1-SIGMA_EPSILON) so that:
  // - dpmo=0 (perfect) → p≈1 → very high sigma (≥6)
  // - dpmo=DPMO_SCALE (all defective) → p≈0 → very low sigma
  const p = Math.min(Math.max(1 - defectProb, SIGMA_EPSILON), 1 - SIGMA_EPSILON);
  const z = normalQuantile(p);
  return Math.max(0, z + MOTOROLA_SHIFT);
}

function qualityLabel(sigma: number): string {
  if (sigma >= 6) return 'World Class (6σ)';
  if (sigma >= 5) return 'Excellent (5σ)';
  if (sigma >= 4) return '4σ';
  if (sigma >= 3) return '3σ';
  if (sigma >= 2) return '2σ';
  return 'Below 2σ';
}

@Injectable()
export class DpmoService {
  /**
   * Load inspection aggregates for a given process/job ID from qc_inspections.
   * Called by QcDpmoController.getDpmoByProcess — keeps controllers DB-free.
   */
  async getProcessDpmoData(processId: string): Promise<ProcessDpmoData> {
    const rows = await runQuery<{ defects: number; items_checked: number }>(sql`
      SELECT
        COALESCE(SUM(i.items_failed), 0)::int AS defects,
        COALESCE(SUM(i.items_checked), 1)::int AS items_checked
      FROM qc_inspections i
      WHERE i.reference_id::text = ${processId}
        AND i.reference_type = 'production_order'
    `);
    return {
      defects:      safeNum(rows[0]?.defects ?? 0),
      itemsChecked: Math.max(safeNum(rows[0]?.items_checked ?? 1), 1),
    };
  }

  @Calculation('qc.dpmo.calculate')
  async calculate(input: DpmoInput): Promise<Result<DpmoResult, AppError>> {
    const defects = safeNum(input.defects);
    const opportunities = safeNum(input.opportunities);
    const units = safeNum(input.units);

    if (defects < 0) return Err({ code: 'VALIDATION', message: 'defects manfiy bo\'lishi mumkin emas' });
    if (opportunities <= 0) return Err({ code: 'VALIDATION', message: 'opportunities musbat bo\'lishi kerak' });
    if (units <= 0) return Err({ code: 'VALIDATION', message: 'units musbat bo\'lishi kerak' });

    const dpmo = safeDiv(defects, opportunities * units) * DPMO_SCALE;
    const sigmaLevel = sigmaFromDpmo(dpmo);

    const result: DpmoResult = {
      dpmo,
      sigmaLevel,
      qualityLevel: qualityLabel(sigmaLevel),
      dpmoTable: SIGMA_TABLE,
    };

    if (
      input.usl !== undefined &&
      input.lsl !== undefined &&
      input.processMean !== undefined &&
      input.processSigma !== undefined &&
      safeNum(input.processSigma) > 0
    ) {
      const sigma = safeNum(input.processSigma);
      const mean = safeNum(input.processMean);
      const usl = safeNum(input.usl);
      const lsl = safeNum(input.lsl);
      result.cp = safeDiv(usl - lsl, 6 * sigma);
      result.cpk = Math.min(safeDiv(usl - mean, 3 * sigma), safeDiv(mean - lsl, 3 * sigma));
    }

    return Ok(result);
  }
}
