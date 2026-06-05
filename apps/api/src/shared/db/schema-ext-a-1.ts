/**
 * @module schema-ext-a-1
 * @description Source module. See exports for details.
 */

import {
  pgTable, serial, text, integer, boolean, timestamp, numeric, jsonb, date, unique,
} from 'drizzle-orm/pg-core';
import { kanbanCards as canonicalKanbanCards, kanbanColumns as canonicalKanbanColumns } from './schema-kanban';
// Canonical imports from lib/db (@workspace/db barrel)
import {
  posDamageQcLinks as canonicalPosDamageQcLinks,
  posBarcodePrintQueue as canonicalPosBarcodePrintQueue,
  employeeIssuanceLog as canonicalEmployeeIssuanceLog,
  posInventoryCountLines as canonicalPosInventoryCountLines,
  inventoryBarcodeAssignments as canonicalInventoryBarcodeAssignments,
  idealRasmTargets as canonicalIdealRasmTargets,
  glLines as canonicalGlLines,
  sdCustomerContacts as canonicalSdCustomerContacts,
  sdCustomerDocuments as canonicalSdCustomerDocuments,
  sdCustomerCompetitors as canonicalSdCustomerCompetitors,
  hrInterviewQuestions as canonicalHrInterviewQuestions,
  // sd-order-items → sd-core → sd-schema → barrel (export *)
  orderStatusLogs as canonicalOrderStatusLogs,
} from '@workspace/db';

// ─── WMS: Stocks ──────────────────────────────────────────────────────────────
// TODO: stocks not found in lib/db — kept as local stub
export const stocks = pgTable('stocks', {
  id:                serial('id').primaryKey(),
  warehouse_id:      integer('warehouse_id'),
  material_id:       integer('material_id'),
  quantity:          numeric('quantity', { precision: 15, scale: 4 }).default('0'),
  reserved_quantity: numeric('reserved_quantity', { precision: 15, scale: 4 }).default('0'),
  expiry_date:       date('expiry_date'),
  batch_number:      text('batch_number'),
  received_at:       timestamp('received_at'),
  created_at:        timestamp('created_at').defaultNow(),
});

// ─── POS: Current Stock ───────────────────────────────────────────────────────
// NOTE: current_stock is a VIEW over warehouse_stock (quantity AS quantity_on_hand,
// last_updated_at AS last_movement_at, material_id passthrough). Modeled here as a
// local Drizzle table-stub for write access; the view is auto-updatable so inserts/
// updates pass through to warehouse_stock, which holds the UNIQUE(warehouse_id,
// material_id) index that the upsert ON CONFLICT resolves against. Column must be
// material_id to match the view/base table.
export const current_stock = pgTable('current_stock', {
  id:               serial('id').primaryKey(),
  material_id:      integer('material_id').notNull(),
  warehouse_id:     integer('warehouse_id'),
  quantity_on_hand: numeric('quantity_on_hand', { precision: 15, scale: 4 }).default('0'),
  last_movement_at: timestamp('last_movement_at'),
});

// ─── POS: Ideal Rasm Targets ──────────────────────────────────────────────────
// ideal_rasm_targets: re-exported from canonical definition in @workspace/db (ideal-rasm-schema.ts)
export const ideal_rasm_targets = canonicalIdealRasmTargets;

// ─── Sales: Order Status Logs ─────────────────────────────────────────────────
// order_status_logs: re-exported from canonical definition in @workspace/db
// (sd-order-items.ts → sd-core.ts → sd-schema.ts → barrel export *)
export const order_status_logs = canonicalOrderStatusLogs;

// ─── POS: Damage QC Links ─────────────────────────────────────────────────────
// pos_damage_qc_links: re-exported from canonical definition in @workspace/db (pos-schema-v2.ts)
export const pos_damage_qc_links = canonicalPosDamageQcLinks;

// ─── POS: Barcode Print Queue ─────────────────────────────────────────────────
// pos_barcode_print_queue: re-exported from canonical definition in @workspace/db (pos-schema-v2.ts)
export const pos_barcode_print_queue = canonicalPosBarcodePrintQueue;

// ─── HR: Employee Issuance Log ────────────────────────────────────────────────
// employee_issuance_log: re-exported from canonical definition in @workspace/db (pos-schema-v2.ts)
export const employee_issuance_log = canonicalEmployeeIssuanceLog;

// ─── POS: Inventory Count Lines ───────────────────────────────────────────────
// pos_inventory_count_lines: re-exported from canonical definition in @workspace/db (pos-schema-v2.ts)
export const pos_inventory_count_lines = canonicalPosInventoryCountLines;

// ─── POS: Inventory Barcode Assignments ──────────────────────────────────────
// inventory_barcode_assignments: re-exported from canonical definition in @workspace/db (pos-schema.ts)
export const inventory_barcode_assignments = canonicalInventoryBarcodeAssignments;

// ─── LMS: Lessons & Certificates ─────────────────────────────────────────────
// lessons: re-exported from canonical definition in @workspace/db (lms-schema.ts)
export { lessons } from '@workspace/db';

// TODO: certificates not found in lib/db — kept as local stub
export const certificates_table = pgTable('certificates', {
  id:         serial('id').primaryKey(),
  is_active:  boolean('is_active').default(true),
  updated_at: timestamp('updated_at').defaultNow(),
});

// TODO: courses not found in lib/db — kept as local stub
export const courses_table = pgTable('courses', {
  id:         serial('id').primaryKey(),
  is_active:  boolean('is_active').default(true),
  updated_at: timestamp('updated_at').defaultNow(),
});

// ─── HR: Interview Questions & Applications ───────────────────────────────────
// hr_interview_questions: re-exported from canonical definition in @workspace/db (hr-v2-schema.ts)
export const hr_interview_questions = canonicalHrInterviewQuestions;

// TODO: hr_applications not found in lib/db — kept as local stub
export const hr_applications = pgTable('hr_applications', {
  id:         serial('id').primaryKey(),
  status:     text('status').default('new'),
  created_at: timestamp('created_at').defaultNow(),
});

// ─── Finance: GL Lines ────────────────────────────────────────────────────────
// gl_lines: re-exported from canonical definition in @workspace/db (fi-gl.ts → fi-schema.ts)
export const gl_lines = canonicalGlLines;

// ─── SD: Customer Sub-tables ──────────────────────────────────────────────────
// sd_customer_contacts: re-exported from canonical definition in @workspace/db (sd-customer-relations.ts)
export const sd_customer_contacts = canonicalSdCustomerContacts;

// sd_customer_documents: re-exported from canonical definition in @workspace/db (sd-customer-relations.ts)
export const sd_customer_documents = canonicalSdCustomerDocuments;

// sd_customer_competitors: re-exported from canonical definition in @workspace/db (sd-customer-relations.ts)
export const sd_customer_competitors = canonicalSdCustomerCompetitors;

// sd_sales_orders = auto-updatable VIEW over sales_orders (pure passthrough, 56 of 72 cols) — NOT a real
// table. Declared as a pgTable stub (not pgView) ON PURPOSE: execSdSalesOrderInsert (queries-sd.ts) uses
// Drizzle .insert(sd_sales_orders), and Drizzle pgView is read-only (no .insert()), so pgView would break
// the SD order-create path. DROP / repoint to sales_orders is deferred (see deferred-decisions.md —
// order-architecture interview; it is the critical SD order CRUD over 12 real, money-bearing orders).
// Audit: already accounted for in the schema-dup ratchet known-165 allowlist (not a new/growing dup).
export const sd_sales_orders = pgTable('sd_sales_orders', {
  id:             serial('id').primaryKey(),
  order_number:   text('order_number'),
  status:         text('status').default('pending'),
  company_id:     integer('company_id'),
  total_amount:   numeric('total_amount', { precision: 15, scale: 2 }),
  advance_required: integer('advance_required').default(70),
  advance_paid:   numeric('advance_paid', { precision: 15, scale: 2 }).default('0'),
  advance_status: text('advance_status').default('pending'),
  design_flag:    boolean('design_flag').default(false),
  sample_flag:    boolean('sample_flag').default(false),
  is_vip:         boolean('is_vip').default(false),
  created_by:     integer('created_by'),
  created_at:     timestamp('created_at').defaultNow(),
  updated_at:     timestamp('updated_at').defaultNow(),
  version:        integer('version').default(0).notNull(),
});

// TODO: sd_advance_idempotency_keys not found in lib/db — kept as local stub
export const sd_advance_idempotency_keys = pgTable('sd_advance_idempotency_keys', {
  id:               serial('id').primaryKey(),
  order_id:         integer('order_id').notNull(),
  idempotency_key:  text('idempotency_key').notNull(),
  advance_paid:     numeric('advance_paid', { precision: 15, scale: 2 }).notNull(),
  created_at:       timestamp('created_at').defaultNow(),
}, (t) => ({
  uniq: unique('uq_sd_advance_idempotency').on(t.order_id, t.idempotency_key),
}));

// ─── Kanban: Columns & Cards ──────────────────────────────────────────────────
// kanban_columns: re-exported from canonical definition in schema-kanban.ts
export const kanban_columns = canonicalKanbanColumns;

// kanban_cards: re-exported from canonical definition in schema-kanban.ts
export const kanban_cards = canonicalKanbanCards;

// ─── Questionnaire: Templates ─────────────────────────────────────────────────
// [2026-05-22 dedup] questionnaire_templates: re-exported from canonical definition
// in @workspace/db schema/hr-architecture-additions.ts (export `questionnaireTemplates`).
// Previous local pgTable removed (column coverage with canon ~38%).
export { questionnaireTemplates as questionnaire_templates } from '@workspace/db/schema/hr-architecture-additions';

// ─── HR: Bot Tables ───────────────────────────────────────────────────────────
// TODO: recruitment_bot_attempts not found in lib/db — kept as local stub
export const recruitment_bot_attempts = pgTable('recruitment_bot_attempts', {
  id:               serial('id').primaryKey(),
  telegram_chat_id: text('telegram_chat_id'),
  vacancy_id:       integer('vacancy_id'),
  attempts:         integer('attempts').default(0),
  last_attempt_at:  timestamp('last_attempt_at').defaultNow(),
});

// TODO: bot_candidates not found in lib/db — kept as local stub
export const bot_candidates = pgTable('bot_candidates', {
  id:                serial('id').primaryKey(),
  full_name:         text('full_name'),
  telegram_chat_id:  text('telegram_chat_id'),
  vacancy_id:        integer('vacancy_id'),
  cv_file_id:        text('cv_file_id'),
  cv_file_name:      text('cv_file_name'),
  screening_answers: jsonb('screening_answers'),
  lang:              text('lang').default('uz'),
  status:            text('status').default('new'),
  applied_at:        timestamp('applied_at').defaultNow(),
});

// TODO: hr_sick_reports not found in lib/db — kept as local stub
export const hr_sick_reports = pgTable('hr_sick_reports', {
  id:               serial('id').primaryKey(),
  employee_id:      integer('employee_id'),
  days:             integer('days'),
  reason:           text('reason'),
  document_file_id: text('document_file_id'),
  status:           text('status').default('pending'),
  reported_at:      timestamp('reported_at').defaultNow(),
});

// ─── Data Retention: Archive Tables ──────────────────────────────────────────
// TODO: pos_movements_archive not found in lib/db — kept as local stub
export const pos_movements_archive = pgTable('pos_movements_archive', {
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
  archived_at:             timestamp('archived_at').defaultNow(),
  archive_reason:          text('archive_reason'),
});
