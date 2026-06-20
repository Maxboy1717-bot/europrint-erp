/**
 * @module schema-pp
 * @description Production Planning (PP) module canonical Drizzle tables.
 *              Created per P3-27 to host pgTable declarations that previously
 *              lived inside `apps/api/src/modules/pp/infrastructure/`.
 *              Domain/infra files must IMPORT from here — never re-declare.
 *
 * NOTE: This file declares `ppWorkCenters` (serial int id, richer column set
 *       used by the DDD WorkCenter aggregate). It coexists with the looser
 *       `workCenters` stub in `schema-compat-3.ts` and the uuid-keyed
 *       `work_centers` in `schema-manufacturing.ts`; Drizzle permits multiple
 *       JS bindings against the same physical table.
 */

import { pgTable, serial, integer, varchar, boolean, timestamp, index, numeric } from 'drizzle-orm/pg-core';

export const ppWorkCenters = pgTable(
  'work_centers',
  {
    id:                        serial('id').primaryKey(),
    code:                      varchar('code', { length: 100 }).unique().notNull(),
    name:                      varchar('name', { length: 255 }).notNull(),
    type:                      varchar('type', { length: 50 }).notNull().default('machine'),
    capacity:                  integer('capacity').notNull().default(8),
    certificationLmsCourseId:  integer('certification_lms_course_id'),
    departmentId:              integer('department_id'),
    isActive:                  boolean('is_active').default(true),
    nameRu:                    varchar('name_ru', { length: 255 }),
    nameUz:                    varchar('name_uz', { length: 255 }),
    requiredSkillName:         varchar('required_skill_name', { length: 255 }),
    costPerHour:               numeric('cost_per_hour'),
    createdAt:                 timestamp('created_at').defaultNow(),
    deletedAt:                 timestamp('deleted_at'),
  },
  (table) => [
    index('work_centers_code_idx').on(table.code),
    index('work_centers_type_idx').on(table.type),
    index('work_centers_is_active_idx').on(table.isActive),
  ],
);
