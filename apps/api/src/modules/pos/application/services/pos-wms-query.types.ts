/**
 * @module pos-wms-query.types
 * @description Public return-type interfaces and internal raw row shapes for
 *   `PosWmsQueryService`. Extracted into a sibling file so the service stays
 *   under 300 lines (Rule 16).
 *
 *   All public interfaces are re-exported from `pos-wms-query.service.ts` to
 *   preserve existing import paths.
 */

// ---------------------------------------------------------------------------
// Public return types
// ---------------------------------------------------------------------------
export interface WmsWarehouse {
  id:             string;
  code:           string | null;
  name:           string | null;
  type:           string | null;
  isActive:       boolean;
  totalMaterials: number;
  totalQty:       number;
  departmentCode: string | null;
}

export interface WmsStockView {
  materialCardId: string | number;
  materialCode:   string | null;
  materialName:   string | null;
  unit:           string | null;
  availableQty:   number;
  reservedQty:    number;
  totalQty:       number;
  lastUpdated:    Date | string | null;
}

export interface WmsMovementHistory {
  id:             string | number;
  movementNumber: string | null;
  movementType:   string | null;
  status:         string | null;
  createdAt:      Date | string | null;
  completedAt:    Date | string | null;
  createdByName:  string | null;
}

export interface LowStockItem {
  materialCardId: string | number;
  materialCode:   string | null;
  materialName:   string | null;
  unit:           string | null;
  availableQty:   number;
  minStock:       number;
  warehouseId:    string | null;
}

// ---------------------------------------------------------------------------
// Internal raw row shapes
// ---------------------------------------------------------------------------
export interface WarehouseRow {
  id:              string | number;
  code:            string | null;
  name:            string | null;
  type:            string | null;
  is_active:       boolean | null;
  department_code: string | null;
  total_materials: string | number | null;
  total_qty:       string | number | null;
}

export interface MaterialSearchRow {
  id:                  string | number;
  code:                string | null;
  name:                string | null;
  category:            string | null;
  unit:                string | null;
  material_type:       string | null;
  available_qty:       string | number | null;
  warehouse_id:        string | null;
  last_purchase_price: string | null;
}

export interface StockRow {
  material_card_id: string | number;
  material_code:    string | null;
  material_name:    string | null;
  unit:             string | null;
  available_qty:    string | number | null;
  reserved_qty:     string | number | null;
  total_qty:        string | number | null;
  last_updated:     string | null;
}

export interface MovementRow {
  id:               string | number;
  movement_number:  string | null;
  movement_type:    string | null;
  status:           string | null;
  created_at:       string | null;
  completed_at:     string | null;
  created_by_name:  string | null;
}

export interface LowStockRow {
  material_card_id: string | number;
  material_code:    string | null;
  material_name:    string | null;
  unit:             string | null;
  available_qty:    string | number | null;
  min_stock:        string | number | null;
  warehouse_id:     string | null;
}

export const DEFAULT_MOVEMENT_LIMIT = 100;
