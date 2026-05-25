/**
 * @module types/crm
 * @description Canonical shared CRM interfaces (Deal, Contact, Invoice for cross-module use).
 *
 * These are the FULL shapes from crm-types.ts / crm-types-data.ts.
 * For CRM-internal usage continue importing from @/pages/crm/crm-types
 * which re-exports these plus CRM-specific utilities (hooks, constants).
 *
 * For SD / non-CRM modules that only need a reference shape, import here:
 *   import type { Deal, Contact, Invoice } from '@/types/crm';
 *
 * NOTE: Do NOT redefine Deal or Contact in AiCrmPageTypes, CRMActivitiesTypes,
 * or SDDashboardTypes. Use Pick<Deal, ...> if only a subset is needed.
 */

// ---------------------------------------------------------------------------
// Deal
// ---------------------------------------------------------------------------

/**
 * Canonical CRM Deal interface.
 *
 * Merged from crm-types.ts and crm-types-data.ts (identical shapes).
 * Also supersedes the minimal variants in:
 *   - AiCrmPageTypes.ts  (amount/stage/assignedTo — partial)
 *   - CRMActivitiesTypes.ts  (id/title only)
 *   - SDDashboardTypes.ts  (id/title/opportunity/currencyId)
 *   - company/types.ts  (id/title/opportunity/stageId)
 *   - KanbanColumn.tsx + DealCard.tsx  (id/title/stageId/opportunity/currencyId/contactId)
 *
 * Required: id, title
 */
export interface Deal {
  id: number;
  title: string;

  // Stage / pipeline
  stageId: string;

  // Financials
  opportunity: number;
  currencyId: string;

  // Relations
  contactIds: number[];
  /** Singular alias — used by DealCard.tsx for display. Equivalent to contactIds[0]. */
  contactId?: number | null;
  companyId: number | null;
  assignedById: string | null;

  // Dates
  dateCreate: string;
  dateModify: string;

  // Optional analytics / AI fields
  probability?: number;
  amount?: number;        // alias for opportunity in some AI contexts
  stage?: string;         // stage name (alias for stageId in some contexts)
  assignedTo?: string;    // alias for assignedById in some AI contexts
  lastActivity?: string;  // AI context field
}

// ---------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------

/**
 * Canonical CRM Contact interface.
 *
 * Most complete shape from contact/types.ts.
 * Supersedes minimal variants in CRMActivitiesTypes.ts (id/name only)
 * and AiCrmPageTypes.ts (id/name/email/company/lastActivity).
 *
 * NOTE: company/types.ts Contact adds linkRole/linkIsPrimary/linkId
 * for the company-context deal link — those are kept local to that file.
 *
 * Required: id
 */
export interface Contact {
  id: number;

  // Name parts
  name: string | null;
  secondName: string | null;
  lastName: string | null;

  // Professional
  post: string | null;
  companyId: number | null;
  companyTitle?: string;

  // Contact channels
  phones: { value: string; type: string }[];
  emails: { value: string; type: string }[];

  // Extended (from contact/types.ts)
  birthdate?: string | null;
  comments?: string | null;
  dateModify?: string;
  assignedByName?: string;

  // From crm-types.ts full shape
  assignedById?: string | null;
  dateCreate?: string;

  // AI/summary context
  email?: string;
  company?: string;
  lastActivity?: string;
}

// ---------------------------------------------------------------------------
// Invoice
// ---------------------------------------------------------------------------

/**
 * Canonical CRM Invoice interface.
 *
 * Merged from crm-types.ts (CRM context) and SDSalesManagementTypes.ts (SD context).
 * SDDashboardTypes.ts uses id/title/opportunity which is a deal-like stub —
 * that remains local.
 *
 * Required: id
 */
export interface Invoice {
  id: number | string;

  // Identification
  number?: string;
  invoiceNumber?: string;
  title?: string;

  // Relations (CRM context)
  dealId?: number | null;
  contactId?: number | null;
  companyId?: number | null;

  // Relations (SD context)
  customerId?: string;
  customerName?: string;
  orderId?: string;

  // Status / stage
  status?: string;
  stageId?: string | null;

  // Financials
  totalAmount?: number | string;
  paidAmount?: number | string;
  currency?: string;
  opportunity?: number;  // SDDashboardTypes alias

  // Dates
  dueDate?: string | null;
  issueDate?: string;
  assignedById?: string | null;
  createdAt?: string;
  dateCreate?: string;
}

// ---------------------------------------------------------------------------
// Warehouse (WMS canonical)
// ---------------------------------------------------------------------------

/**
 * Canonical Warehouse interface — for WMS modules (string UUID ids).
 *
 * Merged from barcode-types.ts, wms/valuation/types.ts, wms/receiving/types.ts.
 *
 * NOTE: PosWarehousePageTypes.ts and WarehouseKirimWizardTypes.ts use number ids
 * (auto-increment POS tables) — those files keep their own local Warehouse interface.
 *
 * PosWarehouses.tsx local variant adds totalMaterials/totalQty/departmentCode
 * which are POS-specific — kept local to that file.
 *
 * Required: id, name
 */
export interface Warehouse {
  id: string;
  name: string;
  code?: string;
  nameRu?: string | null;
  type?: string;
  isActive?: boolean;
  warehouseType?: string;  // PosAdminSections variant
}
