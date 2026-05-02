export class GetReadingsQuery {
  constructor(readonly deviceId: string,
    readonly from?: Date,
    readonly to?: Date,
    readonly limit: number = 100) {}
}
