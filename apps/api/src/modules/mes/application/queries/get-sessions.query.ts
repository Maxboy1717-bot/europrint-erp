/**
 * @module get-sessions.query
 * @description Source module. See exports for details.
 */

export class GetSessionsQuery {
  constructor(public readonly filters: {
      status?: string;
      operatorId?: string;
      productionOrderId?: string;
      from?: Date;
      to?: Date;
      page?: number;
      limit?: number;
    }) {}
}
