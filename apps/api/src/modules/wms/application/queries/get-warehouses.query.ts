/**
 * @module get-warehouses.query
 * @description Source module. See exports for details.
 */

export interface WarehouseFilters {
  isActive?: boolean;
  isFreeStorage?: boolean;
}

export class GetWarehousesQuery {
  constructor(public readonly filters?: WarehouseFilters) {}
}
