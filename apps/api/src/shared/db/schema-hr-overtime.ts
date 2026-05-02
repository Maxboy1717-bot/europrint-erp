/**
 * schema-hr-overtime.ts — TZ-46: Konfiguratsiyalanadigan OT siyosati jadvali
 *
 * overtime_policy — KOMPANIYA konfiguratsiyasi.
 * Hech qanday O'zbek qonunchiligi hardcoded emas.
 * Barcha koeffitsientlar kompaniya tomonidan sozlanadi.
 *
 * DB invariantlar:
 *   regular_multiplier   >= 1.0
 *   extended_multiplier  >= regular_multiplier
 *   night_shift_start_hour IN [0, 23]
 *   night_shift_end_hour   IN [0, 23]
 */

import {
  pgTable,
  uuid,
  text,
  boolean,
  numeric,
  integer,
  timestamp,
  check,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const overtime_policy = pgTable(
  'overtime_policy',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),

    name: text('name').notNull(),
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
    nightShiftEndHour: integer('night_shift_end_hour').notNull().default(6),

    effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull(),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    chkMultiplierPos: check(
      'chk_ot_multiplier_pos',
      sql`${t.regularMultiplier} >= 1.0`,
    ),
    chkExtGtReg: check(
      'chk_ot_ext_gt_reg',
      sql`${t.extendedMultiplier} >= ${t.regularMultiplier}`,
    ),
    chkNightStart: check(
      'chk_ot_night_start',
      sql`${t.nightShiftStartHour} >= 0 AND ${t.nightShiftStartHour} <= 23`,
    ),
    chkNightEnd: check(
      'chk_ot_night_end',
      sql`${t.nightShiftEndHour} >= 0 AND ${t.nightShiftEndHour} <= 23`,
    ),
    idxActive: index('idx_ot_policy_active').on(t.isActive, t.effectiveFrom),
  }),
);

/**
 * employee_separation — TZ-44: Xodim ketish sabablari va staj
 *
 * DB invariantlar:
 *   tenure_months >= 0
 */
export const employee_separation = pgTable(
  'employee_separation',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    employeeId: uuid('employee_id').notNull(),
    separationDate: timestamp('separation_date', { withTimezone: true }).notNull(),
    reason: text('reason').notNull(),
    isRegretted: boolean('is_regretted').notNull().default(false),
    tenureMonths: integer('tenure_months').notNull(),
    department: text('department'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    chkTenureNonneg: check(
      'chk_separation_tenure_nonneg',
      sql`${t.tenureMonths} >= 0`,
    ),
    idxEmployee: index('idx_separation_employee').on(t.employeeId, t.separationDate),
  }),
);
