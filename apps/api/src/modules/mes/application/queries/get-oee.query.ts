/**
 * @module get-oee.query
 * @description CQRS query for OEE aggregation. VISION-3340 #46: carries the
 *   4-level cascade dimension (`groupBy`) — machine (default, per work center),
 *   shift (production_sessions.shift_id), brigade (blocked: no crew/brigade
 *   column exists in the schema yet), shop (work_centers.org_department_id).
 */

/** OEE cascade levels (VISION-3340 #46). 'machine' = legacy per-work-center. */
export type OeeGroupBy = 'machine' | 'shift' | 'brigade' | 'shop';

export class GetOeeQuery {
  constructor(public readonly filters: {
      workCenterId?: string;
      from?: Date;
      to?: Date;
      /**
       * Cascade dimension. Omitted → 'machine' (backward-compatible default).
       * 'brigade' is accepted at the type level but returns NOT_IMPLEMENTED —
       * production_sessions has no crew/brigade column (schema gap, owner call).
       */
      groupBy?: OeeGroupBy;
    }) {}
}
