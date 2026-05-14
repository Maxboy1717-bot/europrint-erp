/**
 * @module get-boms.query
 * @description Source module. See exports for details.
 */

export class GetBomsQuery {
  constructor(public readonly filters: {
      isActive?: boolean;
      productName?: string;
      page?: number;
      limit?: number;
    }) {}
}
