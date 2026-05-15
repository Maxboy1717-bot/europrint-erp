/**
 * @module schema-business-a-2-mro
 * @description MRO (Maintenance, Repair & Operations) Drizzle table definitions
 *   extracted from schema-business-a-2.ts to keep that file <300 lines (Rule 16).
 */

import {
  pgTable, serial, text, integer, timestamp, numeric, date,
} from 'drizzle-orm/pg-core';

// ─── MRO (Maintenance, Repair & Operations) ──────────────────────────────────

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

export const mro_items = pgTable('mro_items', {
  id:            serial('id').primaryKey(),
  name:          text('name').notNull(),
  category:      text('category'),
  unit:          text('unit'),
  current_stock: numeric('current_stock', { precision: 15, scale: 3 }),
  min_stock:     numeric('min_stock', { precision: 15, scale: 3 }),
  unit_cost:     numeric('unit_cost', { precision: 12, scale: 2 }),
  location:      text('location'),
  supplier:      text('supplier'),
  created_at:    timestamp('created_at').defaultNow(),
  updated_at:    timestamp('updated_at').defaultNow(),
});

export const mro_requests = pgTable('mro_requests', {
  id:                 serial('id').primaryKey(),
  item_id:            integer('item_id'),
  requested_quantity: numeric('requested_quantity', { precision: 15, scale: 3 }),
  reason:             text('reason'),
  requested_by:       integer('requested_by'),
  priority:           text('priority').default('normal'),
  status:             text('status').default('pending'),
  approved_by:        integer('approved_by'),
  approved_at:        timestamp('approved_at'),
  fulfillment_date:   date('fulfillment_date'),
  notes:              text('notes'),
  created_at:         timestamp('created_at').defaultNow(),
  updated_at:         timestamp('updated_at').defaultNow(),
});

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

// ─── MRO Facility Management ──────────────────────────────────────────────────

export const mro_facilities = pgTable('mro_facilities', {
  id:                   serial('id').primaryKey(),
  facility_code:        text('facility_code').notNull(),
  name:                 text('name').notNull(),
  facility_type:        text('facility_type').default('office'), // office | production | warehouse | canteen | outdoor
  total_area_sqm:       numeric('total_area_sqm', { precision: 10, scale: 2 }),
  items_count:          integer('items_count').default(0),
  responsible_employee: text('responsible_employee'),
  status:               text('status').default('active'), // active | renovation | closed
  created_at:           timestamp('created_at').defaultNow(),
  updated_at:           timestamp('updated_at').defaultNow(),
});

export const mro_cleaning_schedules = pgTable('mro_cleaning_schedules', {
  id:               serial('id').primaryKey(),
  zone_name:        text('zone_name').notNull(),
  task_type:        text('task_type').default('daily'), // daily | weekly | monthly | deep
  frequency:        text('frequency'),
  last_done_at:     timestamp('last_done_at'),
  next_due_at:      timestamp('next_due_at').notNull(),
  assigned_to_name: text('assigned_to_name'),
  status:           text('status').default('pending'), // pending | in_progress | done | overdue
  facility_id:      integer('facility_id'),
  created_at:       timestamp('created_at').defaultNow(),
  updated_at:       timestamp('updated_at').defaultNow(),
});

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

export const mro_utility_readings = pgTable('mro_utility_readings', {
  id:               serial('id').primaryKey(),
  utility_type:     text('utility_type').notNull(), // electricity | water | gas | steam
  meter_code:       text('meter_code').notNull(),
  facility_name:    text('facility_name'),
  current_reading:  numeric('current_reading', { precision: 15, scale: 3 }).notNull(),
  previous_reading: numeric('previous_reading', { precision: 15, scale: 3 }).notNull(),
  consumption:      numeric('consumption', { precision: 15, scale: 3 }).notNull(),
  unit:             text('unit').default('kWh'),
  unit_cost_uzs:    numeric('unit_cost_uzs', { precision: 12, scale: 2 }).default('0'),
  total_cost_uzs:   numeric('total_cost_uzs', { precision: 15, scale: 2 }).default('0'),
  reading_date:     date('reading_date').notNull(),
  created_at:       timestamp('created_at').defaultNow(),
  updated_at:       timestamp('updated_at').defaultNow(),
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
