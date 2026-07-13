/**
 * @module schema-misc-app-a
 * @description Source module. See exports for details.
 */

import {
  pgTable, integer, text, boolean, timestamp, varchar, date, serial, customType, decimal, jsonb, index,
} from 'drizzle-orm/pg-core';
import { departments as canonicalDepartments, positions as canonicalPositions } from './schema-hr-lms';

const pgVector = (name: string, dim: number) =>
  customType<{ data: number[]; driverData: string }>({
    dataType: () => `vector(${dim})`,
    toDriver: (val: number[]) => `[${val.join(',')}]`,
    fromDriver: (val: string) => val.slice(1, -1).split(',').map((s) => Number(s.trim())),
  })(name);


export const appUsers = pgTable('users', {
  id: integer('id').primaryKey(),
  username: varchar('username'),
  email: varchar('email'),
  first_name: varchar('first_name'),
  last_name: varchar('last_name'),
  full_name: varchar('full_name'),
  profile_image_url: text('profile_image_url'),
  phone: varchar('phone'),
  is_active: boolean('is_active'),
  status: varchar('status'),
  department_id: integer('department_id'),
  position_id: integer('position_id'),
  employee_id: integer('employee_id'),
  birth_date: timestamp('birth_date'),
  deleted_at: timestamp('deleted_at'),
});

export const hrEmployees = pgTable('employees', {
  id:                integer('id').primaryKey(),
  user_id:           integer('user_id'),
  // Multi-tenant scope column (migration drift-fix-01-tenant-id.sql; live DB:
  // integer NOT NULL DEFAULT 1). Declared here so repository queries can
  // filter `WHERE tenant_id = <request tenant>` via getTenantId() (A93 wiring).
  tenant_id:         integer('tenant_id').notNull().default(1),
  employee_code:     varchar('employee_code'),
  first_name:        varchar('first_name'),
  last_name:         varchar('last_name'),
  middle_name:       varchar('middle_name'),
  department_id:     integer('department_id'),
  position_id:       integer('position_id'),
  org_function_id:   integer('org_function_id'),
  org_department_id: integer('org_department_id'),
  vysotskiy_category: varchar('vysotskiy_category'),
  status:            varchar('status'),
  employment_status: varchar('employment_status'),
  employment_type:   varchar('employment_type'),
  is_active:         boolean('is_active'),
  is_blocked:        boolean('is_blocked').default(false),
  blocked_reason:    text('blocked_reason'),
  telegram_chat_id:  varchar('telegram_chat_id'),
  hire_date:         date('hire_date'),
  base_salary:       decimal('base_salary', { precision: 15, scale: 2 }),
  phone_number:      varchar('phone_number'),
  email_work:        varchar('email_work'),
  gender:            varchar('gender'),
  date_of_birth:     date('date_of_birth'),
  birth_date:        date('birth_date'),
  manager_id:        integer('manager_id'),
  photo_url:                   text('photo_url'),
  role:                        varchar('role'),
  total_points:                integer('total_points').default(0),
  face_embedding:              pgVector('face_embedding', 512),
  face_embedding_updated_at:   timestamp('face_embedding_updated_at'),
  address_actual:              text('address_actual'),
  lat:                         decimal('lat', { precision: 9, scale: 6 }),
  lng:                         decimal('lng', { precision: 9, scale: 6 }),
  geo_consent:                 boolean('geo_consent').default(false),
  // hr-employees-orphan-fields (2026-07-13): EmployeeDialog.tsx form fields that had no
  // matching column — see apps/api/src/shared/db/migrations/hr-employees-orphan-fields-2026-07-13.sql
  shift:               varchar('shift'),
  salary_type:         varchar('salary_type'),
  workshop_zone:       varchar('workshop_zone'),
  attestation_date:    date('attestation_date'),
  marital_status:      varchar('marital_status'),
  children_count:      integer('children_count'),
  children_education:  varchar('children_education'),
  household_size:      integer('household_size'),
  household_members:   text('household_members'),
  housing_type:        varchar('housing_type'),
  created_at:                  timestamp('created_at'),
  updated_at:                  timestamp('updated_at'),
  deleted_at:                  timestamp('deleted_at'),
});

// hrPositions / hrDepartments: re-exported from canonical schema-hr-lms.ts.
// Legacy snake_case columns (parent_id, manager_id, is_active) are not present
// on the canonical schema — consumers referencing those need to migrate to
// camelCase or fix the column shape upstream.
export const hrPositions = canonicalPositions;
export const hrDepartments = canonicalDepartments;

export { shiftSchedules } from '@workspace/db';

// leaveRequestsApp: re-exported from the same canonical `leave_requests` Drizzle
// object as `leaveRequests` in schema-compat-2.ts (lib/db schema/leave.ts).
// Previously a second, independent pgTable('leave_requests', ...) stub with a
// snake_case field convention — two Drizzle objects for one physical table.
// Consumers keep the `leaveRequestsApp` import name but now reference the
// canonical camelCase columns (employeeId, leaveType, startDate, ... ).
export { leaveRequests as leaveRequestsApp } from '@workspace/db';

export const orgDepartments = pgTable('org_departments', {
  id: serial('id').primaryKey(),
  name: text('name'),
  name_ru: text('name_ru'),
  parent_id: integer('parent_id'),
  level: integer('level'),
  head_user_id: integer('head_user_id'),
  sort_order: integer('sort_order'),
  is_active: boolean('is_active'),
  created_at: timestamp('created_at'),
  color: varchar('color'),
  description: text('description'),
  description_ru: text('description_ru'),
  tskp: text('tskp'),
  tskp_ru: text('tskp_ru'),
  node_type: varchar('node_type'),
});

export const employeeOrgDepartments = pgTable('employee_org_departments', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id'),
  org_department_id: integer('org_department_id'),
  is_primary: boolean('is_primary'),
  assigned_at: timestamp('assigned_at'),
});

export { chatMessages, chatMembers, chatRooms } from './schema-chat';

export const razryadLevels = pgTable('razryad_levels', {
  id:             serial('id').primaryKey(),
  level:          integer('level').notNull(),
  name:           text('name').notNull(),
  nameUz:         text('name_uz'),
  nameRu:         text('name_ru'),
  coefficient:    decimal('coefficient', { precision: 4, scale: 2 }),
  minMonths:      integer('min_months').default(0),
  minRequirement: text('min_requirement'),
  salaryMin:      decimal('salary_min', { precision: 14, scale: 2 }),
  salaryMax:      decimal('salary_max', { precision: 14, scale: 2 }),
  descriptionUz:  text('description_uz'),
  description:    text('description'),
  isActive:       boolean('is_active').notNull().default(true),
  createdAt:      timestamp('created_at').defaultNow(),
  updatedAt:      timestamp('updated_at').defaultNow(),
});

/**
 * T10-03 — card_templates: lavozim-turi (position-type) KARTA shabloni.
 * Bir shablon = bir lavozim-turi uchun standart KARTA-maydon qiymatlari (`fieldDefaults` JSONB),
 * yangi org_functions kartasini urug'lash uchun. Def jonli `card_templates` (migrations-drift T10-03)
 * ga AYNAN mos. ⭐ Shablon-qiymatlari egasi-data → jadval bo'sh tug'iladi (soxta satr yo'q).
 */
export const cardTemplates = pgTable('card_templates', {
  id:            serial('id').primaryKey(),
  positionType:  text('position_type').notNull(),
  name:          text('name').notNull(),
  nameRu:        text('name_ru'),
  description:   text('description'),
  fieldDefaults: jsonb('field_defaults').$type<Record<string, unknown>>().notNull().default({}),
  isActive:      boolean('is_active').notNull().default(true),
  createdBy:     integer('created_by'),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt:     timestamp('deleted_at', { withTimezone: true }),
}, (t) => ({
  byPositionType: index('idx_card_templates_position_type').on(t.positionType),
}));

export type CardTemplateRow = typeof cardTemplates.$inferSelect;

/**
 * ЦКП kunlik FAKT-qiymat (FAZA-05). Jadval JONLI yaratilgan (apply-phase05-ckp.cjs)
 * lekin Drizzle-da deklaratsiyasiz edi — bu def jonli `information_schema.columns`
 * ga AYNAN mos (15 ustun; numeric→decimal precision/scale; notNull+default jonlidek).
 * ADDITIV: faqat tip-deklaratsiya, yozuv/migration o'zgartirilmagan (raw SQL upsert
 * org-structure/ckp-fact.repository.ts da qoladi).
 */
export const ckpFactValues = pgTable('ckp_fact_values', {
  id:             serial('id').primaryKey(),
  cardId:         integer('card_id').notNull(),
  employeeId:     integer('employee_id'),
  productId:      integer('product_id'),
  factDate:       date('fact_date').notNull(),
  targetValue:    decimal('target_value', { precision: 14, scale: 3 }),
  actualValue:    decimal('actual_value', { precision: 14, scale: 3 }),
  achievementPct: decimal('achievement_pct', { precision: 6, scale: 2 }),
  source:         text('source').notNull().default('MANUAL'),
  formulaType:    text('formula_type'),
  status:         text('status').notNull().default('submitted'),
  submittedAt:    timestamp('submitted_at'),
  notes:          text('notes'),
  recordedBy:     integer('recorded_by'),
  createdAt:      timestamp('created_at').notNull().defaultNow(),
});

/**
 * XATO-KATALOG (T10-08, EP-ORG-097). Tipik xatolar / nuqson-sabablari ro'yxati —
 * kunlik-hisobot / ЦКП-fakt / IoT-tablet formasidagi "Nima xato/sabab bo'ldi?" defect-dropdown
 * manbai. Jadval JONLI yaratilgan (migrations-drift T10-08 + apply-t10-08-error-catalog.cjs),
 * bu def jonli `information_schema.columns` ga AYNAN mos (additiv tip-deklaratsiya).
 *   - cardId NULL  = umumiy xato (hamma kartaga), NOT NULL = o'sha kartaga xos.
 *   - category     = defect-guruh (sifat / deadline / material / qayta-ishlash / ...).
 * Yozuv/CRUD org-structure/error-catalog.repository.ts da (raw parametrlangan SQL).
 */
export const errorCatalog = pgTable('error_catalog', {
  id:          serial('id').primaryKey(),
  cardId:      integer('card_id'),
  code:        text('code'),
  name:        text('name').notNull(),
  nameRu:      text('name_ru'),
  category:    text('category'),
  severity:    text('severity'),
  description: text('description'),
  sortOrder:   integer('sort_order').notNull().default(0),
  isActive:    boolean('is_active').notNull().default(true),
  createdBy:   integer('created_by'),
  createdAt:   timestamp('created_at').notNull().defaultNow(),
  updatedAt:   timestamp('updated_at').notNull().defaultNow(),
  deletedAt:   timestamp('deleted_at'),
});
