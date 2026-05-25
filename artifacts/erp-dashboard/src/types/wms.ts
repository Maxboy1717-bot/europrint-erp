/**
 * @module types/wms
 * @description Canonical shared interfaces for the WMS (Warehouse Management System)
 * and POS-Monitor movement domain.
 *
 * IMPORTANT: Do NOT redefine Movement or GoodsReceipt in individual page/component files.
 * Import from here instead:
 *   import type { Movement } from '@/types/wms';
 *   import type { GoodsReceipt } from '@/types/wms';
 */

// ---------------------------------------------------------------------------
// Movement
// ---------------------------------------------------------------------------

/**
 * Canonical Movement interface (POS-Monitor warehouse movements).
 *
 * Merges 8 duplicate definitions found across:
 * pos-monitor/hooks/useMovements.ts, pos-monitor/components/MovementCard.tsx,
 * pos-monitor/pages/PosWarehouseDetail.types.ts, PosMovements.types.ts,
 * PosQCReview.tsx, PosMovementDetail.tsx, PosMaterialDetail.tsx, PosDashboard.tsx
 *
 * Required: id, movementType, status, createdAt
 * All other fields are optional — presence depends on the API endpoint.
 *
 * NOTE: PosWarehouseDetail uses fromWarehouseId/toWarehouseId as number | null.
 *       PosMovements / PosMovementDetail use them as string.
 *       The canonical type is string | number | null to cover all consumers.
 *
 * NOTE: MovementCard adds a lines[] summary array for display purposes.
 * NOTE: PosMovementDetail adds supplierDoc, notes, and a typed lines array.
 */
export interface Movement {
  id: number;
  movementType: string;
  status: string;
  createdAt: string;

  // Document reference
  movementNumber?: string;

  // Financials
  totalAmount?: number;

  // Warehouse references (IDs)
  fromWarehouseId?: string | number | null;
  toWarehouseId?: string | number | null;

  // Warehouse references (names, resolved by backend join)
  fromWarehouseName?: string;
  toWarehouseName?: string;

  // Supply-chain references
  supplierName?: string;
  supplierDoc?: string;

  // Additional metadata
  createdBy?: number;
  notes?: string;

  // Line items (summary for card display or full detail)
  lines?: Array<{
    materialNameUz?: string;
    qty?: number;
    unit?: string;
    [key: string]: unknown;
  }>;
}

// ---------------------------------------------------------------------------
// GoodsReceipt
// ---------------------------------------------------------------------------

/**
 * Canonical GoodsReceipt interface.
 *
 * Merges 3 duplicate definitions found across:
 * components/wms/receiving/types.ts (richest — canonical source),
 * pages/MMExtendedTypes.ts, pages/SupplyChainDashboardTypes.ts
 *
 * IMPORTANT: The wms/receiving/types.ts shape is the most complete and is the
 * canonical source. The MMExtended and SupplyChainDashboard shapes are subsets
 * that use slightly different field names:
 *   - MMExtended: vendorName (vs supplierName), poNumber (vs purchaseOrderId),
 *                 totalAmount (vs totalValue), vendorId (vs supplierId)
 *   - SupplyChainDashboard: grNumber (vs receiptNumber), poId (vs purchaseOrderId),
 *                           vendorName (vs supplierName), receivedBy
 *
 * The canonical interface uses the wms/receiving naming as primary, with optional
 * aliases to accommodate the other consumers.
 */
export interface GoodsReceipt {
  id: string | number;
  status: string;
  receiptDate: string;

  // Receipt identification
  receiptNumber?: string;
  grNumber?: string;          // alias used by SupplyChainDashboard

  // Purchase order reference
  purchaseOrderId?: string;
  poNumber?: string;          // alias used by MMExtended
  poId?: string;              // alias used by SupplyChainDashboard

  // Supplier / vendor
  supplierId?: string | number;
  supplierName?: string;
  vendorId?: string | number;  // alias used by MMExtended
  vendorName?: string;         // alias used by MMExtended + SupplyChainDashboard

  // Warehouse
  warehouseId?: string;
  warehouseName?: string;

  // Quantities & value
  totalItems?: number;
  totalValue?: number;
  totalAmount?: number | string; // alias used by MMExtended

  // QC
  qcRequiredItems?: number;
  qcPassedItems?: number;

  // Dates
  receivedAt?: string;
  createdAt?: string;

  // Personnel
  receivedBy?: string;         // used by SupplyChainDashboard

  // Documents
  invoiceNumber?: string;
  invoiceDate?: string;

  // Misc
  notes?: string;

  // Line items
  lines?: unknown[];
}
