/**
 * @module run-mrp-lot-sizing
 * @description Lot-sizing primitives extracted from `run-mrp.handler.ts` so
 *   the handler stays under 300 lines (Rule 16).
 *
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
 */

import { safeNum } from '@common/math/math-utils';

export type LotSizingMethod = 'L4L' | 'EOQ' | 'POQ' | 'WAGNER_WHITIN';

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
export function wagnerWhitin(
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

export function leadTimePeriodOffset(leadTimeDays: number): number {
  return Math.max(0, Math.ceil(safeNum(leadTimeDays) / 7));
}
