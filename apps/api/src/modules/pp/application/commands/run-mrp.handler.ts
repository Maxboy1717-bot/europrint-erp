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
 * WHY FOUR LOT-SIZING METHODS
 *   - L4L (Lot-for-lot)    Simplest. Order exactly what's needed each period.
 *                          Zero holding cost but max setup cost. Good for
 *                          cheap-to-order / expensive-to-hold materials.
 *   - EOQ (Economic OQ)    Order a fixed quantity computed from the
 *                          √(2DK/h) formula. Stable but ignores demand lumps.
 *                          Good for steady-demand commodity items.
 *   - POQ (Period OQ)      Fixed-period coverage (e.g. always 4 weeks).
 *                          Reduces order count, accepts some over-stock.
 *   - Wagner-Whitin        Optimal dynamic-program solution. Minimises
 *                          (setup + holding) over the planning horizon for
 *                          a given demand stream. Worth the O(n²) when items
 *                          have lumpy demand and significant setup cost.
 *
 *   Materials with seasonal demand benefit most from W-W; commodities stay
 *   on EOQ; consumables (glue, ink) typically L4L. The lot-sizing method is
 *   stored per material and chosen by the planner, not auto-detected.
 */

import { Injectable } from '@nestjs/common';
import { Calculation } from '@common/decorators/calculation.decorator';
import { safeNum } from '@common/math/math-utils';
import { Ok, Err, Result, AppError } from '@common/result';
import { BomExplosionService } from '../../domain/services/bom-explosion.service';
import type { BomEdge } from '../../domain/services/bom-explosion.service';

export type LotSizingMethod = 'L4L' | 'EOQ' | 'POQ' | 'WAGNER_WHITIN';

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

function makeMrpErr(msg: string): AppError {
  return { code: 'VALIDATION', message: msg };
}

/**
 * @description Wagner-Whitin optimal lot sizing — classical O(n²) DP.
 *
 *   Given net requirements `r[0..n-1]`, setup cost K, and holding cost h:
 *
 *   Holding cost for one order placed in period t covering up to period k:
 *     HC(t,k) = h × Σ_{i=t+1}^{k} (i - t) × r[i]
 *     (r[t] consumed immediately = 0 holding; r[t+1] held 1 period; …)
 *
 *   Bellman recurrence (cost to satisfy demand from period t onward):
 *     f[n] = 0
 *     f[t] = min_{k=t}^{n-1} { K + HC(t,k) + f[k+1] }
 *
 *   `split[]` stores the optimal cover-end for each starting period — used
 *   in a single backward pass to materialise the per-period lot sizes.
 *
 *   Returns lot quantities indexed by period. Periods with 0 mean "no order
 *   placed in this period — demand is covered by a prior order".
 */
function wagnerWhitin(
  netRequirements: number[],
  orderingCost: number = 100,
  holdingCostPerUnit: number = 1,
): number[] {
  const n = netRequirements.length;
  if (n === 0) return [];

  const INF = Infinity;
  const cost = new Array<number>(n + 1).fill(0);
  const split = new Array<number>(n).fill(0);

  for (let t = n - 1; t >= 0; t--) {
    cost[t] = INF;
    let holdingCost = 0;

    for (let k = t; k < n; k++) {
      // Holding cost for r[k]: held (k-t) periods at h per unit per period
      holdingCost += (k - t) * safeNum(netRequirements[k]) * holdingCostPerUnit;

      const totalCost = orderingCost + holdingCost + cost[k + 1];
      if (totalCost < cost[t]) {
        cost[t] = totalCost;
        split[t] = k + 1;
      }
    }
  }

  // Reconstruct: lot placed at period t covers periods t..split[t]-1
  const lotSizes = new Array<number>(n).fill(0);
  let t = 0;
  while (t < n) {
    const end = split[t];
    let lotQty = 0;
    for (let k = t; k < end; k++) {
      lotQty += safeNum(netRequirements[k]);
    }
    if (lotQty > 0) lotSizes[t] = lotQty;
    t = end;
  }

  return lotSizes;
}

function leadTimePeriodOffset(leadTimeDays: number): number {
  return Math.max(0, Math.ceil(safeNum(leadTimeDays) / 7));
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
    // Safety Stock konvensiyasi: NR = max(0, GR - OH - SR - SS)
    // Bu "buffer stock as floor" — OH + SR >= SS bo'lsa, qo'shimcha buyurtma bo'lmaydi.
    // Ba'zi standartlarda SS = qo'shimcha talab sifatida qo'shiladi (GR+SS-OH-SR).
    // Domain egasi bilan kelishuv asosida bu formula tanlanadi.

    const policyMap = new Map((Array.isArray(policies) ? policies : []).map((p) => [p.materialId, p]));
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

    const plannedOrders: PlannedOrder[] = [];
    const netRequirements: MrpRunResult['netRequirements'] = [];

    for (const [matId, grossByPeriod] of grossByMaterial) {
      const policy = policyMap.get(matId) ?? {
        materialId: matId,
        lotSizingMethod: 'L4L' as LotSizingMethod,
        leadTimeDays: 0,
        safetyStock: 0,
      };

      const oh0 = safeNum(onHandByMaterial[matId]);
      const ss = safeNum(policy.safetyStock);
      const srByPeriod = scheduledReceiptsByMaterial[matId] ?? [];
      const ltOffset = leadTimePeriodOffset(policy.leadTimeDays);

      if (policy.lotSizingMethod === 'WAGNER_WHITIN') {
        // Wagner-Whitin: barcha davrlar uchun NR ni avval hisoblaymiz
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
        //
        // Talab ijobiy bo'lganda, [t, t+poqN) bucket ni qoplaymiz.
        // Lot miqdori = max(0, totalBucketGR - oh_at_t_start - futureSRs)
        //   bu yerda oh_at_t_start = joriy mavjud zaxira (SR[t] qo'shilgan)
        //   futureSRs = Σ_{k=t+1}^{t+poqN-1} SR[k]
        //
        // Misol: OH=2, demand=[5,5], POQ=2 → lot=max(0,10-2)=8 (10 emas)
        const poqN = Math.max(1, safeNum(policy.poqPeriods, 1));
        let oh = oh0;
        let t = 0;

        while (t < horizonPeriods) {
          const gr = safeNum(grossByPeriod[t]);
          const sr = safeNum(srByPeriod[t]);
          oh += sr; // SR[t] joriy zaxiraga qo'shiladi
          const nr = Math.max(0, gr - oh - ss);
          netRequirements.push({ materialId: matId, period: t, gr, sr, nr });

          if (nr > 0) {
            // Bucket jami GR va kelajakdagi SR
            let totalBucketGR = 0;
            let totalFutureSR = 0; // SR[t] allaqachon oh ga qo'shilgan

            for (let k = t; k < Math.min(t + poqN, horizonPeriods); k++) {
              totalBucketGR += safeNum(grossByPeriod[k]);
              if (k > t) totalFutureSR += safeNum(srByPeriod[k]);
            }

            // LOT = max(0, totalBucketGR - oh (SR[t] qo'shilgan) - futureSRs)
            const lotQty = Math.max(0, totalBucketGR - oh - totalFutureSR);
            const releaseByPeriod = Math.max(0, t - ltOffset);

            if (lotQty > 0) {
              plannedOrders.push({ materialId: matId, qty: lotQty, periodIndex: t, releaseByPeriod });
            }

            oh = Math.max(0, oh + lotQty - gr);

            // Qoplangan keyingi davrlarga NR=0 deb belgilaymiz
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

          // SR_t: mavjud zaxiraga qo'shiladi (rejalashtirilgan kelishi)
          oh += sr;

          // NR_t = max(0, GR_t - OH_t - SS)
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
    }

    return Ok({ plannedOrders, netRequirements, runAt: new Date() });
  }
}
