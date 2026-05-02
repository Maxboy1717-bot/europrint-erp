export interface WarehouseFilters {
  isActive?: boolean;
  isFreeStorage?: boolean;
}

export class GetWarehousesQuery {
  constructor(public readonly filters?: WarehouseFilters) {}
}
