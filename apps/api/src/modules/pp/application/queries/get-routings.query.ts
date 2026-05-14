/**
 * @module get-routings.query
 * @description Source module. See exports for details.
 */

export class GetRoutingsQuery {
  constructor(public readonly filters: {
      page?: number;
      limit?: number;
    }) {}
}
