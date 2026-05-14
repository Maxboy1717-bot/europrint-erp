/**
 * @module get-deliveries.query
 * @description Source module. See exports for details.
 */

export class GetDeliveriesQuery {
  constructor(readonly filters: {
      status?: string;
      driverId?: string;
      page?: number;
      limit?: number;
    }) {}
}
