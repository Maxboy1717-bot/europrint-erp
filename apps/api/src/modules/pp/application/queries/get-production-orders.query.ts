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
