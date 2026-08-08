/**
 * @module i-zone-risk.repo
 * @description Domain repository interface for the IoT-signal zone at-risk flag
 *   (Vision 10-warehouse #6). An IoT anomaly in a warehouse zone flags ALL
 *   warehouse_stock rows physically located in that zone (via bin -> zone) as
 *   "at risk" and enqueues one qc_review_queue entry per newly flagged row.
 *   Concrete implementation:
 *   `infrastructure/repositories/zone-risk.repository.ts`.
 * @layer Domain (WMS)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export interface ZoneRiskCounts {
  flaggedCount: number;
  queuedCount: number;
}

export interface ZoneClearCounts {
  clearedCount: number;
  resolvedCount: number;
}

export interface IZoneRiskRepo {
  /** Flag all stock in `zoneId` as at-risk + enqueue QC review rows. Idempotent (already-flagged rows are skipped). */
  flagZoneAtRisk(zoneId: number, reason: string): Promise<Result<ZoneRiskCounts>>;
  /** Clear the at-risk flag for a zone and resolve its pending QC review entries. */
  clearZoneAtRisk(zoneId: number, resolvedBy: number | null): Promise<Result<ZoneClearCounts>>;
  /** Pending QC review-queue rows (optionally filtered by zone). */
  listReviewQueue(zoneId: number | null, limit: number): Promise<Result<Row[]>>;
  /** Current at-risk stock rows (material + zone context). */
  listAtRiskStock(limit: number): Promise<Result<Row[]>>;
}

export const ZONE_RISK_REPO = Symbol('ZONE_RISK_REPO');
