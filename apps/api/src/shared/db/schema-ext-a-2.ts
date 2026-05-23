/**
 * @module schema-ext-a-2
 * @description Source module. See exports for details.
 */

import {
  pgTable, serial, text, integer, boolean, timestamp, numeric, jsonb, date,
} from 'drizzle-orm/pg-core';
import { wms_alerts as canonicalWmsAlerts, mm_goods_issues as canonicalMmGoodsIssues, mm_goods_receipts as canonicalMmGoodsReceipts, mm_purchase_requisition_items as canonicalMmPurchaseRequisitionItems } from './schema-business-b-1';
import { three_way_match_results as canonicalThreeWayMatchResults } from './schema-business-b-2';
import { purchase_orders as canonicalPurchaseOrders } from './schema-wms';
import { absence_tracking as canonicalAbsenceTracking } from './schema-business-a-1';
import { asset_items as canonicalAssetItems, gamification_totals as canonicalGamificationTotals, papka_orders as canonicalPapkaOrders } from './schema-business-c-1';
import { hr_brand_settings as canonicalHrBrandSettings } from './schema-business-c-2-hr-safety';
import { mm_vendors as canonicalMmVendors } from './schema-misc-qc';
import { mm_materials_int as canonicalMmMaterials } from './schema-ext-c-3';

export const hr_documents_archive = pgTable('hr_documents_archive', {
  id:            integer('id').primaryKey(),
  employee_id:   integer('employee_id'),
  document_type: text('document_type'),
  title:         text('title'),
  content:       text('content'),
  pdf_url:       text('pdf_url'),
  status:        text('status'),
  initiated_by:  integer('initiated_by'),
  created_at:    timestamp('created_at'),
  updated_at:    timestamp('updated_at'),
  archived_at:   timestamp('archived_at').defaultNow(),
  archive_reason: text('archive_reason'),
});

// ─── MM: Goods Receipt & Issue Items ─────────────────────────────────────────

export const mm_goods_receipt_items = pgTable('mm_goods_receipt_items', {
  id:            serial('id').primaryKey(),
  receipt_id:    integer('receipt_id'),
  material_id:   integer('material_id'),
  ordered_qty:   numeric('ordered_qty', { precision: 15, scale: 4 }).default('0'),
  received_qty:  numeric('received_qty', { precision: 15, scale: 4 }).default('0'),
  batch_number:  text('batch_number'),
  created_at:    timestamp('created_at').defaultNow(),
});

export const mm_goods_issue_items = pgTable('mm_goods_issue_items', {
  id:          serial('id').primaryKey(),
  issue_id:    integer('issue_id'),
  material_id: integer('material_id'),
  quantity:    numeric('quantity', { precision: 15, scale: 4 }).default('0'),
  batch_number: text('batch_number'),
  created_at:  timestamp('created_at').defaultNow(),
});

// mm_goods_issues: re-exported from canonical definition in schema-business-b-1.ts
export const mm_goods_issues_ext = canonicalMmGoodsIssues;

// mm_goods_receipts: re-exported from canonical definition in schema-business-b-1.ts
export const mm_goods_receipts_ext = canonicalMmGoodsReceipts;

export const mm_purchase_order_items = pgTable('mm_purchase_order_items', {
  id:                serial('id').primaryKey(),
  purchase_order_id: integer('purchase_order_id'),
  material_id:       integer('material_id'),
  unit_price:        numeric('unit_price', { precision: 15, scale: 2 }),
  quantity:          numeric('quantity', { precision: 15, scale: 4 }),
  created_at:        timestamp('created_at').defaultNow(),
});

// mm_materials: canonical in schema-ext-c-3 (10 cols). Re-export under legacy name.
export const mm_materials_ext = canonicalMmMaterials;

// mm_vendors: re-exported from canonical definition in schema-misc-qc.ts
export const mm_vendors_ext = canonicalMmVendors;

// ─── Technology: Tech Cards & Clients ────────────────────────────────────────

export const tech_cards = pgTable('tech_cards', {
  id:              serial('id').primaryKey(),
  papka_order_id:  integer('papka_order_id'),
  material:        text('material'),
  ink_colors:      text('ink_colors'),
  print_type:      text('print_type'),
  finishing:       text('finishing'),
  created_at:      timestamp('created_at').defaultNow(),
});

export const clients = pgTable('clients', {
  id:         serial('id').primaryKey(),
  name:       text('name'),
  created_at: timestamp('created_at').defaultNow(),
});

// ─── Technology: Papka Orders (extended) ─────────────────────────────────────
// NOTE: papka_orders in schema-business.ts is messaging-focused.
// This is the technology/production-order view of the same table.

// papka_orders: re-exported from canonical definition in schema-business-c-1.ts
export const papka_orders_tech = canonicalPapkaOrders;

// ─── WMS Alerts ───────────────────────────────────────────────────────────────
// wms_alerts: re-exported from canonical definition in schema-business-b-1.ts
export const wms_alerts = canonicalWmsAlerts;

// ─── Gamification ─────────────────────────────────────────────────────────────
// gamification_totals: re-exported from canonical definition in schema-business-c-1.ts
export const gamification_totals = canonicalGamificationTotals;

// ─── Absence Tracking ─────────────────────────────────────────────────────────
// absence_tracking: re-exported from canonical definition in schema-business-a-1.ts
export const absence_tracking = canonicalAbsenceTracking;

// ─── HR Brand Settings ────────────────────────────────────────────────────────
// hr_brand_settings: re-exported from canonical definition in schema-business-c-2-hr-safety.ts
export const hr_brand_settings = canonicalHrBrandSettings;

// ─── Three Way Match Results ──────────────────────────────────────────────────
// three_way_match_results: re-exported from canonical definition in schema-business-b-2.ts
export const three_way_match_results = canonicalThreeWayMatchResults;

// ─── Purchase Orders (legacy table) ──────────────────────────────────────────
// purchase_orders_legacy: re-exported from canonical purchase_orders in schema-wms.ts
export const purchase_orders_legacy = canonicalPurchaseOrders;

// ─── Materials (legacy table) ─────────────────────────────────────────────────

export const materials_legacy = pgTable('materials', {
  id:               serial('id').primaryKey(),
  material_code:    text('material_code').unique(),
  name:             text('name'),
  category:         text('category'),
  unit_of_measure:  text('unit_of_measure'),
  unit_cost:        numeric('unit_cost', { precision: 15, scale: 2 }),
  created_at:       timestamp('created_at').defaultNow(),
});

// ─── MM Purchase Requisition Items ────────────────────────────────────────────
// mm_purchase_requisition_items: re-exported from canonical definition in schema-business-b-1.ts
export const mm_purchase_requisition_items = canonicalMmPurchaseRequisitionItems;

// ─── Asset Items extended (includes DB columns not yet in schema-business.ts) ─
// asset_items: re-exported from canonical definition in schema-business-c-1.ts
export const asset_items_ext = canonicalAssetItems;

// ─── Employee Assets (bridge) ─────────────────────────────────────────────────

export const employee_assets = pgTable('employee_assets', {
  id:                  serial('id').primaryKey(),
  asset_id:            text('asset_id'),
  employee_id:         text('employee_id'),
  assigned_date:       date('assigned_date'),
  return_date:         date('return_date'),
  condition_on_assign: text('condition_on_assign'),
  condition_on_return: text('condition_on_return'),
  notes:               text('notes'),
  created_at:          timestamp('created_at').defaultNow(),
});


// ─── POS: Movements (legacy integer-based schema for data-retention) ──────────

export const pos_movements_legacy = pgTable('pos_movements_legacy', {
  id:                      integer('id').primaryKey(),
  movement_number:         text('movement_number'),
  movement_type_id:        integer('movement_type_id'),
  status:                  text('status'),
  from_warehouse_id:       integer('from_warehouse_id'),
  to_warehouse_id:         integer('to_warehouse_id'),
  received_by_employee_id: integer('received_by_employee_id'),
  created_by:              text('created_by'),
  supplier_name:           text('supplier_name'),
  document_number:         text('document_number'),
  document_date:           date('document_date'),
  notes:                   text('notes'),
  created_at:              timestamp('created_at'),
  updated_at:              timestamp('updated_at'),
});

// ─── HR Documents (legacy integer-based schema for data-retention) ────────────

export const hr_documents_legacy = pgTable('hr_documents', {
  id:            integer('id').primaryKey(),
  employee_id:   integer('employee_id'),
  document_type: text('document_type'),
  title:         text('title'),
  content:       text('content'),
  pdf_url:       text('pdf_url'),
  status:        text('status'),
  initiated_by:  integer('initiated_by'),
  created_at:    timestamp('created_at'),
  updated_at:    timestamp('updated_at'),
});

// ─── PP: Production tables (integer ID stubs) ─────────────────────────────────
