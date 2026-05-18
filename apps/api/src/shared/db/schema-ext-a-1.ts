/**
 * @module schema-ext-a-1
 * @description Source module. See exports for details.
 */

import {
  pgTable, serial, text, integer, boolean, timestamp, numeric, jsonb, date, unique,
} from 'drizzle-orm/pg-core';
import { kanbanCards as canonicalKanbanCards, kanbanColumns as canonicalKanbanColumns } from './schema-kanban';

// ─── WMS: Stocks ──────────────────────────────────────────────────────────────

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

export const current_stock = pgTable('current_stock', {
  id:               serial('id').primaryKey(),
  material_card_id: integer('material_card_id').notNull(),
  warehouse_id:     integer('warehouse_id'),
  quantity_on_hand: numeric('quantity_on_hand', { precision: 15, scale: 4 }).default('0'),
  last_movement_at: timestamp('last_movement_at'),
});

// ─── POS: Ideal Rasm Targets ──────────────────────────────────────────────────

export const ideal_rasm_targets = pgTable('ideal_rasm_targets', {
  id:            serial('id').primaryKey(),
  target_name:   text('target_name'),
  target_key:    text('target_key').unique(),
  target_value:  numeric('target_value', { precision: 15, scale: 4 }),
  unit:          text('unit'),
  horizon_years: integer('horizon_years'),
  description:   text('description'),
  created_at:    timestamp('created_at').defaultNow(),
  updated_at:    timestamp('updated_at').defaultNow(),
});

// ─── Sales: Order Status Logs ─────────────────────────────────────────────────

export const order_status_logs = pgTable('order_status_logs', {
  id:          serial('id').primaryKey(),
  order_id:    integer('order_id'),
  from_status: text('from_status'),
  to_status:   text('to_status'),
  changed_by:  integer('changed_by'),
  notes:       text('notes'),
  created_at:  timestamp('created_at').defaultNow(),
});

// ─── POS: Damage QC Links ─────────────────────────────────────────────────────

export const pos_damage_qc_links = pgTable('pos_damage_qc_links', {
  id:                   serial('id').primaryKey(),
  damage_movement_id:   integer('damage_movement_id'),
  original_movement_id: integer('original_movement_id'),
  material_card_id:     integer('material_card_id'),
  damaged_qty:          numeric('damaged_qty', { precision: 15, scale: 4 }),
  damage_description:   text('damage_description'),
  qc_status:            text('qc_status').default('PENDING'),
  created_at:           timestamp('created_at').defaultNow(),
});

// ─── POS: Barcode Print Queue ─────────────────────────────────────────────────

export const pos_barcode_print_queue = pgTable('pos_barcode_print_queue', {
  id:              serial('id').primaryKey(),
  material_card_id: integer('material_card_id'),
  pos_movement_id: integer('pos_movement_id'),
  copies:          integer('copies').default(1),
  print_format:    text('print_format'),
  printer_ip:      text('printer_ip'),
  trigger_type:    text('trigger_type').default('AUTO'),
  status:          text('status').default('PENDING'),
  created_at:      timestamp('created_at').defaultNow(),
});

// ─── HR: Employee Issuance Log ────────────────────────────────────────────────

export const employee_issuance_log = pgTable('employee_issuance_log', {
  id:              serial('id').primaryKey(),
  user_id:         integer('user_id'),
  material_card_id: integer('material_card_id'),
  issued_at:       timestamp('issued_at').defaultNow(),
});

// ─── POS: Inventory Count Lines ───────────────────────────────────────────────

export const pos_inventory_count_lines = pgTable('pos_inventory_count_lines', {
  id:         serial('id').primaryKey(),
  gl_posted:  boolean('gl_posted').default(false),
  updated_at: timestamp('updated_at').defaultNow(),
});

// ─── POS: Inventory Barcode Assignments ──────────────────────────────────────

export const inventory_barcode_assignments = pgTable('inventory_barcode_assignments', {
  id:               serial('id').primaryKey(),
  material_card_id: integer('material_card_id'),
  is_primary:       boolean('is_primary').default(false),
  created_at:       timestamp('created_at').defaultNow(),
});

// ─── LMS: Lessons & Certificates ─────────────────────────────────────────────

export const lessons = pgTable('lessons', {
  id:         serial('id').primaryKey(),
  title:      text('title'),
  is_active:  boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
});

export const certificates_table = pgTable('certificates', {
  id:         serial('id').primaryKey(),
  is_active:  boolean('is_active').default(true),
  updated_at: timestamp('updated_at').defaultNow(),
});

export const courses_table = pgTable('courses', {
  id:         serial('id').primaryKey(),
  is_active:  boolean('is_active').default(true),
  updated_at: timestamp('updated_at').defaultNow(),
});

// ─── HR: Interview Questions & Applications ───────────────────────────────────

export const hr_interview_questions = pgTable('hr_interview_questions', {
  id:        serial('id').primaryKey(),
  is_active: boolean('is_active').default(true),
});

export const hr_applications = pgTable('hr_applications', {
  id:         serial('id').primaryKey(),
  status:     text('status').default('new'),
  created_at: timestamp('created_at').defaultNow(),
});

// ─── Finance: GL Lines ────────────────────────────────────────────────────────

export const gl_lines = pgTable('gl_lines', {
  id:              serial('id').primaryKey(),
  gl_document_id:  integer('gl_document_id'),
  line_number:     integer('line_number'),
  account_id:      integer('account_id'),
  cost_center_id:  integer('cost_center_id'),
  profit_center_id: integer('profit_center_id'),
  debit_amount:    numeric('debit_amount', { precision: 15, scale: 2 }).default('0'),
  credit_amount:   numeric('credit_amount', { precision: 15, scale: 2 }).default('0'),
  description:     text('description'),
  created_at:      timestamp('created_at').defaultNow(),
});

// ─── SD: Customer Sub-tables ──────────────────────────────────────────────────

export const sd_customer_contacts = pgTable('sd_customer_contacts', {
  id:          serial('id').primaryKey(),
  customer_id: integer('customer_id'),
  name:        text('name'),
  phone:       text('phone'),
  email:       text('email'),
  created_at:  timestamp('created_at').defaultNow(),
});

export const sd_customer_documents = pgTable('sd_customer_documents', {
  id:          serial('id').primaryKey(),
  customer_id: integer('customer_id'),
  title:       text('title'),
  file_url:    text('file_url'),
  created_at:  timestamp('created_at').defaultNow(),
});

export const sd_customer_competitors = pgTable('sd_customer_competitors', {
  id:          serial('id').primaryKey(),
  customer_id: integer('customer_id'),
  name:        text('name'),
  notes:       text('notes'),
  created_at:  timestamp('created_at').defaultNow(),
});

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

export const questionnaire_templates = pgTable('questionnaire_templates', {
  id:          serial('id').primaryKey(),
  title:       text('title'),
  description: text('description'),
  is_active:   boolean('is_active').default(true),
  created_at:  timestamp('created_at').defaultNow(),
});

// ─── HR: Bot Tables ───────────────────────────────────────────────────────────

export const recruitment_bot_attempts = pgTable('recruitment_bot_attempts', {
  id:               serial('id').primaryKey(),
  telegram_chat_id: text('telegram_chat_id'),
  vacancy_id:       integer('vacancy_id'),
  attempts:         integer('attempts').default(0),
  last_attempt_at:  timestamp('last_attempt_at').defaultNow(),
});

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
