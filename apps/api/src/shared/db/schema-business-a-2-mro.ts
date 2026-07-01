/**
 * @module schema-business-a-2-mro
 * @description MRO (Maintenance, Repair & Operations) Drizzle table definitions
 *   extracted from schema-business-a-2.ts to keep that file <300 lines (Rule 16).
 */

import {
  pgTable, serial, text, integer, timestamp, numeric, date,
} from 'drizzle-orm/pg-core';

// ─── MRO (Maintenance, Repair & Operations) ───────────────────────────────────
// TODO: Move to lib/db/src/schema/
// mro_equipment — NOT yet in lib/db
// mro_work_orders — NOT yet in lib/db
// mro_pm_schedules — NOT yet in lib/db
// mro_canteen_logs — NOT yet in lib/db

export const mro_equipment = pgTable('mro_equipment', {
  id:                    serial('id').primaryKey(),
  inventory_number:      text('inventory_number'),
  name:                  text('name').notNull(),
  category:              text('category'),
  status:                text('status').default('active'),
  location:              text('location'),
  purchase_date:         date('purchase_date'),
  last_maintenance_date: date('last_maintenance_date'),
  next_maintenance_date: date('next_maintenance_date'),
  created_at:            timestamp('created_at').defaultNow(),
  updated_at:            timestamp('updated_at').defaultNow(),
});

// mroItems, mroRequests → lib/db (mm-mro.ts)
export { mroItems    as mro_items }    from '@workspace/db';
export { mroRequests as mro_requests } from '@workspace/db';

export const mro_work_orders = pgTable('mro_work_orders', {
  id:            serial('id').primaryKey(),
  equipment_id:  integer('equipment_id'),
  type:          text('type').default('preventive'),
  description:   text('description'),
  assigned_to:   integer('assigned_to'),
  priority:      text('priority').default('normal'),
  status:        text('status').default('pending'),
  scheduled_date: date('scheduled_date'),
  completed_date: date('completed_date'),
  notes:         text('notes'),
  cost:          numeric('cost', { precision: 12, scale: 2 }),
  created_at:    timestamp('created_at').defaultNow(),
  updated_at:    timestamp('updated_at').defaultNow(),
});

// ─── MRO Facility Management ───────────────────────────────────────────────────
// mroFacilities, mroCleaningSchedules, mroUtilityReadings → lib/db (mm-logistics.ts)
export { mroFacilities        as mro_facilities }         from '@workspace/db';
export { mroCleaningSchedules as mro_cleaning_schedules } from '@workspace/db';
export { mroUtilityReadings   as mro_utility_readings }   from '@workspace/db';

export const mro_pm_schedules = pgTable('mro_pm_schedules', {
  id:                        serial('id').primaryKey(),
  equipment_id:              integer('equipment_id'),
  equipment_name:            text('equipment_name').notNull(),
  schedule_type:             text('schedule_type').default('monthly'), // daily | weekly | monthly | quarterly | yearly
  next_due_date:             date('next_due_date').notNull(),
  last_completed_date:       date('last_completed_date'),
  interval_days:             integer('interval_days').default(30),
  status:                    text('status').default('scheduled'), // scheduled | due | overdue | completed
  estimated_duration_hours:  numeric('estimated_duration_hours', { precision: 6, scale: 2 }).default('1'),
  assigned_tech_name:        text('assigned_tech_name'),
  created_at:                timestamp('created_at').defaultNow(),
  updated_at:                timestamp('updated_at').defaultNow(),
});

export const mro_canteen_logs = pgTable('mro_canteen_logs', {
  id:              serial('id').primaryKey(),
  log_date:        date('log_date').notNull(),
  meal_name:       text('meal_name').notNull(),
  portion_count:   integer('portion_count').default(0),
  cost_per_portion: numeric('cost_per_portion', { precision: 10, scale: 2 }).default('0'),
  total_cost:      numeric('total_cost', { precision: 12, scale: 2 }).default('0'),
  employees_served: integer('employees_served').default(0),
  created_at:      timestamp('created_at').defaultNow(),
  updated_at:      timestamp('updated_at').defaultNow(),
});

// mroSettings → lib/db (mm-mro.ts) — FAZA "Sozlama har bo'limda" 2026-07-01
export { mroSettings as mro_settings } from '@workspace/db';
