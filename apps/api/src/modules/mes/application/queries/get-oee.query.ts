export class GetOeeQuery {
  constructor(public readonly filters: {
      workCenterId?: string;
      from?: Date;
      to?: Date;
    }) {}
}
