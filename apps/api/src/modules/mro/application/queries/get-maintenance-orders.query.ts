/**
 * @module get-maintenance-orders.query
 * @description Source module. See exports for details.
 */

export class GetMaintenanceOrdersQuery {
  constructor(readonly filters: {
      status?: string;
      priority?: string;
      assignedTo?: string;
      page?: number;
      limit?: number;
    }) {}
}
