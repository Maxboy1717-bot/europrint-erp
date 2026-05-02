import {
  pgTable, serial, text, integer, boolean, timestamp, numeric, jsonb, date,
} from 'drizzle-orm/pg-core';

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

export const mm_goods_issues_ext = pgTable('mm_goods_issues', {
  id:           serial('id').primaryKey(),
  issued_by:    integer('issued_by'),
  cost_center:  text('cost_center'),
  work_order_id: integer('work_order_id'),
  notes:        text('notes'),
  status:       text('status').default('pending'),
  created_at:   timestamp('created_at').defaultNow(),
  updated_at:   timestamp('updated_at').defaultNow(),
});

export const mm_goods_receipts_ext = pgTable('mm_goods_receipts', {
  id:               serial('id').primaryKey(),
  purchase_order_id: integer('purchase_order_id'),
  received_by:      integer('received_by'),
  notes:            text('notes'),
  delivery_note:    text('delivery_note'),
  status:           text('status').default('pending'),
  created_at:       timestamp('created_at').defaultNow(),
  updated_at:       timestamp('updated_at').defaultNow(),
});

export const mm_purchase_order_items = pgTable('mm_purchase_order_items', {
  id:                serial('id').primaryKey(),
  purchase_order_id: integer('purchase_order_id'),
  material_id:       integer('material_id'),
  unit_price:        numeric('unit_price', { precision: 15, scale: 2 }),
  quantity:          numeric('quantity', { precision: 15, scale: 4 }),
  created_at:        timestamp('created_at').defaultNow(),
});

export const mm_materials_ext = pgTable('mm_materials', {
  id:              serial('id').primaryKey(),
  name:            text('name'),
  unit_of_measure: text('unit_of_measure'),
  created_at:      timestamp('created_at').defaultNow(),
});

export const mm_vendors_ext = pgTable('mm_vendors', {
  id:   serial('id').primaryKey(),
  name: text('name'),
});

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

export const papka_orders_tech = pgTable('papka_orders', {
  id:             serial('id').primaryKey(),
  order_number:   text('order_number'),
  status:         text('status').default('pending_tech'),
  sales_order_id: integer('sales_order_id'),
  client_name:    text('client_name'),
  product_name:   text('product_name'),
  product_type:   text('product_type'),
  quantity:       integer('quantity'),
  format_width:   numeric('format_width', { precision: 10, scale: 2 }),
  format_height:  numeric('format_height', { precision: 10, scale: 2 }),
  deadline:       date('deadline'),
  created_at:     timestamp('created_at').defaultNow(),
  updated_at:     timestamp('updated_at').defaultNow(),
});

// ─── WMS Alerts ───────────────────────────────────────────────────────────────

export const wms_alerts = pgTable('wms_alerts', {
  id:           serial('id').primaryKey(),
  material_id:  integer('material_id'),
  warehouse_id: integer('warehouse_id'),
  type:         text('type'),
  severity:     text('severity'),
  message:      text('message'),
  is_resolved:  boolean('is_resolved').default(false),
  created_at:   timestamp('created_at').defaultNow(),
});

// ─── Gamification ─────────────────────────────────────────────────────────────

export const gamification_totals = pgTable('gamification_totals', {
  id:               serial('id').primaryKey(),
  employee_id:      integer('employee_id').unique(),
  total_points:     integer('total_points').default(0),
  monthly_points:   integer('monthly_points').default(0),
  quarterly_points: integer('quarterly_points').default(0),
  updated_at:       timestamp('updated_at').defaultNow(),
});

// ─── Absence Tracking ─────────────────────────────────────────────────────────

export const absence_tracking = pgTable('absence_tracking', {
  id:                    serial('id').primaryKey(),
  employee_id:           integer('employee_id'),
  absence_date:          date('absence_date'),
  consecutive_day_count: integer('consecutive_day_count').default(1),
  auto_blocked:          boolean('auto_blocked').default(false),
});

// ─── HR Brand Settings ────────────────────────────────────────────────────────

export const hr_brand_settings = pgTable('hr_brand_settings', {
  id:         serial('id').primaryKey(),
  company_id: text('company_id').unique(),
  brand_data: text('brand_data'),
  updated_at: timestamp('updated_at').defaultNow(),
});

// ─── Three Way Match Results ──────────────────────────────────────────────────

export const three_way_match_results = pgTable('three_way_match_results', {
  id:                serial('id').primaryKey(),
  po_id:             integer('po_id'),
  gr_id:             integer('gr_id'),
  invoice_id:        integer('invoice_id'),
  vendor_invoice_id: text('vendor_invoice_id'),
  po_amount:         numeric('po_amount', { precision: 15, scale: 2 }),
  gr_amount:         numeric('gr_amount', { precision: 15, scale: 2 }),
  invoice_amount:    numeric('invoice_amount', { precision: 15, scale: 2 }),
  status:            text('status'),
  tolerance_percent: numeric('tolerance_percent', { precision: 5, scale: 2 }),
  matched_at:        timestamp('matched_at'),
  performed_by:      integer('performed_by'),
  created_at:        timestamp('created_at').defaultNow(),
});

// ─── Purchase Orders (legacy table) ──────────────────────────────────────────

export const purchase_orders_legacy = pgTable('purchase_orders', {
  id:           serial('id').primaryKey(),
  po_number:    text('po_number'),
  vendor_name:  text('vendor_name'),
  total_amount: numeric('total_amount', { precision: 15, scale: 2 }),
  status:       text('status').default('draft'),
  created_by:   text('created_by'),
  created_at:   timestamp('created_at').defaultNow(),
});

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

export const mm_purchase_requisition_items = pgTable('mm_purchase_requisition_items', {
  id:            serial('id').primaryKey(),
  requisition_id: integer('requisition_id'),
  material_id:   integer('material_id'),
  quantity:      numeric('quantity', { precision: 15, scale: 3 }),
  unit_price:    numeric('unit_price', { precision: 15, scale: 2 }).default('0'),
  created_at:    timestamp('created_at').defaultNow(),
});

// ─── Asset Items extended (includes DB columns not yet in schema-business.ts) ─

export const asset_items_ext = pgTable('asset_items', {
  id:              serial('id').primaryKey(),
  name:            text('name'),
  category:        text('category'),
  assigned_to:     integer('assigned_to'),
  department_id:   integer('department_id'),
  serial_number:   text('serial_number'),
  purchase_date:   date('purchase_date'),
  purchase_value:  numeric('purchase_value', { precision: 15, scale: 2 }),
  notes:           text('notes'),
  status:          text('status').default('in_use'),
  location:        text('location'),
  is_active:       boolean('is_active').default(true),
  created_at:      timestamp('created_at').defaultNow(),
  updated_at:      timestamp('updated_at').defaultNow(),
});

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

export const pos_movements_legacy = pgTable('pos_movements', {
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
