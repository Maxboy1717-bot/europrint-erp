/**
 * @module schema-ext-b-1
 * @description Source module. See exports for details.
 */

import {
  pgTable, serial, text, integer, boolean, timestamp, numeric,
} from 'drizzle-orm/pg-core';
import { mm_purchase_orders as canonicalMmPurchaseOrders } from './schema-business-b-1';
import { fi_invoices as canonicalFiInvoices } from './schema-business-b-2';

// ─── MM Extended: Receipt Lines & Materials ────────────────────────────────────

export const mm_goods_receipt_lines = pgTable('mm_goods_receipt_lines', {
  id:               serial('id').primaryKey(),
  goods_receipt_id: integer('goods_receipt_id'),
  material_id:      integer('material_id'),
  quantity:         numeric('quantity', { precision: 15, scale: 4 }),
  unit_cost:        numeric('unit_cost', { precision: 15, scale: 4 }),
  qc_status:        text('qc_status'),
  qc_notes:         text('qc_notes'),
  qc_by:            integer('qc_by'),
  qc_at:            timestamp('qc_at'),
  created_at:       timestamp('created_at').defaultNow(),
});

// mm_purchase_orders: re-exported from canonical definition in schema-business-b-1.ts
export const mm_purchase_orders_int = canonicalMmPurchaseOrders;

// ─── HR Core Tables ────────────────────────────────────────────────────────────

// ─── Finance Core Tables ───────────────────────────────────────────────────────

// income_expense_transactions: canonical definition in lib/db (fi-kassa.ts → fi-banking → fi-schema).
export { incomeExpenseTransactions as income_expense_transactions } from '@workspace/db';

// gl_documents: canonical definition in lib/db (fi-gl.ts → fi-schema).
export { glDocuments as gl_documents } from '@workspace/db';

// accounts: canonical definition in lib/db (fi-gl.ts → fi-schema).
export { accounts } from '@workspace/db';

// stock_moves: canonical definition in lib/db (wms-schema.ts).
export { stockMoves as stock_moves } from '@workspace/db';

// raw_materials: canonical definition in lib/db (mm-raw-materials.ts → mm-procurement → mm-schema).
export { rawMaterials as raw_materials } from '@workspace/db';

// expense_reports: canonical definition in lib/db (fi-expenses.ts → fi-advanced → fi-schema).
export { expenseReports as expense_reports } from '@workspace/db';

// fi_invoices: re-exported from canonical definition in schema-business-b-2.ts
export const fi_invoices = canonicalFiInvoices;

// ─── SD Extended Tables ────────────────────────────────────────────────────────

// sd_customer_interactions: canonical definition in lib/db (sd-customer-relations.ts).
export { sdCustomerInteractions as sd_customer_interactions } from '@workspace/db';

// sd_customer_complaints: canonical definition in lib/db (sd-customer-relations.ts).
export { sdCustomerComplaints as sd_customer_complaints } from '@workspace/db';

// ─── Waste Management Tables ───────────────────────────────────────────────────

// waste_records: canonical definition in lib/db (pp/pp-enhanced.ts → pp-schema).
export { wasteRecords as waste_records } from '@workspace/db';

// waste_targets: canonical definition in lib/db (pp/pp-enhanced.ts → pp-schema).
export { wasteTargets as waste_targets } from '@workspace/db';

// ─── AI Report Tables ──────────────────────────────────────────────────────────

export const ai_report_runs = pgTable('ai_report_runs', {
  id:           serial('id').primaryKey(),
  report_id:    integer('report_id'),
  status:       text('status').default('running'),
  triggered_by: integer('triggered_by'),
  started_at:   timestamp('started_at'),
  completed_at: timestamp('completed_at'),
  created_at:   timestamp('created_at').defaultNow(),
});

// ─── QC Extended Tables ────────────────────────────────────────────────────────
// qc_standards: re-exported from canonical definition in schema-misc-qc.ts
export { qc_standards } from './schema-misc-qc';

// qc_final_inspections: canonical definition in lib/db (qc-schema.ts).
export { qcFinalInspections as qc_final_inspections } from '@workspace/db';

export const qc_in_process_inspections = pgTable('qc_in_process_inspections', {
  id:           serial('id').primaryKey(),
  session_id:   integer('session_id'),
  inspector_id: integer('inspector_id'),
  check_point:  text('check_point'),
  sample_size:  integer('sample_size'),
  defects_found: integer('defects_found').default(0),
  status:       text('status').default('pending'),
  notes:        text('notes'),
  created_at:   timestamp('created_at').defaultNow(),
  updated_at:   timestamp('updated_at').defaultNow(),
});

// ─── LMS Extended Tables ───────────────────────────────────────────────────────

export const lms_test_attempts = pgTable('lms_test_attempts', {
  id:         text('id').primaryKey(),
  user_id:    text('user_id'),
  test_id:    text('test_id'),
  course_id:  text('course_id'),
  score:      numeric('score', { precision: 5, scale: 2 }),
  passed:     boolean('passed').default(false),
  created_at: timestamp('created_at').defaultNow(),
});

// lms_certificates: canonical definition in lib/db (lms-extended.ts).
export { lmsCertificates as lms_certificates } from '@workspace/db';

// ─── MES Extended ─────────────────────────────────────────────────────────────

export const mes_maintenance_requests = pgTable('mes_maintenance_requests', {
  id:           serial('id').primaryKey(),
  title:        text('title'),
  equipment_id: integer('equipment_id'),
  requested_by: integer('requested_by'),
  status:       text('status').default('pending'),
  priority:     text('priority').default('medium'),
  description:  text('description'),
  resolved_at:  timestamp('resolved_at'),
  resolved_by:  integer('resolved_by'),
  notes:        text('notes'),
  created_at:   timestamp('created_at').defaultNow(),
  updated_at:   timestamp('updated_at').defaultNow(),
});
