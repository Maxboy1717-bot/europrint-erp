export class GetPaymentsQuery {
  constructor(public readonly filters: {
      invoiceId?: string;
      from?: Date;
      to?: Date;
      page?: number;
      limit?: number;
    }) {}
}
