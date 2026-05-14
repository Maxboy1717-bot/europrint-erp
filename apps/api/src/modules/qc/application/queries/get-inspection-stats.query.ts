/**
 * @module get-inspection-stats.query
 * @description Source module. See exports for details.
 */

export class GetInspectionStatsQuery {
  constructor(readonly fromDate?: Date,
    readonly toDate?: Date) {}
}
