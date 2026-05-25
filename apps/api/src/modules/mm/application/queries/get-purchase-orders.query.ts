/**
 * @module get-purchase-orders.query
 * @description Source module. See exports for details.
 */

export class GetPurchaseOrdersQuery {
  constructor(readonly status?: string,
    readonly vendorId?: string,
    readonly page: number = 1,
    readonly limit: number = 20) {}
}
