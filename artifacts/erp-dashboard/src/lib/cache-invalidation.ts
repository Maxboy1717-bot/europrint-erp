/**
 * @module cache-invalidation
 * @description Golden-thread (SD→PP→MES→QC) cross-module cache cascade.
 *
 * When a sales order advances/approves, the backend listener
 * (sales-order-ready-planning.listener) creates production_orders (PP), which
 * flow downstream to MES (sessions/OEE) and QC (defects/inspections). Before
 * this helper, the FE only invalidated the SD query key, so PP/MES/QC pages
 * showed STALE data after an order changed (audit F22).
 *
 * Implementation note: FE query keys are arrays whose first element is the full
 * URL string (e.g. ["/api/qc/defects"], ["/api/mes/oee"]). They are SEPARATE
 * top-level keys, not nested under ["/api/qc"], so TanStack's default
 * prefix-match on ["/api/qc"] would NOT catch them. We therefore use a
 * `predicate` that string-prefix-matches key[0] against the module roots — this
 * catches EVERY endpoint under each module (incl. ones not enumerated here, like
 * /api/qc/braks, /api/qc/lab-tests) and stays correct as new endpoints are added.
 */

import { QueryClient } from "@tanstack/react-query";

/** Module roots whose caches go stale when a sales order changes state. */
const ORDER_CASCADE_PREFIXES = [
  "/api/sd/orders",
  "/api/sd/dashboard",
  "/api/pp",
  "/api/production",
  "/api/planning",
  "/api/mes",
  "/api/qc",
] as const;

/**
 * Invalidate all SD→PP→MES→QC caches after a sales-order state change.
 * Call from the onSuccess of order advance/approve mutations.
 */
export function invalidateOrderCascade(client: QueryClient): void {
  client.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey?.[0];
      return (
        typeof key === "string" &&
        ORDER_CASCADE_PREFIXES.some((prefix) => key.startsWith(prefix))
      );
    },
  });
}
