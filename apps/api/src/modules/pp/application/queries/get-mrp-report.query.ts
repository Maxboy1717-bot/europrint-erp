export class GetMrpReportQuery {
  constructor(public readonly filters: {
      productionOrderId?: string;
    }) {}
}
