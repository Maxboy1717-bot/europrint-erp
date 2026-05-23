/**
 * @module schema-business-c-2-hr-payroll
 * @description HR salary history, payroll periods, attendance, 360 feedback,
 *   health checkups, conflict reports, 360 assessments.
 *   Split out of schema-business-c-2 to respect the 300-line budget.
 */

import {
  pgTable, serial, text, integer, timestamp, numeric, date,
} from 'drizzle-orm/pg-core';

// salary_history: used with snake_case columns (base_salary) in finance-actions.repository.ts
// Canonical salaryHistory uses camelCase — kept as local stub.
export const salary_history = pgTable('salary_history', {
  id:                    serial('id').primaryKey(),
  employee_id:           integer('employee_id').notNull(),
  salary_period_start:   date('salary_period_start'),
  salary_period_end:     date('salary_period_end'),
  base_salary:           numeric('base_salary', { precision: 15, scale: 2 }),
  salary_earned:         numeric('salary_earned', { precision: 15, scale: 2 }),
  total_bonuses:         numeric('total_bonuses', { precision: 15, scale: 2 }).default('0'),
  other_bonuses:         numeric('other_bonuses', { precision: 15, scale: 2 }).default('0'),
  created_at:            timestamp('created_at').defaultNow(),
  updated_at:            timestamp('updated_at').defaultNow(),
});

// payroll_periods_hr: used with snake_case columns (period_name etc.) in drizzle-hr.repo.ts
// Canonical payrollPeriods uses camelCase — kept as local stub.
export const payroll_periods_hr = pgTable('payroll_periods', {
  id:                    serial('id').primaryKey(),
  period_name:           text('period_name'),
  period_start_date:     date('period_start_date'),
  period_end_date:       date('period_end_date'),
  status:                text('status').default('open'),
  total_payroll_amount:  numeric('total_payroll_amount', { precision: 15, scale: 2 }),
  employee_count:        integer('employee_count').default(0),
  closed_at:             timestamp('closed_at'),
  created_at:            timestamp('created_at').defaultNow(),
  updated_at:            timestamp('updated_at').defaultNow(),
});

// hr_attendance: used with snake_case columns (status) in drizzle-hr-leave.repo.ts
// Canonical attendance uses camelCase — kept as local stub.
export const hr_attendance = pgTable('attendance', {
  id:                   serial('id').primaryKey(),
  employee_id:          integer('employee_id'),
  attendance_date:      date('attendance_date'),
  check_in_time:        text('check_in_time'),
  check_out_time:       text('check_out_time'),
  status:               text('status').default('present'),
  late_minutes:         integer('late_minutes').default(0),
  early_leave_minutes:  integer('early_leave_minutes').default(0),
  overtime_minutes:     integer('overtime_minutes').default(0),
  source:               text('source'),
  created_at:           timestamp('created_at').defaultNow(),
  updated_at:           timestamp('updated_at').defaultNow(),
});

// hr_360_feedback: NOT in lib/db barrel — kept as local stub.
export const hr_360_feedback = pgTable('hr_360_feedback', {
  id:           serial('id').primaryKey(),
  employee_id:  integer('employee_id'),
  order_id:     integer('order_id'),
  session_id:   text('session_id'),
  quantity:     numeric('quantity', { precision: 10, scale: 2 }),
  defect_rate:  numeric('defect_rate', { precision: 7, scale: 4 }),
  oee:          numeric('oee', { precision: 7, scale: 4 }),
  recorded_at:  timestamp('recorded_at').defaultNow(),
});

// hr_health_checkups: used with snake_case columns in drizzle-hr.repo.ts
// Canonical hrHealthCheckups uses camelCase — kept as local stub.
export const hr_health_checkups = pgTable('hr_health_checkups', {
  id:                serial('id').primaryKey(),
  department_id:     integer('department_id'),
  department_name:   text('department_name'),
  total_employees:   integer('total_employees').default(0),
  examined_count:    integer('examined_count').default(0),
  last_checkup_date: date('last_checkup_date'),
  next_checkup_date: date('next_checkup_date'),
  status:            text('status').default('pending'),
  updated_at:        timestamp('updated_at').defaultNow(),
});

// hr_conflict_reports: used with snake_case columns in hr-compat-a.repository.ts
// Canonical hrConflictReports uses camelCase — kept as local stub.
export const hr_conflict_reports = pgTable('hr_conflict_reports', {
  id:          serial('id').primaryKey(),
  party1:      text('party1'),
  party2:      text('party2'),
  description: text('description'),
  severity:    text('severity').default('low'),
  status:      text('status').default('open'),
  resolved_at: timestamp('resolved_at'),
  created_at:  timestamp('created_at').defaultNow(),
});

// employee_360_assessments: used with snake_case columns in hr-employees-ext.repository.ts
// Canonical employee360Assessments uses camelCase — kept as local stub.
export const employee_360_assessments = pgTable('employee_360_assessments', {
  id:                    serial('id').primaryKey(),
  employee_id:           integer('employee_id'),
  assessment_period:     text('assessment_period'),
  assessment_year:       integer('assessment_year'),
  self_rating:           numeric('self_rating', { precision: 4, scale: 2 }),
  manager_rating:        numeric('manager_rating', { precision: 4, scale: 2 }),
  peer_rating:           numeric('peer_rating', { precision: 4, scale: 2 }),
  average_rating:        numeric('average_rating', { precision: 4, scale: 2 }),
  strengths:             text('strengths'),
  areas_for_improvement: text('areas_for_improvement'),
  status:                text('status').default('pending'),
  created_at:            timestamp('created_at').defaultNow(),
  updated_at:            timestamp('updated_at').defaultNow(),
});
