export class GetVendorsQuery {
  constructor(readonly isActive?: boolean,
    readonly page: number = 1,
    readonly limit: number = 20) {}
}
