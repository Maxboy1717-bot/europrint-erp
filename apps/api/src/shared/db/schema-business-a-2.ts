/**
 * @module schema-business-a-2
 * @description Source module. See exports for details.
 *
 *   MRO tables (mro_*) live in schema-business-a-2-mro.ts (Rule 16). This file
 *   re-exports them so the public import surface is unchanged.
 */

import {
  pgTable, serial, text, integer, timestamp, numeric, varchar, date,
} from 'drizzle-orm/pg-core';

// Re-exports — MRO tables (split for Rule 16)
export {
  mro_equipment,
  mro_items,
  mro_requests,
  mro_work_orders,
  mro_facilities,
  mro_cleaning_schedules,
  mro_pm_schedules,
  mro_utility_readings,
  mro_canteen_logs,
} from './schema-business-a-2-mro';

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
