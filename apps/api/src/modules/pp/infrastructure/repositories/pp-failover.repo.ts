/**
 * @module pp-failover.repo
 * @description Repository / data-access layer for the alternative-work-center
 *   fail-over (vision 07-pp#24). Owns the re-route write against the canonical
 *   BASE TABLE routing_operations (pp_routing_operations is a VIEW — never write
 *   the view). Returns Result<T> (Qoida 1/15).
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Result, Ok, Err, AppErr } from '@common/result';

export interface ReroutedOperation {
  id: number;
  fromWorkCenterId: number;
  toWorkCenterId: number;
}

@Injectable()
export class PpFailoverRepository {
  /**
   * Re-route every active operation whose PRIMARY work-center is the downed one AND
   * which declares an alternative, onto that alternative. Idempotent: after a switch
   * the row's work_center_id equals the alternative, so a re-run matches nothing.
   * Writes routing_operations (base table); the pp_routing_operations view reflects it.
   */
  async rerouteOnDowntime(downWorkCenterId: number): Promise<Result<ReroutedOperation[]>> {
    if (!Number.isFinite(downWorkCenterId) || downWorkCenterId <= 0) {
      return Err(AppErr('VALIDATION', "downWorkCenterId musbat butun son bo'lishi kerak"));
    }
    try {
      const r = await runQuery<{ id: number; to_wc: number }>(sql`
        UPDATE routing_operations
        SET work_center_id = alternative_work_center_id
        WHERE work_center_id = ${downWorkCenterId}
          AND alternative_work_center_id IS NOT NULL
          AND is_active = true
        RETURNING id, work_center_id AS to_wc
      `);
      const rows = Array.isArray(r?.rows) ? r.rows : [];
      return Ok(
        rows.map((x) => ({
          id: Number(x.id),
          fromWorkCenterId: downWorkCenterId,
          toWorkCenterId: Number(x.to_wc),
        })),
      );
    } catch (e) {
      return Err(AppErr('DB_ERROR', String(e)));
    }
  }
}
