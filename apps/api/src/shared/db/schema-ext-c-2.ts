/**
 * @module schema-ext-c-2
 * @description Source module. See exports for details.
 */

import {
  pgTable, serial, text, integer, boolean, timestamp, numeric, jsonb, date, varchar,
} from 'drizzle-orm/pg-core';
import { employee_badges as canonicalEmployeeBadges } from './schema-business-c-1';

// lib/db da mavjud emas (employee_transfers != employee_transfer_history) — saqlab qolindi.
export const employee_transfers_ext = pgTable('employee_transfers', {
  id:              serial('id').primaryKey(),
  employee_id:     integer('employee_id'),
  from_department: integer('from_department'),
  to_department:   integer('to_department'),
  from_position:   integer('from_position'),
  to_position:     integer('to_position'),
  effective_date:  date('effective_date'),
  reason:          text('reason'),
  created_at:      timestamp('created_at').defaultNow(),
});

// [2026-05-22 dedup] employee_files: re-exported from canonical definition in
// lib/db (hr-compensation.ts: employeeFiles, in barrel via hr-personal → hr-schema → index).
// Previous local pgTable (5 cols) removed.
export { employeeFiles as employee_files } from '@workspace/db';

// [2026-05-22 dedup] employee_ratings: re-exported from canonical definition in
// lib/db (hr-performance-ext.ts: 24 cols, in barrel chain). Previous local pgTable
// (5 cols, minimal stub) removed (callers use this symbol name from @shared/db
// which re-exports it from schema-ext-c-2 — now forwarded to the rich canonical).
import { employeeRatings as _employeeRatings_canon } from '@workspace/db';
export const employee_ratings = _employeeRatings_canon;

// lib/db da mavjud emas — saqlab qolindi.
export const employee_rating_goals = pgTable('employee_rating_goals', {
  id:          serial('id').primaryKey(),
  employee_id: integer('employee_id'),
  goal_id:     integer('goal_id'),
  score:       numeric('score', { precision: 5, scale: 2 }),
  created_at:  timestamp('created_at').defaultNow(),
});

// employee_badges: re-exported from canonical definition in schema-business-c-1.ts
export const employee_badges_ext = canonicalEmployeeBadges;

// lib/db da mavjud emas — saqlab qolindi.
export const employee_daily_reports = pgTable('employee_daily_reports', {
  id:          serial('id').primaryKey(),
  employee_id: integer('employee_id'),
  report_date: date('report_date'),
  data:        jsonb('data').default({}),
  created_at:  timestamp('created_at').defaultNow(),
});

// [2026-05-22 dedup] employee_daily_kpi: re-exported from canonical definition in
// lib/db (hr-performance-ext.ts: 20 cols, in barrel chain). Previous local pgTable
// (4 cols, minimal stub) removed.
import { employeeDailyKpi as _employeeDailyKpi_canon } from '@workspace/db';
export const employee_daily_kpi = _employeeDailyKpi_canon;

// [2026-05-22 dedup] employee_inventory_ledger: re-exported from canonical definition in
// lib/db (pos-schema-v2.ts: employeeInventoryLedger, in barrel). Previous local pgTable
// (5 cols) removed.
export { employeeInventoryLedger as employee_inventory_ledger } from '@workspace/db';

// [2026-05-22 dedup] employee_liability_cases: re-exported from canonical definition in
// lib/db (pos-schema-v2.ts: employeeLiabilityCases, in barrel). Previous local pgTable
// (6 cols) removed.
export { employeeLiabilityCases as employee_liability_cases } from '@workspace/db';

// lib/db da bor (assessment.ts: employee360Responses) lekin barrel da eksport yo'q — saqlab qolindi.
export const employee_360_responses = pgTable('employee_360_responses', {
  id:            serial('id').primaryKey(),
  assessment_id: integer('assessment_id'),
  rater_id:      integer('rater_id'),
  scores:        jsonb('scores').default({}),
  created_at:    timestamp('created_at').defaultNow(),
});

// ─── HR Succession & Career ────────────────────────────────────────────────────

// SHIM: Canon definition lives in @workspace/db (lib/db/src/schema/hr-safety.ts).
// The earlier divergent local definition (snake_case position_id/candidate_id/
// readiness) had no Drizzle callers (callers=0) — only raw-SQL service queries
// touch this table. Both definitions point to the same physical `succession_plans`
// table; the canonical lib/db copy is varchar PK (userId, targetPositionId,
// targetDate, notes, status). See docs/schema-canon-map.md.
import { successionPlans as _successionPlansCanon } from '@workspace/db';
export const succession_plans = _successionPlansCanon;

// ─── Strategic OKR ─────────────────────────────────────────────────────────────

// ─── HR: Applications & Interviews ────────────────────────────────────────────
// lib/db da mavjud emas — saqlab qolindi.

export const hr_application_responses = pgTable('hr_application_responses', {
  id:             serial('id').primaryKey(),
  application_id: integer('application_id'),
  question_id:    integer('question_id'),
  answer:         text('answer'),
  created_at:     timestamp('created_at').defaultNow(),
});

// [2026-05-22 dedup] hr_candidate_funnels: re-exported from canonical definition in
// lib/db (hr-recruiter.ts: hrCandidateFunnels, in barrel). Previous local pgTable
// (6 cols) removed.
export { hrCandidateFunnels as hr_candidate_funnels } from '@workspace/db';

// ─── HR Capital ────────────────────────────────────────────────────────────────
// [2026-05-22 dedup] hr_capital_courses: re-exported from canonical definition in
// lib/db (lms-schema.ts: hrCapitalCourses, in barrel). Previous local pgTable
// (6 cols) removed.
export { hrCapitalCourses as hr_capital_courses } from '@workspace/db';

// ─── WMS Exit & Production Supply ─────────────────────────────────────────────
// lib/db da mavjud emas — saqlab qolindi.

export const wms_exit_logs = pgTable('wms_exit_logs', {
  id:          serial('id').primaryKey(),
  material_id: integer('material_id'),
  warehouse_id: integer('warehouse_id'),
  quantity:    numeric('quantity', { precision: 15, scale: 4 }),
  reason:      text('reason'),
  created_at:  timestamp('created_at').defaultNow(),
});

export const wms_production_supply = pgTable('wms_production_supply', {
  id:           serial('id').primaryKey(),
  order_id:     integer('order_id'),
  material_id:  integer('material_id'),
  quantity:     numeric('quantity', { precision: 15, scale: 4 }),
  supplied_at:  timestamp('supplied_at'),
  created_at:   timestamp('created_at').defaultNow(),
});

// ─── Customs & Trade ───────────────────────────────────────────────────────────
// lib/db da mavjud emas — saqlab qolindi.

export const customs_declarations = pgTable('customs_declarations', {
  id:             serial('id').primaryKey(),
  declaration_number: text('declaration_number'),
  type:           text('type'),
  status:         text('status').default('draft'),
  total_value:    numeric('total_value', { precision: 15, scale: 2 }),
  created_at:     timestamp('created_at').defaultNow(),
  updated_at:     timestamp('updated_at').defaultNow(),
});

// ─── SD Rentals & Price Formulas ───────────────────────────────────────────────
// lib/db da mavjud emas — saqlab qolindi.

export const sd_rentals = pgTable('sd_rentals', {
  id:           serial('id').primaryKey(),
  customer_id:  integer('customer_id'),
  equipment_id: integer('equipment_id'),
  start_date:   date('start_date'),
  end_date:     date('end_date'),
  daily_rate:   numeric('daily_rate', { precision: 15, scale: 2 }),
  status:       text('status').default('active'),
  created_at:   timestamp('created_at').defaultNow(),
  updated_at:   timestamp('updated_at').defaultNow(),
});

// [2026-05-22 dedup] sd_price_formulas: re-exported from canonical definition in
// lib/db (sd-europrint-schema.ts: sdPriceFormulas, in barrel). Previous local pgTable
// (4 cols) removed.
export { sdPriceFormulas as sd_price_formulas } from '@workspace/db';

// ─── HR Conflict & Sick Reports ───────────────────────────────────────────────

// ─── Finance: Exception Logs ───────────────────────────────────────────────────
// exceptionLogs was removed from lib/db as an orphan; local definition retained
// here so @shared/db consumers continue to work.
export const exception_logs = pgTable('exception_logs', {
  id:          serial('id').primaryKey(),
  errorCode:   varchar('error_code', { length: 50 }),
  message:     text('message').notNull(),
  stackTrace:  text('stack_trace'),
  userId:      integer('user_id'),
  entityType:  varchar('entity_type', { length: 50 }),
  entityId:    integer('entity_id'),
  severity:    varchar('severity', { length: 20 }).default('ERROR'),
  resolvedAt:  timestamp('resolved_at'),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
});

// ─── MM: Design Orders ─────────────────────────────────────────────────────────
// lib/db da mavjud emas — saqlab qolindi.

export const design_order_revisions = pgTable('design_order_revisions', {
  id:          serial('id').primaryKey(),
  order_id:    integer('order_id'),
  version:     integer('version').default(1),
  notes:       text('notes'),
  created_by:  integer('created_by'),
  created_at:  timestamp('created_at').defaultNow(),
});

// ─── HR: Shift & Attendance ────────────────────────────────────────────────────
// [2026-05-22 dedup] shift_swap_requests: re-exported from canonical definition in
// lib/db (hr-safety.ts: shiftSwapRequests, in barrel via hr-extended → hr-schema → index).
// Previous local pgTable (5 cols) removed.
export { shiftSwapRequests as shift_swap_requests } from '@workspace/db';

// lib/db da mavjud emas (attendanceRecords != attendance_logs) — saqlab qolindi.
export const attendance_logs = pgTable('attendance_logs', {
  id:          serial('id').primaryKey(),
  employee_id: integer('employee_id'),
  type:        text('type'),
  logged_at:   timestamp('logged_at'),
  source:      text('source'),
  created_at:  timestamp('created_at').defaultNow(),
});

// ─── Kaizen & Improvement ─────────────────────────────────────────────────────

// ─── Warehouse Rental ──────────────────────────────────────────────────────────
// [2026-05-22 dedup] warehouse_rental_records: re-exported from canonical definition in
// lib/db (wms-schema.ts: warehouseRentalRecords, in barrel). Previous local pgTable
// (7 cols) removed.
export { warehouseRentalRecords as warehouse_rental_records } from '@workspace/db';

// [2026-05-22 dedup] warehouse_rental_settings: re-exported from canonical definition in
// lib/db (wms-schema.ts: warehouseRentalSettings, in barrel). Previous local pgTable
// (4 cols) removed.
export { warehouseRentalSettings as warehouse_rental_settings } from '@workspace/db';

// lib/db da mavjud emas — saqlab qolindi.
export const warehouse_access_grants = pgTable('warehouse_access_grants', {
  id:           serial('id').primaryKey(),
  warehouse_id: integer('warehouse_id'),
  employee_id:  integer('employee_id'),
  access_level: text('access_level').default('read'),
  created_at:   timestamp('created_at').defaultNow(),
});

// [2026-05-22 dedup] warehouse_stock: re-exported from canonical definition in
// lib/db (wms-schema.ts: warehouseStock, in barrel). Previous local pgTable
// (4 cols) removed.
export { warehouseStock as warehouse_stock } from '@workspace/db';

// lib/db da mavjud emas — saqlab qolindi.
export const warehouse_batches = pgTable('warehouse_batches', {
  id:           serial('id').primaryKey(),
  warehouse_id: integer('warehouse_id'),
  item_id:      integer('item_id'),
  batch_number: text('batch_number'),
  quantity:     numeric('quantity', { precision: 15, scale: 4 }),
  received_at:  timestamp('received_at'),
  created_at:   timestamp('created_at').defaultNow(),
});
