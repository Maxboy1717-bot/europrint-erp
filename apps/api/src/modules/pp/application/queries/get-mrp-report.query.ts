/**
 * @module get-mrp-report.query
 * @description Source module. See exports for details.
 */

export class GetMrpReportQuery {
  constructor(public readonly filters: {
      productionOrderId?: string;
    }) {}
}
