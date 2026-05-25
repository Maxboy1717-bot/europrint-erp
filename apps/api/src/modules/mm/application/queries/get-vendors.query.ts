/**
 * @module get-vendors.query
 * @description Source module. See exports for details.
 */

export class GetVendorsQuery {
  constructor(readonly isActive?: boolean,
    readonly page: number = 1,
    readonly limit: number = 20) {}
}
