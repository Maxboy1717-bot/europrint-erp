/**
 * @module get-stock-inventory.query
 * @description Source module. See exports for details.
 */

export interface StockFilters {
  category?: string;
  location?: string;
  lowStock?: boolean;
  page?: number;
  limit?: number;
}

export class GetStockInventoryQuery {
  constructor(public readonly filters?: StockFilters) {}
}
