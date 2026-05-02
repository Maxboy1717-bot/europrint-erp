import {
  pgTable, serial, text, integer, boolean, timestamp, numeric, jsonb, varchar, date,
} from 'drizzle-orm/pg-core';

export const employee_skill_scores = pgTable('employee_skill_scores', {
  id:               serial('id').primaryKey(),
  employee_id:      integer('employee_id').notNull(),
  skill_code:       text('skill_code').notNull(),
  current_level:    integer('current_level').default(0),
  assessed_by:      integer('assessed_by'),
  last_assessed_at: timestamp('last_assessed_at').defaultNow(),
});

export const position_skill_requirements = pgTable('position_skill_requirements', {
  id:             serial('id').primaryKey(),
  position_id:    integer('position_id').notNull(),
  skill_code:     text('skill_code').notNull(),
  required_level: integer('required_level').default(3),
});

export const employee_skills = pgTable('employee_skills', {
  id:               serial('id').primaryKey(),
  employee_id:      integer('employee_id').notNull(),
  skill_name:       text('skill_name'),
  proficiency_level: text('proficiency_level').default('beginner'),
  proficiency_score: numeric('proficiency_score', { precision: 5, scale: 2 }),
  certified_date:   date('certified_date'),
  expiry_date:      date('expiry_date'),
  notes:            text('notes'),
  created_at:       timestamp('created_at').defaultNow(),
  updated_at:       timestamp('updated_at').defaultNow(),
});

// ─── HR: AI Interview / Test Questions ───────────────────────────────────────

export const hrc_iq_questions = pgTable('hrc_iq_questions', {
  id:         serial('id').primaryKey(),
  text_uz:    text('text_uz'),
  text_ru:    text('text_ru'),
  options:    jsonb('options'),
  category:   text('category'),
  created_at: timestamp('created_at').defaultNow(),
});

// ─── HR: Adaptation Cases ─────────────────────────────────────────────────────

export const hr_adaptation_cases = pgTable('hr_adaptation_cases', {
  id:             serial('id').primaryKey(),
  employee_id:    integer('employee_id').notNull(),
  status:         text('status').default('active'),
  risk_level:     text('risk_level').default('low'),
  adaptation_day: integer('adaptation_day').default(0),
  risk_reason:    text('risk_reason'),
  notified_at:    timestamp('notified_at'),
  created_at:     timestamp('created_at').defaultNow(),
  updated_at:     timestamp('updated_at').defaultNow(),
});

// ─── HR: Employee Contracts ───────────────────────────────────────────────────

export const employee_contracts = pgTable('employee_contracts', {
  id:              serial('id').primaryKey(),
  employee_id:     integer('employee_id').notNull(),
  contract_number: text('contract_number'),
  contract_type:   text('contract_type').default('permanent'),
  start_date:      date('start_date'),
  end_date:        date('end_date'),
  status:          text('status').default('active'),
  created_at:      timestamp('created_at').defaultNow(),
  updated_at:      timestamp('updated_at').defaultNow(),
});

// ─── PIP Goals ────────────────────────────────────────────────────────────────

export const pip_goals = pgTable('pip_goals', {
  id:          serial('id').primaryKey(),
  pip_plan_id: integer('pip_plan_id').notNull(),
  title:       text('title'),
  description: text('description'),
  status:      text('status').default('pending'),
  due_date:    date('due_date'),
  created_at:  timestamp('created_at').defaultNow(),
});

// ─── Currencies ───────────────────────────────────────────────────────────────

export const currencies = pgTable('currencies', {
  id:           serial('id').primaryKey(),
  code:         varchar('code', { length: 10 }).unique().notNull(),
  name:         text('name'),
  symbol:       text('symbol'),
  exchange_rate: numeric('exchange_rate', { precision: 15, scale: 6 }),
  is_active:    boolean('is_active').default(true),
  updated_at:   timestamp('updated_at').defaultNow(),
});
