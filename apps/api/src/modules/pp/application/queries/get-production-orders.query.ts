/**
 * @module get-production-orders.query
 * @description Source module. See exports for details.
 */

export class GetProductionOrdersQuery {
  constructor(public readonly filters: {
      status?: string;
      salesOrderId?: string;
      from?: Date;
      to?: Date;
      page?: number;
      limit?: number;
    }) {}
}
