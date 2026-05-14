/**
 * @module schema-business-a-2
 * @description Source module. See exports for details.
 */

import {
  pgTable, serial, text, integer, boolean, timestamp, numeric, jsonb, varchar, date,
} from 'drizzle-orm/pg-core';

export const strategic_categories = pgTable('strategic_categories', {
  id:          serial('id').primaryKey(),
  name:        text('name').notNull(),
  description: text('description'),
  color:       varchar('color', { length: 20 }).default('#3B82F6'),
  created_at:  timestamp('created_at').defaultNow(),
});

export const strategic_tasks = pgTable('strategic_tasks', {
  id:           serial('id').primaryKey(),
  title:        text('title').notNull(),
  category_id:  integer('category_id'),
  assignee_id:  integer('assigned_user_id'),
  created_by:   integer('created_by'),
  due_date:     varchar('target_date', { length: 10 }),
  priority:     text('priority').default('medium'),
  description:  text('description'),
  status:       text('status').default('planned'),
  progress:     integer('progress_percent').default(0),
  created_at:   timestamp('created_at').defaultNow(),
  updated_at:   timestamp('updated_at').defaultNow(),
});

export const strategic_milestones = pgTable('strategic_milestones', {
  id:           serial('id').primaryKey(),
  task_id:      integer('task_id').notNull(),
  title:        text('title').notNull(),
  due_date:     date('due_date'),
  description:  text('description'),
  status:       text('status').default('pending'),
  updated_at:   timestamp('updated_at').defaultNow(),
});

export const okr_objectives = pgTable('okr_objectives', {
  id:          serial('id').primaryKey(),
  title:       text('title').notNull(),
  type:        text('type').default('company'),
  year:        integer('year'),
  quarter:     text('quarter'),
  description: text('description'),
  owner_id:    integer('owner_id'),
  status:      text('status').default('active'),
  created_at:  timestamp('created_at').defaultNow(),
  updated_at:  timestamp('updated_at').defaultNow(),
});

export const okr_key_results = pgTable('okr_key_results', {
  id:            serial('id').primaryKey(),
  objective_id:  integer('objective_id').notNull(),
  title:         text('title').notNull(),
  target_value:  numeric('target_value', { precision: 15, scale: 2 }),
  current_value: numeric('current_value', { precision: 15, scale: 2 }),
  unit:          text('unit'),
  owner_id:      integer('owner_id'),
  status:        text('status').default('active'),
  created_at:    timestamp('created_at').defaultNow(),
  updated_at:    timestamp('updated_at').defaultNow(),
});

export const dokla = pgTable('dokla', {
  id:            serial('id').primaryKey(),
  from_user_id:  integer('from_user_id'),
  from_name:     text('from_name'),
  council_level: text('council_level'),
  subject:       text('subject'),
  problem:       text('problem'),
  result:        text('result'),
  proposal:      text('proposal'),
  status:        text('status').default('sent'),
  created_at:    timestamp('created_at').defaultNow(),
  updated_at:    timestamp('updated_at').defaultNow(),
});

export const rasporyazhenie = pgTable('rasporyazhenie', {
  id:           serial('id').primaryKey(),
  from_user_id: integer('from_user_id'),
  to_user:      text('to_user'),
  task:         text('task'),
  deadline:     date('deadline'),
  priority:     text('priority').default('medium'),
  status:       text('status').default('assigned'),
  done_at:      timestamp('done_at'),
  done_by:      integer('done_by'),
  done_note:    text('done_note'),
  created_at:   timestamp('created_at').defaultNow(),
  updated_at:   timestamp('updated_at').defaultNow(),
});

// ─── Core: Seven Functions & RACI ────────────────────────────────────────────

export const seven_functions = pgTable('seven_functions', {
  id:          serial('id').primaryKey(),
  name:        text('name').notNull(),
  description: text('description'),
  owner_id:    integer('owner_id'),
  order_index: integer('order_index').default(0),
  created_by:  integer('created_by'),
  created_at:  timestamp('created_at').defaultNow(),
  updated_at:  timestamp('updated_at').defaultNow(),
});

export const seven_function_kpis = pgTable('seven_function_kpis', {
  id:             serial('id').primaryKey(),
  function_id:    integer('function_id').notNull(),
  name:           text('name').notNull(),
  target_value:   numeric('target_value', { precision: 15, scale: 2 }),
  actual_value:   numeric('actual_value', { precision: 15, scale: 2 }),
  unit:           text('unit'),
  responsible_id: integer('responsible_id'),
  frequency:      text('frequency').default('monthly'),
  created_at:     timestamp('created_at').defaultNow(),
  updated_at:     timestamp('updated_at').defaultNow(),
});

export const raci_tasks = pgTable('raci_tasks', {
  id:             serial('id').primaryKey(),
  title:          text('title').notNull(),
  description:    text('description'),
  responsible_id: integer('responsible_id'),
  accountable_id: integer('accountable_id'),
  created_by:     integer('created_by'),
  deadline:       date('deadline'),
  status:         text('status').default('pending'),
  created_at:     timestamp('created_at').defaultNow(),
  updated_at:     timestamp('updated_at').defaultNow(),
});

export const raci_assignments = pgTable('raci_assignments', {
  id:          serial('id').primaryKey(),
  task_id:     integer('task_id').notNull(),
  employee_id: integer('employee_id').notNull(),
  role:        text('role'),
});

export const raci_stages = pgTable('raci_stages', {
  id:          serial('id').primaryKey(),
  name:        text('name'),
  description: text('description'),
  order_index: integer('order_index').default(0),
});

export const crisis_records = pgTable('crisis_records', {
  id:          serial('id').primaryKey(),
  title:       text('title'),
  description: text('description'),
  reported_by: integer('reported_by'),
  status:      text('status').default('open'),
  severity:    text('severity').default('medium'),
  created_at:  timestamp('created_at').defaultNow(),
  updated_at:  timestamp('updated_at').defaultNow(),
});

export const risk_assessments = pgTable('risk_assessments', {
  id:          serial('id').primaryKey(),
  title:       text('title').notNull(),
  risk_level:  text('risk_level'),
  description: text('description'),
  likelihood:  integer('likelihood'),
  impact:      integer('impact'),
  assessor_id: integer('assessor_id'),
  status:      text('status').default('open'),
  created_at:  timestamp('created_at').defaultNow(),
  updated_at:  timestamp('updated_at').defaultNow(),
});

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
