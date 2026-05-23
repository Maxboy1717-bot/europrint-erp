/**
 * @module types/production
 * @description Canonical shared interfaces for Production domain types.
 *
 * All fields are merged from 9 duplicate PapkaOrder definitions found across:
 * MESDashboard, OrderApprovalWorkflow, planning-types, PPDashboard,
 * QCFinalInspection, QCModule, SDExtended, TechCards, WarehouseMaterialKits.
 *
 * IMPORTANT: Do NOT redefine PapkaOrder in individual page/component files.
 * Import from here instead:
 *   import type { PapkaOrder } from '@/types/production';
 *
 * NOTE: If a consumer needs a very narrow local shape (e.g. only id + papkaNo),
 * use Pick<PapkaOrder, 'id' | 'papkaNo'> rather than a new interface.
 */

// ---------------------------------------------------------------------------
// PapkaOrder
// ---------------------------------------------------------------------------

/**
 * Canonical PapkaOrder interface.
 *
 * Required: id, status
 * All other fields are optional — presence depends on the API endpoint.
 *
 * id is string | number because:
 *   - Most modules (OrderApproval, QC, TechCards, planning) use string (UUID)
 *   - MES, SD, WarehouseMaterialKits use number (auto-increment)
 *   - shared-schema.ts stub uses Record<string,any>
 */
export interface PapkaOrder {
  id: string | number;
  status: string;

  // Primary identifiers
  papkaNo?: string;
  orderNumber?: string;

  // Client / product info (Uzbek API field names)
  mijozNomi?: string;     // client name (Uzbek)
  mahsulotNomi?: string;  // product name (Uzbek)
  clientName?: string;    // client name (English variant)
  name?: string;          // generic name field

  // Russian/legacy field names (WarehouseMaterialKits)
  zakaz?: string;         // order number (Russian)
  naimenovanie?: string;  // product name (Russian)

  // Dimensions & quantity
  tiraj?: number;         // print run / circulation
  formatA?: number;
  formatB?: number;

  // Financials
  amount?: number;
  totalPrice?: number;
  advancePercent?: number;

  // Dates
  deadline?: string;
  tayyorBolishSanasi?: string;  // ready date (Uzbek)
  sana?: string;                // date (Uzbek)
  dueDate?: string;
  createdAt?: string;

  // Production type
  productType?: string;
  mahsulotTuri?: string;        // product type (Uzbek API, PapkaOrders form)

  // Sheet count (PapkaOrders form field)
  listSoni?: number;

  // Notes / comments
  notes?: string;

  // Priority (WarehouseMaterialKits)
  prioritet?: number;

  // Nested data (SDExtended broad shape)
  items?: PapkaOrder[];
  data?: PapkaOrder[];
  orders?: PapkaOrder[];
}

// ---------------------------------------------------------------------------
// WorkCenter
// ---------------------------------------------------------------------------

/**
 * Canonical WorkCenter interface.
 *
 * Merges 4 duplicate definitions found across:
 * cameras-management-types.ts, CapacityPlanningTypes.ts,
 * planning/planning-types.ts, RoutingConfigurationTypes.ts
 *
 * IMPORTANT: Do NOT redefine WorkCenter in individual page/component files.
 * Import from here instead:
 *   import type { WorkCenter } from '@/types/production';
 *
 * NOTE: planning-types.ts omits code — that is a subset; use Pick<WorkCenter, 'id' | 'name'>
 * if you truly don't need code, rather than redefining the interface.
 *
 * NOTE: erp/ERPWorkCentersTab and related ERP pages import WorkCenter from
 * '@shared/schema'. Those are DB-backed ORM shapes and remain unchanged here.
 */
export interface WorkCenter {
  id: string;
  name: string;
  code?: string;
}
