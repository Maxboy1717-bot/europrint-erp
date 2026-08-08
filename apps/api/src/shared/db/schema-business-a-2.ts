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
  mro_settings,
} from './schema-business-a-2-mro';

// ─── Director: Strategic, OKR ─────────────────────────────────────────────────
// strategicCategories, strategicTasks, strategicMilestones, okrObjectives, okrKeyResults
// → all defined in lib/db (strategic-ext-schema.ts)
export { strategicCategories  as strategic_categories }  from '@workspace/db';
export { strategicTasks       as strategic_tasks }        from '@workspace/db';
export { strategicMilestones  as strategic_milestones }   from '@workspace/db';
export { okrObjectives        as okr_objectives }         from '@workspace/db';
export { okrKeyResults        as okr_key_results }        from '@workspace/db';

// TODO: Move to lib/db/src/schema/
// dokla — NOT yet in lib/db
// rasporyazhenie — NOT yet in lib/db

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
  // 04-cc EP-COR-043/044/046/067 — additive (Q-35, 2026-07-11). doc_type: rejali |
  // sorovga_javob | muammo. sla_deadline_at: hisoblovchi cron kelgusi bosqich, bu
  // faqat qiymat ustuni. period/attachment_url: EP-COR-046 "Davr"/"Ilova" (mavjud
  // subject/problem/result/proposal RENAME qilinmadi — Q-46).
  doc_type:         text('doc_type'),
  sla_deadline_at:  timestamp('sla_deadline_at', { withTimezone: true }),
  period:           text('period'),
  attachment_url:   text('attachment_url'),
  papka_order_id:   integer('papka_order_id'),
  // Owner decision 2026-07-13 (chat) — hard-delete -> soft-delete + audit trail
  // (coordination.repository.ts deleteDokla() previously ran a real Drizzle .delete()).
  // Additive, nullable (Q-35/Q-46). Mirrors sd_customers.deleted_at/deleted_by shape
  // (VISION-3340 #63, commit 01daa468). Human-readable mirror:
  // apps/api/src/shared/db/migrations/dokla-rasporyazhenie-soft-delete-2026-07-13.sql.
  deleted_at:       timestamp('deleted_at'),
  deleted_by:       integer('deleted_by'),
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
  // 04-cc EP-COR-067/097 — additive (Q-35, 2026-07-11): Buyurtma/Papka yagona kalit.
  papka_order_id: integer('papka_order_id'),
  // Owner decision 2026-07-13 (chat) — hard-delete -> soft-delete + audit trail
  // (coordination.repository.ts deleteRasp() previously ran a real Drizzle .delete()).
  // Additive, nullable (Q-35/Q-46). Mirrors sd_customers.deleted_at/deleted_by shape
  // (VISION-3340 #63, commit 01daa468). Human-readable mirror:
  // apps/api/src/shared/db/migrations/dokla-rasporyazhenie-soft-delete-2026-07-13.sql.
  deleted_at:     timestamp('deleted_at'),
  deleted_by:     integer('deleted_by'),
});

// ─── Core: Seven Functions & RACI ─────────────────────────────────────────────
// TODO: Move to lib/db/src/schema/
// seven_functions — NOT yet in lib/db
// seven_function_kpis — NOT yet in lib/db
// raci_stages — NOT yet in lib/db
// crisis_records — NOT yet in lib/db
// risk_assessments — NOT yet in lib/db

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

// raciTasks, raciAssignments → lib/db (strategic-ext-schema.ts)
export { raciTasks       as raci_tasks }       from '@workspace/db';
export { raciAssignments as raci_assignments } from '@workspace/db';

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
