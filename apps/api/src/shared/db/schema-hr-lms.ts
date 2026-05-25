/**
 * @module schema-hr-lms
 * @description HR / LMS tables. Canonical sources re-exported from @workspace/db
 * where available; local definitions kept for tables not yet in lib/db or
 * tables with FK dependencies on local uuid-PK employees.
 */

// ─── Canonical re-exports from @workspace/db ────────────────────────────────
// leave_requests → lib/db: leave.ts (pgTable "leave_requests", as leaveRequests)

export { leaveRequests as leave_requests } from '@workspace/db';

// ─── Local definitions ──────────────────────────────────────────────────────

import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  decimal,
  integer,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import {
  employeeStatusEnum,
  payrollStatusEnum,
  lmsEnrollmentStatusEnum,
  attendanceStatusEnum,
} from './schema-enums';
import { users } from './schema-core';

// ============================================================================
// HR (Human Resources)
// ============================================================================

export const employees = pgTable(
  'employees',
  {
    id: uuid('id').primaryKey().$defaultFn(() => createId()),
    user_id: uuid('user_id')
      .unique()
      .references(() => users.id, { onDelete: 'set null' }),
    full_name: text('full_name').notNull(),
    position: text('position').notNull(),
    department: text('department').notNull(),
    salary_base: decimal('salary_base', { precision: 15, scale: 2 }).notNull(),
    hire_date: timestamp('hire_date', { withTimezone: true }).notNull(),
    status: employeeStatusEnum('status').notNull().default('active'),
    inps_rate: decimal('inps_rate', { precision: 5, scale: 2 }).default('0.12'),
    jshd_rate: decimal('jshd_rate', { precision: 5, scale: 2 }).default('0.01'),
    performance_score: decimal('performance_score', { precision: 5, scale: 2 }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('employees_user_id_idx').on(table.user_id),
    index('employees_department_idx').on(table.department),
    index('employees_status_idx').on(table.status),
  ],
);

export const attendance = pgTable(
  'attendance',
  {
    id: uuid('id').primaryKey().$defaultFn(() => createId()),
    employee_id: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    date: text('date').notNull(),
    check_in: timestamp('check_in', { withTimezone: true }),
    check_out: timestamp('check_out', { withTimezone: true }),
    hours_worked: decimal('hours_worked', { precision: 5, scale: 2 }),
    status: attendanceStatusEnum('status').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('attendance_employee_id_idx').on(table.employee_id),
    index('attendance_date_idx').on(table.date),
    index('attendance_status_idx').on(table.status),
  ],
);

export const payroll = pgTable(
  'payroll',
  {
    id: uuid('id').primaryKey().$defaultFn(() => createId()),
    employee_id: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    period: text('period').notNull(),
    gross_salary: decimal('gross_salary', { precision: 15, scale: 2 }).notNull(),
    inps_deduction: decimal('inps_deduction', { precision: 15, scale: 2 }).notNull(),
    jshd_deduction: decimal('jshd_deduction', { precision: 15, scale: 2 }).notNull(),
    net_salary: decimal('net_salary', { precision: 15, scale: 2 }).notNull(),
    paid_at: timestamp('paid_at', { withTimezone: true }),
    status: payrollStatusEnum('status').notNull().default('pending'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('payroll_employee_id_idx').on(table.employee_id),
    index('payroll_period_idx').on(table.period),
    index('payroll_status_idx').on(table.status),
  ],
);

// ============================================================================
// LMS (Learning Management System)
// ============================================================================

export const lms_courses = pgTable(
  'lms_courses',
  {
    id: uuid('id').primaryKey().$defaultFn(() => createId()),
    title: text('title').notNull(),
    description: text('description'),
    category: text('category'),
    is_mandatory: boolean('is_mandatory').default(false),
    passing_score: integer('passing_score').default(80),
    created_by: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('lms_courses_category_idx').on(table.category),
    index('lms_courses_is_mandatory_idx').on(table.is_mandatory),
  ],
);

export const lms_enrollments = pgTable(
  'lms_enrollments',
  {
    id: uuid('id').primaryKey().$defaultFn(() => createId()),
    course_id: uuid('course_id')
      .notNull()
      .references(() => lms_courses.id, { onDelete: 'cascade' }),
    user_id: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: lmsEnrollmentStatusEnum('status').notNull(),
    score: integer('score'),
    completed_at: timestamp('completed_at', { withTimezone: true }),
    certificate_expires_at: timestamp('certificate_expires_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('lms_enrollments_course_id_idx').on(table.course_id),
    index('lms_enrollments_user_id_idx').on(table.user_id),
    index('lms_enrollments_status_idx').on(table.status),
  ],
);

// ============================================================================
// CORE — Organizational Structure
// ============================================================================

export const departments = pgTable('departments', {
  id: uuid('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  code: text('code').unique().notNull(),
  headId: text('head_id'),
  parentId: uuid('parent_id'),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const positions = pgTable('positions', {
  id: uuid('id').primaryKey().$defaultFn(() => createId()),
  title: text('title').notNull(),
  code: text('code').unique().notNull(),
  departmentId: uuid('department_id').references(() => departments.id),
  level: integer('level').notNull().default(1),
  minSalary: decimal('min_salary', { precision: 18, scale: 2 }).notNull().default('0'),
  maxSalary: decimal('max_salary', { precision: 18, scale: 2 }).notNull().default('0'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const user_panels = pgTable('user_panels', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').unique().notNull(),
  name: text('name').notNull().default('My Dashboard'),
  // Layout stored as JSONB so the API can write/read structured PanelLayout[] directly.
  layout: jsonb('layout').notNull().default([]),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// LMS — Support Tickets
// ============================================================================

export const lms_support_tickets = pgTable('lms_support_tickets', {
  id:         uuid('id').primaryKey().$defaultFn(() => createId()),
  subject:    text('subject').notNull(),
  message:    text('message').notNull(),
  priority:   text('priority').default('medium'), // low | medium | high
  status:     text('status').default('open'),      // open | in_progress | resolved
  created_by: text('created_by'),
  resolved_at: timestamp('resolved_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
