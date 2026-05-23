/**
 * @module hr-overtime-schema
 * @description Drizzle ORM schema for HR overtime policy, employee separation,
 *              and HR leave balances.
 *
 * Tables:
 *  - overtime_policy      — company-configurable OT multipliers and night-shift rules
 *  - employee_separation  — voluntary/involuntary departure records with tenure
 *  - hr_leave_balances    — per-employee yearly leave quota tracking
 *
 * Canonical source: apps/api/src/shared/db/schema-hr-overtime.ts
 *                   apps/api/src/shared/db/schema-ext-b-2.ts
 */

import {
  pgTable,
  uuid,
  text,
  boolean,
  numeric,
  integer,
  serial,
  timestamp,
  check,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// ─── 1. overtime_policy ───────────────────────────────────────────────────────
// Company-configurable overtime multipliers. No Uzbek law hardcoded.
// DB invariants:
//   regular_multiplier  >= 1.0
//   extended_multiplier >= regular_multiplier
//   night_shift_start_hour IN [0, 23]
//   night_shift_end_hour   IN [0, 23]

export const overtimePolicy = pgTable(
  'overtime_policy',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),

    name:     text('name').notNull(),
    isActive: boolean('is_active').notNull().default(true),

    regularOvertimeHours: numeric('regular_overtime_hours', { precision: 4, scale: 1 })
      .notNull()
      .default('2'),

    regularMultiplier: numeric('regular_multiplier', { precision: 4, scale: 2 })
      .notNull()
      .default('1.5'),

    extendedMultiplier: numeric('extended_multiplier', { precision: 4, scale: 2 })
      .notNull()
      .default('2.0'),

    weekendMultiplier: numeric('weekend_multiplier', { precision: 4, scale: 2 })
      .notNull()
      .default('2.0'),

    nightShiftBonus: numeric('night_shift_bonus', { precision: 4, scale: 2 })
      .notNull()
      .default('0.5'),

    nightShiftStartHour: integer('night_shift_start_hour').notNull().default(22),
    nightShiftEndHour:   integer('night_shift_end_hour').notNull().default(6),

    effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull(),
    createdBy:     uuid('created_by'),
    createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [
    check('chk_ot_multiplier_pos',   sql`${t.regularMultiplier} >= 1.0`),
    check('chk_ot_ext_gt_reg',       sql`${t.extendedMultiplier} >= ${t.regularMultiplier}`),
    check('chk_ot_night_start',      sql`${t.nightShiftStartHour} >= 0 AND ${t.nightShiftStartHour} <= 23`),
    check('chk_ot_night_end',        sql`${t.nightShiftEndHour} >= 0 AND ${t.nightShiftEndHour} <= 23`),
    index('idx_ot_policy_active').on(t.isActive, t.effectiveFrom),
  ],
);

// ─── 2. employee_separation ───────────────────────────────────────────────────
// DB invariants:
//   tenure_months >= 0

export const employeeSeparation = pgTable(
  'employee_separation',
  {
    id:             uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    employeeId:     uuid('employee_id').notNull(),
    separationDate: timestamp('separation_date', { withTimezone: true }).notNull(),
    reason:         text('reason').notNull(),
    isRegretted:    boolean('is_regretted').notNull().default(false),
    tenureMonths:   integer('tenure_months').notNull(),
    department:     text('department'),
    createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [
    check('chk_separation_tenure_nonneg', sql`${t.tenureMonths} >= 0`),
    index('idx_separation_employee').on(t.employeeId, t.separationDate),
  ],
);

// ─── 3. hr_leave_balances ─────────────────────────────────────────────────────
// Per-employee yearly leave quota (days used / remaining).

export const hrLeaveBalances = pgTable('hr_leave_balances', {
  id:            serial('id').primaryKey(),
  employeeId:    integer('employee_id'),
  leaveType:     text('leave_type'),
  year:          integer('year'),
  totalDays:     integer('total_days').default(0),
  usedDays:      integer('used_days').default(0),
  remainingDays: integer('remaining_days').default(0),
  updatedAt:     timestamp('updated_at').defaultNow(),
});

// ── Insert schemas ─────────────────────────────────────────────────────────────
export const insertOvertimePolicySchema      = createInsertSchema(overtimePolicy).omit({ id: true, createdAt: true } as never);
export const insertEmployeeSeparationSchema  = createInsertSchema(employeeSeparation).omit({ id: true, createdAt: true } as never);
export const insertHrLeaveBalanceSchema      = createInsertSchema(hrLeaveBalances).omit({ id: true } as never);

// ── Types ──────────────────────────────────────────────────────────────────────
export type OvertimePolicy        = typeof overtimePolicy.$inferSelect;
export type InsertOvertimePolicy  = z.infer<typeof insertOvertimePolicySchema>;
export type EmployeeSeparation    = typeof employeeSeparation.$inferSelect;
export type InsertEmployeeSeparation = z.infer<typeof insertEmployeeSeparationSchema>;
export type HrLeaveBalance        = typeof hrLeaveBalances.$inferSelect;
export type InsertHrLeaveBalance  = z.infer<typeof insertHrLeaveBalanceSchema>;
