/**
 * @module get-payments.query
 * @description Source module. See exports for details.
 */

export class GetPaymentsQuery {
  constructor(public readonly filters: {
      invoiceId?: string;
      from?: Date;
      to?: Date;
      page?: number;
      limit?: number;
    }) {}
}
