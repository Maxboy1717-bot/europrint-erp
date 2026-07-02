/**
 * @module schema-ext-b-2
 * @description Source module. Canonical MES/RACI tables now live in lib/db.
 * Re-exported here for backward compatibility with apps/api consumers.
 */

import {
  pgTable, serial, text, integer, boolean, timestamp, numeric, jsonb,
} from 'drizzle-orm/pg-core';
import { budgets as canonicalBudgets } from './schema-finance-budgets';

// ─── MES Extended ─────────────────────────────────────────────────────────────
// Canonical definitions in lib/db/src/schema/mes-schema.ts
export {
  mesMaintenanceTasks   as mes_maintenance_tasks,
  mesProductionSessions as mes_production_sessions,
  mesShiftStats         as mes_shift_stats,
} from '@workspace/db';

// ─── Security/RACI Extended ───────────────────────────────────────────────────
// Canonical definition in lib/db/src/schema/strategic-ext-schema.ts
export {
  raciMatrix as raci_matrix,
} from '@workspace/db';

// ─── HR Recruitment ────────────────────────────────────────────────────────────

// ─── POS Extended ─────────────────────────────────────────────────────────────

export const pos_categories = pgTable('pos_categories', {
  id:         serial('id').primaryKey(),
  name:       text('name'),
  is_active:  boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
});

// pos_products: canonical definition in lib/db (fi-payroll-ext.ts → fi-advanced → fi-schema).
export { posProducts as pos_products } from '@workspace/db';

export const pos_orders = pgTable('pos_orders', {
  id:           serial('id').primaryKey(),
  cashier_id:   integer('cashier_id'),
  status:       text('status').default('open'),
  total_amount: numeric('total_amount', { precision: 15, scale: 2 }).default('0'),
  payment_method: text('payment_method'),
  created_at:   timestamp('created_at').defaultNow(),
  updated_at:   timestamp('updated_at').defaultNow(),
});

export const pos_order_items = pgTable('pos_order_items', {
  id:         serial('id').primaryKey(),
  order_id:   integer('order_id'),
  product_id: integer('product_id'),
  quantity:   numeric('quantity', { precision: 15, scale: 4 }),
  price:      numeric('price', { precision: 15, scale: 2 }),
  created_at: timestamp('created_at').defaultNow(),
});

// SHIM: canonical pos_movements lives in @workspace/db (pos-schema-v2).
// Re-exported here under snake_case alias for legacy callers. Do NOT add a
// second pgTable definition — that would register two Drizzle table objects for
// the same physical table.
export { posMovements as pos_movements } from '@workspace/db';

export const pos_printer_configs = pgTable('pos_printer_configs', {
  id:          serial('id').primaryKey(),
  name:        text('name'),
  type:        text('type'),
  ip_address:  text('ip_address'),
  port:        integer('port'),
  is_active:   boolean('is_active').default(true),
  is_default:  boolean('is_default').default(false),
  settings:    jsonb('settings').default({}),
  created_at:  timestamp('created_at').defaultNow(),
  updated_at:  timestamp('updated_at').defaultNow(),
});

// ─── CRM Extended ─────────────────────────────────────────────────────────────

// crm_leads: canonical definition in lib/db (crm-contacts.ts → crm-core → crm-schema).
export { crmLeads as crm_leads } from '@workspace/db';

// crm_deals: canonical definition in lib/db (crm-pipelines.ts → crm-core → crm-schema).
export { crmDeals as crm_deals } from '@workspace/db';

// crm_contacts: canonical definition in lib/db (crm-contacts.ts → crm-core → crm-schema).
export { crmContacts as crm_contacts } from '@workspace/db';

// ─── MM Extended: SD Leads, Payments, etc. ────────────────────────────────────

// sd_payments: canonical definition in lib/db (sd-europrint-schema.ts).
export { sdPayments as sd_payments } from '@workspace/db';

// sd_leads: canonical definition in lib/db (sd-europrint-schema.ts).
export { sdLeads as sd_leads } from '@workspace/db';

// sd_quotations: canonical definition in lib/db (sd-europrint-schema.ts).
export { sdQuotations as sd_quotations } from '@workspace/db';

// ─── Finance Extended: Payroll, Budgets ───────────────────────────────────────

// budgets: re-exported from canonical definition in schema-finance-budgets.ts.
// Consumers should use the canonical UUID/fiscalYear/department schema.
export const budgets = canonicalBudgets;

// budget_lines: flows through schema-finance-budgets → schema-finance → schema (canonical path).
// No local definition or re-export here.

// DEPRECATED (2026-07-02): no writer in the codebase — `payroll_advances`
// (schema-business-b-1.ts) is the real advance-request table, written by
// finance/advances flow (check-advance.handler → FinanceOpsRepo.recordAdvance)
// and read by finance-actions.repository.ts. Kept only so the pre-existing
// seed rows keep resolving; do not add new readers/writers against `advances`.
export const advances = pgTable('advances', {
  id:          serial('id').primaryKey(),
  employee_id: integer('employee_id'),
  amount:      numeric('amount', { precision: 15, scale: 2 }),
  status:      text('status').default('pending'),
  purpose:     text('purpose'),
  approved_by: integer('approved_by'),
  created_at:  timestamp('created_at').defaultNow(),
  updated_at:  timestamp('updated_at').defaultNow(),
});

// ─── HR Leave & Attendance ─────────────────────────────────────────────────────

// hr_leave_balances: canonical definition in lib/db/src/schema/hr-overtime-schema.ts
export { hrLeaveBalances as hr_leave_balances } from '@workspace/db';

// attendance_records: canonical definition in lib/db (hr-safety.ts → hr-extended → hr-schema).
export { attendanceRecords as attendance_records } from '@workspace/db';

// ─── IoT Tables ────────────────────────────────────────────────────────────────

// iot_sensors: canonical definition in lib/db (iot-schema.ts).
export { iotSensors as iot_sensors } from '@workspace/db';

// iot_sensor_readings: canonical definition in lib/db (iot-schema.ts).
export { iotSensorReadings as iot_sensor_readings } from '@workspace/db';

// iot_alerts: canonical definition in lib/db (iot-schema.ts).
export { iotAlerts as iot_alerts } from '@workspace/db';

// ─── Skills & Competency ───────────────────────────────────────────────────────

// ─── MM Vendor & Requisition ───────────────────────────────────────────────────
