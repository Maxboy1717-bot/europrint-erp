/**
 * @module get-downtime-summary.query
 * @description Source module. See exports for details.
 */

export class GetDowntimeSummaryQuery {
  constructor(public readonly from: Date,
    public readonly to: Date) {}
}
