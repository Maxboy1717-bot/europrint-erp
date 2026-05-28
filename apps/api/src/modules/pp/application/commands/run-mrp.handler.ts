/**
 * @module run-mrp.handler
 * @description Material Requirements Planning (MRP) runner. Takes a Master
 *   Production Schedule (MPS) and explodes it through the Bill of Materials
 *   to produce planned purchase/production orders for every component.
 *
 *   Inputs:
 *     - MPS rows: which finished products need to be ready in which period
 *     - BOM edges: parent→child component relationships with quantity per
 *     - Material policies: lot-sizing method (L4L / EOQ / POQ / Wagner-Whitin),
 *       lead time, safety stock per material
 *     - Current on-hand and scheduled-receipts per material per period
 *
 *   Output: a flat list of `PlannedOrder` entries. Each one carries:
 *     - quantity to procure / produce
 *     - the period the demand falls in
 *     - the period to **release** the order so it arrives on time (period - leadTime)
 * @layer CQRS Command Handler (PP)
 *
 * WHY THIS LIVES IN A SINGLE HANDLER, NOT A SERVICE
 *   MRP is a transactional, idempotent compute over a snapshot of demand.
 *   Treating it as a Command (handle once, persist result) matches the
 *   user-visible workflow ("run MRP for week 42"). The result is written
 *   atomically by the calling queue processor — no partial states.
 *
 * Lot-sizing primitives (wagnerWhitin, leadTimePeriodOffset, LotSizingMethod)
 * live in `./run-mrp-lot-sizing.ts` so this file stays under 300 lines.
 */

import { Injectable } from '@nestjs/common';
import { Calculation } from '@common/decorators/calculation.decorator';
import { safeNum } from '@common/math/math-utils';
import { Ok, Err, Result, AppError } from '@common/result';
import { BomExplosionService } from '../../domain/services/bom-explosion.service';
import type { BomEdge } from '../../domain/services/bom-explosion.service';
import { wagnerWhitin, leadTimePeriodOffset, LotSizingMethod } from './run-mrp-lot-sizing';

// Re-export for downstream importers that pulled `LotSizingMethod` from this module.
export type { LotSizingMethod };

export interface MpsRow {
  productId: string;
  periodIndex: number;
  quantity: number;
}

export interface MaterialPolicy {
  materialId: string;
  lotSizingMethod: LotSizingMethod;
  eoq?: number;
  poqPeriods?: number;
  leadTimeDays: number;
  safetyStock?: number;
}

export interface PlannedOrder {
  materialId: string;
  qty: number;
  periodIndex: number;
  releaseByPeriod: number;
}

export interface MrpRunResult {
  plannedOrders: PlannedOrder[];
  netRequirements: { materialId: string; period: number; gr: number; sr: number; nr: number }[];
  runAt: Date;
}

export interface NrEntry {
  materialId: string;
  period: number;
  gr: number;
  sr: number;
  nr: number;
}

function makeMrpErr(msg: string): AppError {
  return { code: 'VALIDATION', message: msg };
}

@Injectable()
export class RunMrpHandler {
  constructor(private readonly bomService: BomExplosionService) {}

  /**
   * TZ-10: MRP — Material Requirements Planning (to'liq)
   *
   * Gross Requirement: GR_t(i) = Σ BOM explosion orqali
   *
   * Net Requirement (scheduled receipts SR_t hisobga olingan):
   *   NR_t(i) = max(0, GR_t(i) - OH_t(i) - SR_t(i))
   *
   * Planned Order Release (lead time offset):
   *   POR_{t-L} = LotSize(NR_t)
   *
   * Lot Sizing:
   *   L4L          : POR = NR (minimal holding)
   *   EOQ          : POR = max(NR, EOQ)
   *   POQ          : period-bucketing — n davr talabini birlashtirib buyurtma
   *   Wagner-Whitin: DP O(n²) — optimal lot sizes
   */
  @Calculation('pp.mrp.run')
  async runMrp(input: {
    mpsRows: MpsRow[];
    bomEdges: BomEdge[];
    onHandByMaterial: Record<string, number>;
    scheduledReceiptsByMaterial?: Record<string, number[]>;
    policies: MaterialPolicy[];
    horizonPeriods: number;
  }): Promise<Result<MrpRunResult, AppError>> {
    const {
      mpsRows,
      bomEdges,
      onHandByMaterial,
      scheduledReceiptsByMaterial = {},
      policies,
      horizonPeriods,
    } = input;

    if (!mpsRows.length) return Err(makeMrpErr('MPS satrlari bo\'sh'));
    if (horizonPeriods <= 0) return Err(makeMrpErr('horizonPeriods musbat bo\'lishi kerak'));

    const policyMap = new Map((Array.isArray(policies) ? policies : []).map((p) => [p.materialId, p]));

    const grossResult = await this._buildGrossRequirements(mpsRows, bomEdges, horizonPeriods);
    if (!grossResult.ok) return Err(grossResult.error);
    const grossByMaterial = grossResult.data;

    const plannedOrders: PlannedOrder[] = [];
    const netRequirements: MrpRunResult['netRequirements'] = [];

    for (const [matId, grossByPeriod] of grossByMaterial) {
      // Safety Stock konvensiyasi: NR = max(0, GR - OH - SR - SS)
      // Bu "buffer stock as floor" — OH + SR >= SS bo'lsa, qo'shimcha buyurtma bo'lmaydi.
      const policy = policyMap.get(matId) ?? {
        materialId: matId,
        lotSizingMethod: 'L4L' as LotSizingMethod,
        leadTimeDays: 0,
        safetyStock: 0,
      };

      const oh0 = safeNum(onHandByMaterial[matId]);
      const srByPeriod = scheduledReceiptsByMaterial[matId] ?? [];

      const { plannedOrders: matOrders, netRequirements: matNr } = this._calcNetAndLot(
        matId, grossByPeriod, policy, oh0, srByPeriod, horizonPeriods,
      );
      plannedOrders.push(...matOrders);
      netRequirements.push(...matNr);
    }

    return Ok({ plannedOrders, netRequirements, runAt: new Date() });
  }

  // ── Private helpers ────────────────────────────────────────────────────

  private async _buildGrossRequirements(
    mpsRows: MpsRow[],
    bomEdges: BomEdge[],
    horizonPeriods: number,
  ): Promise<Result<Map<string, number[]>, AppError>> {
    const grossByMaterial = new Map<string, number[]>();

    for (const mps of mpsRows) {
      const result = await this.bomService.explodeInMemory(mps.productId, mps.quantity, bomEdges);
      if (!result.ok) {
        if (result.error.code === 'NOT_FOUND') continue;
        return Err(result.error);
      }

      for (const [matId, qty] of result.data.requirements) {
        if (!grossByMaterial.has(matId)) {
          grossByMaterial.set(matId, new Array(horizonPeriods).fill(0));
        }
        const periods = grossByMaterial.get(matId);
        if (!periods) continue;
        const idx = Math.min(Math.max(0, safeNum(mps.periodIndex)), horizonPeriods - 1);
        periods[idx] = (periods[idx] ?? 0) + qty;
      }
    }

    return Ok(grossByMaterial);
  }

  private _calcNetAndLot(
    matId: string,
    grossByPeriod: number[],
    policy: MaterialPolicy,
    oh0: number,
    srByPeriod: number[],
    horizonPeriods: number,
  ): { plannedOrders: PlannedOrder[]; netRequirements: NrEntry[] } {
    const plannedOrders: PlannedOrder[] = [];
    const netRequirements: NrEntry[] = [];
    const ss = safeNum(policy.safetyStock);
    const ltOffset = leadTimePeriodOffset(policy.leadTimeDays);

    if (policy.lotSizingMethod === 'WAGNER_WHITIN') {
      const nrByPeriod: number[] = [];
      let tempOh = oh0;

      for (let t = 0; t < horizonPeriods; t++) {
        const gr = safeNum(grossByPeriod[t]);
        const sr = safeNum(srByPeriod[t]);
        const nr = Math.max(0, gr - tempOh - sr - ss);
        nrByPeriod.push(nr);
        netRequirements.push({ materialId: matId, period: t, gr, sr, nr });
        tempOh = Math.max(0, tempOh + sr - gr);
      }

      const wwLotSizes = wagnerWhitin(nrByPeriod);
      for (let t = 0; t < horizonPeriods; t++) {
        const lotQty = safeNum(wwLotSizes[t]);
        if (lotQty > 0) {
          const releaseByPeriod = Math.max(0, t - ltOffset);
          plannedOrders.push({ materialId: matId, qty: lotQty, periodIndex: t, releaseByPeriod });
        }
      }
    } else if (policy.lotSizingMethod === 'POQ') {
      // POQ — Period Order Quantity: n davr talabini bitta buyurtmada qoplash
      const poqN = Math.max(1, safeNum(policy.poqPeriods, 1));
      let oh = oh0;
      let t = 0;

      while (t < horizonPeriods) {
        const gr = safeNum(grossByPeriod[t]);
        const sr = safeNum(srByPeriod[t]);
        oh += sr;
        const nr = Math.max(0, gr - oh - ss);
        netRequirements.push({ materialId: matId, period: t, gr, sr, nr });

        if (nr > 0) {
          let totalBucketGR = 0;
          let totalFutureSR = 0;

          for (let k = t; k < Math.min(t + poqN, horizonPeriods); k++) {
            totalBucketGR += safeNum(grossByPeriod[k]);
            if (k > t) totalFutureSR += safeNum(srByPeriod[k]);
          }

          const lotQty = Math.max(0, totalBucketGR - oh - totalFutureSR);
          const releaseByPeriod = Math.max(0, t - ltOffset);

          if (lotQty > 0) {
            plannedOrders.push({ materialId: matId, qty: lotQty, periodIndex: t, releaseByPeriod });
          }

          oh = Math.max(0, oh + lotQty - gr);

          for (let k = t + 1; k < Math.min(t + poqN, horizonPeriods); k++) {
            const futureGr2 = safeNum(grossByPeriod[k]);
            const futureSr2 = safeNum(srByPeriod[k]);
            oh += futureSr2;
            netRequirements.push({ materialId: matId, period: k, gr: futureGr2, sr: futureSr2, nr: 0 });
            oh = Math.max(0, oh - futureGr2);
          }
          t += poqN;
        } else {
          oh = Math.max(0, oh - gr);
          t++;
        }
      }
    } else {
      // L4L / EOQ: period by period
      let oh = oh0;

      for (let t = 0; t < horizonPeriods; t++) {
        const gr = safeNum(grossByPeriod[t]);
        const sr = safeNum(srByPeriod[t]);
        oh += sr;
        const nr = Math.max(0, gr - oh - ss);
        netRequirements.push({ materialId: matId, period: t, gr, sr, nr });

        if (nr > 0) {
          let qty: number;
          if (policy.lotSizingMethod === 'EOQ') {
            qty = Math.max(nr, safeNum(policy.eoq, nr));
          } else {
            qty = nr; // L4L
          }
          const releaseByPeriod = Math.max(0, t - ltOffset);
          plannedOrders.push({ materialId: matId, qty, periodIndex: t, releaseByPeriod });
          oh = Math.max(0, oh + qty - gr);
        } else {
          oh = Math.max(0, oh - gr);
        }
      }
    }

    return { plannedOrders, netRequirements };
  }
}
