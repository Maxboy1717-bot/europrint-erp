/**
 * @module schema-business-c-2-misc
 * @description Sales invoices, visitor log, eNPS responses, skill catalog,
 *   SD contracts. Split out of schema-business-c-2 to respect the 300-line budget.
 */

import {
  pgTable, serial, text, integer, boolean, timestamp, numeric, jsonb, date,
} from 'drizzle-orm/pg-core';

// sales_invoices: used with snake_case columns in finance-ar.repository.ts and finance-actions.repository.ts
// Canonical salesInvoices uses camelCase — kept as local stub.
export const sales_invoices = pgTable('sales_invoices', {
  id:             serial('id').primaryKey(),
  customer_id:    text('customer_id'),
  customer_name:  text('customer_name'),
  invoice_number: text('invoice_number'),
  sales_order_id: text('sales_order_id'),
  total_amount:   numeric('total_amount', { precision: 15, scale: 2 }),
  paid_amount:    numeric('paid_amount', { precision: 15, scale: 2 }).default('0'),
  currency:       text('currency').default('UZS'),
  status:         text('status').default('draft'),
  payment_status: text('payment_status').default('unpaid'),
  due_date:       date('due_date'),
  created_at:     timestamp('created_at').defaultNow(),
  updated_at:     timestamp('updated_at').defaultNow(),
});

// visitor_log: used with snake_case columns in reception.repository.ts
// Canonical visitorLog uses camelCase — kept as local stub.
export const visitor_log = pgTable('visitor_log', {
  id:               serial('id').primaryKey(),
  visitor_name:     text('visitor_name').notNull(),
  visitor_phone:    text('visitor_phone'),
  visitor_company:  text('visitor_company'),
  purpose:          text('purpose'),
  host_employee_id: integer('host_employee_id'),
  badge_number:     text('badge_number'),
  check_in_at:      timestamp('check_in_at').defaultNow(),
  check_out_at:     timestamp('check_out_at'),
  registered_by:    integer('registered_by'),
  id_document:      text('id_document'),
  id_document_type: text('id_document_type').default('passport'),
  notes:            text('notes'),
  status:           text('status').default('active'),
});

// enps_responses: used with snake_case columns in enps.repository.ts
// Canonical enpsResponses uses camelCase — kept as local stub.
export const enps_responses = pgTable('enps_responses', {
  id:          serial('id').primaryKey(),
  survey_id:   integer('survey_id').notNull(),
  employee_id: integer('employee_id').notNull(),
  score:       integer('score'),
  comment:     text('comment'),
  answers:     jsonb('answers'),
  created_at:  timestamp('created_at').defaultNow(),
});

// skill_catalog: used with snake_case columns in skills-matrix.repository.ts
// Canonical skillCatalog uses camelCase — kept as local stub.
export const skill_catalog = pgTable('skill_catalog', {
  id:          serial('id').primaryKey(),
  code:        text('code').unique().notNull(),
  name:        text('name').notNull(),
  name_ru:     text('name_ru'),
  category:    text('category'),
  is_active:   boolean('is_active').default(true),
  created_at:  timestamp('created_at').defaultNow(),
});

// sd_contracts: used with snake_case columns in sd-contracts.controller.ts
// Canonical sdContracts uses camelCase — kept as local stub.
export const sd_contracts = pgTable('sd_contracts', {
  id:              serial('id').primaryKey(),
  contract_number: text('contract_number'),
  order_id:        integer('order_id'),
  order_number:    text('order_number'),
  customer_id:     integer('customer_id'),
  template_type:   text('template_type').default('standard'), // standard | vip | oneTime
  papka_no:        text('papka_no'),
  status:          text('status').default('draft'), // draft | sent | signed | cancelled
  signed_at:       timestamp('signed_at'),
  notes:           text('notes'),
  // Extended fields for FE create form (matching lib/db/src/schema/sd-europrint-schema.ts)
  start_date:      text('start_date'),
  end_date:        text('end_date'),
  total_amount:    text('total_amount'),
  payment_terms:   text('payment_terms'),
  // Soft-delete audit (A93/T11-08). O'chirish = deleted_at=NOW()+deleted_by=user; faol=deleted_at IS NULL.
  deleted_at:      timestamp('deleted_at'),
  deleted_by:      integer('deleted_by'),
  created_at:      timestamp('created_at').defaultNow(),
  updated_at:      timestamp('updated_at').defaultNow(),
});
