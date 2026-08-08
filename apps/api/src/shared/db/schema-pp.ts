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
    // T12-04: KARTA (org-tuzilma) bog'lanishi — ish markazi qaysi org_departments KARTA-siga
    // tegishli (FK fk_work_centers_org_dept -> org_departments.id). Qiymat egasi-DATA (qaysi karta),
    // bu Drizzle binding faqat YOZUV-YO'LINI ochadi (struktura; Q-40). Hozir 12 work_center'da NULL.
    orgDepartmentId:           integer('org_department_id'),
    isActive:                  boolean('is_active').default(true),
    nameRu:                    varchar('name_ru', { length: 255 }),
    nameUz:                    varchar('name_uz', { length: 255 }),
    requiredSkillName:         varchar('required_skill_name', { length: 255 }),
    sexCode:                   varchar('sex_code', { length: 50 }),
    departmentKind:            varchar('department_kind', { length: 10 }),
    costPerHour:               numeric('cost_per_hour'),
    // Wave 4 (500K build): per-sex norma/brak/crew parametrlar (struktura; qiymatlar egasi-DATA, Q-40).
    normaM2PerShift:           numeric('norma_m2_per_shift'),
    normaKgPerShift:           numeric('norma_kg_per_shift'),
    brakLimitPct:              numeric('brak_limit_pct'),
    minCrewSize:               integer('min_crew_size'),
    maxCrewSize:               integer('max_crew_size'),
    unitPreference:            varchar('unit_preference', { length: 10 }).notNull().default('m2'),
    createdAt:                 timestamp('created_at').defaultNow(),
    deletedAt:                 timestamp('deleted_at'),
  },
  (table) => [
    index('work_centers_code_idx').on(table.code),
    index('work_centers_type_idx').on(table.type),
    index('work_centers_is_active_idx').on(table.isActive),
  ],
);
