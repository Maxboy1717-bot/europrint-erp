/**
 * @module get-design-orders.query
 * @description Source module. See exports for details.
 */

export class GetDesignOrdersQuery {
  constructor(public readonly filters: {
      status?: string;
      assignedTo?: string;
      page?: number;
      limit?: number;
    }) {}
}
