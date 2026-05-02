export class GetInvoicesQuery {
  constructor(public readonly filters: {
      status?: string;
      customerId?: string;
      from?: Date;
      to?: Date;
      page?: number;
      limit?: number;
    }) {}
}
