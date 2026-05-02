export class GetInvoicesQuery {
  constructor(public readonly salesOrderId?: string,
    public readonly status?: string,
    public readonly from?: Date,
    public readonly to?: Date,
    public readonly page: number = 1,
    public readonly limit: number = 20) {}
}
