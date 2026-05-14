/**
 * @module get-oee.query
 * @description Source module. See exports for details.
 */

export class GetOeeQuery {
  constructor(public readonly filters: {
      workCenterId?: string;
      from?: Date;
      to?: Date;
    }) {}
}
