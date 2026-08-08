/**
 * @deprecated 2026-05-27
 * This file is a compatibility shim. Do NOT add new features here.
 * Canonical replacement: `lib/db/src/schema/users.ts (integer PK, 17-col legacy)`
 * Existing consumers continue to work. New code must import from the canonical file.
 * See: docs/modules/hr-employees.md
 */
/**
 * @module schema-compat-1a
 * @description Source module. See exports for details.
 */

import { date } from 'drizzle-orm/pg-core';
import { pgTable, uuid, text, boolean, decimal, integer, varchar, jsonb, createId, ts, serial } from './schema-compat-helpers';

// APPROVED: egasi ikki-dunyo-tuzatish 2026-07-02 — `id` uses `serial()` (not
// plain `integer()`) so Drizzle marks it optional on INSERT, matching the
// live DB's `nextval('users_id_seq')` default (no app-side id generation).
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  username: text('username').notNull(),
  passwordHash: text('password_hash').notNull(),
  fullName: text('full_name'),
  status: text('status').default('active'),
  role: text('role').notNull().default('employee'),
  isActive: boolean('is_active').notNull().default(true),
  phone: text('phone'),
  departmentId: integer('department_id'),
  positionId: integer('position_id'),
  lastLoginAt: ts('last_login_at'),
  failedLoginAttempts: integer('failed_login_attempts').default(0),
  lockUntil: ts('locked_until'),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
  deletedAt: ts('deleted_at'),
});

// CRM-LEAD DRIFT FIX (2026-06-01): the live crm_leads table is a Bitrix-style schema.
// This compat def previously declared columns that DON'T exist in the live DB
// (status, customer_id, manager_id, source, notes, created_at, updated_at) →
// every db.select().from(crmLeads) emitted those names → 'column does not exist' →
// /api/crm/leads 503. Fixed by ALIASING each JS property to the real live column
// (property name kept → consumers untouched). Same pattern crmCompanies already uses
// (created_at → date_create). customer_id removed (lead has no company FK in Bitrix;
// the link is created at conversion time into sd_customers).
export const crmLeads = pgTable('crm_leads', {
  id:                 integer('id').primaryKey(),
  // title NOT NULL in live DB — exposed so DDD-layer save() + auto-lead inserts set it
  title:              text('title'),
  manager_id:         integer('assigned_to'),         // live: assigned_to
  // Item A row-scoping — CORRECTED 2026-07-11 (owner interview log; see
  // apps/api/src/modules/crm/common/crm-row-scope.ts module doc comment): assigned_to (exposed
  // above as `manager_id`, confusingly) was declared canonical for CRM ownership but that is
  // superseded — authorization now resolves COALESCE(assigned_by_id, manager_id) on the REAL
  // physical columns. This property exposes the real assigned_by_id column, which was previously
  // undeclared here (so any write to it was silently dropped by Drizzle — same footgun as
  // created_by_id below), so drizzle-crm-leads.repo.ts can populate it going forward.
  assigned_by_id:     integer('assigned_by_id'),       // live: assigned_by_id
  // B14 (2026-07-05): live column exists (created_by_id) but was never declared here,
  // so Drizzle silently dropped it on every insert/select — same alias pattern as
  // crmDeals.created_by below.
  created_by:         integer('created_by_id'),        // live: created_by_id (alias)
  status_id:          varchar('status_id', { length: 50 }).default('NEW'), // Bitrix state NEW/CONVERTED
  status_description: varchar('status_description', { length: 200 }), // lifecycle code new/converted/qualified
  source:             text('source_description'),      // live: source_description
  contact_name:       varchar('contact_name', { length: 200 }),
  contact_phone:      varchar('contact_phone', { length: 50 }),
  contact_email:      varchar('contact_email', { length: 200 }),
  notes:              text('comments'),                // live: comments
  // Marketing-14 #59/#67 (2026-07-11): product category the lead is interested in —
  // ofset/gofra/etiketka/flekso/blanka (CHECK-constrained in the migration; nullable
  // here for the same reason it's nullable in the DB — see migration comment).
  product_type:       text('product_type'),
  // EP-MKT-102 (owner-approved, docs/audit/decisions/14-marketing.md:733-738, action:
  // CREATE) — Marketing #80 "Hudud+eksport belgisi": lid hududi (viloyat/davlat) +
  // eksport/ichki belgisi. Additive; nullable region + default-false is_export
  // (Q-39/Q-46 safe — no existing caller reads/writes these names).
  region:             text('region'),
  is_export:          boolean('is_export').notNull().default(false),
  deleted_at:         ts('deleted_at'),
  created_at:         ts('date_create').defaultNow(),  // live: date_create
  updated_at:         ts('date_modify').defaultNow(),  // live: date_modify
});

// CRM-DEAL DRIFT FIX (2026-06-01): live crm_deals is Bitrix-style. Phantom columns
// (lead_id, name, status, expected_amount, assigned_to, created_by, created_at,
// updated_at) removed/aliased to the real live columns. lead_id has NO live column —
// the lead→deal link is stored in metadata (jsonb) at conversion time.
export const crmDeals = pgTable('crm_deals', {
  id:              integer('id').primaryKey(),
  company_id:      integer('company_id'),                    // live: integer (was text)
  title:           text('title'),                            // 'name' removed — collided with title; use title
  // App business status (qualification/proposal/negotiation/won/lost/open) → free-form
  // live `stage_id` column. NOT stage_semantic_id: that Bitrix column has a CHECK limiting
  // it to {process,success,fail}, which the app's fine-grained statuses violate. stage_id
  // has no CHECK and round-trips business values, so all `crmDeals.status` filters
  // (= 'won'/'open'/'lost') keep working. stage_semantic_id is left to Bitrix (nullable).
  status:          varchar('stage_id', { length: 50 }),      // live: stage_id (free-form business status)
  amount:          decimal('amount', { precision: 18, scale: 2 }),         // live: amount (nullable bolt-on)
  opportunity:     decimal('opportunity', { precision: 18, scale: 2 }),     // live: opportunity NOT NULL (Bitrix canonical deal value)
  expected_amount: decimal('forecast_amount', { precision: 18, scale: 2 }), // live: forecast_amount (alias)
  assigned_to:     integer('assigned_by_id'),                // live: assigned_by_id (alias)
  created_by:      integer('created_by_id'),                 // live: created_by_id (alias)
  currency_id:     varchar('currency_id', { length: 3 }),    // live: currency_id (was phantom 'currency')
  close_date:      varchar('close_date', { length: 10 }),    // live: varchar(10) (was phantom 'expected_closure_date')
  additional_info: text('additional_info'),                  // live: additional_info (was phantom 'description')
  created_at:      ts('date_create').defaultNow(),           // live: date_create (alias)
  updated_at:      ts('date_modify').defaultNow(),           // live: date_modify (alias)
  deleted_at:      ts('deleted_at'),
  metadata:        jsonb('metadata').$type<Record<string, unknown>>(), // live: jsonb (was text); holds lead_id
  // NOTE: no separate `stage_id` property — it would collide with `status` above (same
  // DB column). Read the stage via `crmDeals.status`.
});

// CRM-CONTACT DRIFT FIX (2026-06-01): live crm_contacts is Bitrix-style (canonical def
// lives in lib/db/src/schema/crm-contacts.ts). This compat def declared phantom columns
// (first_name, email, phone, position, notes, created_at, updated_at). Aliased to the real
// columns (name, post, comments, date_create, date_modify). email/phone have NO scalar
// column — live stores them in emails/phones jsonb arrays of {value,...}; the serving repos
// flatten on read (emails->0->>'value') and wrap on write ([{value}]).
export const crmContacts = pgTable('crm_contacts', {
  id:             integer('id').primaryKey(),
  company_id:     integer('company_id'),
  first_name:     text('name'),                                            // live: name (alias)
  last_name:      text('last_name'),
  full_name:      text('full_name'),                                       // live: full_name (real)
  emails:         jsonb('emails').$type<Array<{ value: string; type?: string }>>(),  // live: jsonb array
  phones:         jsonb('phones').$type<Array<{ value: string; type?: string }>>(),  // live: jsonb array
  position:       varchar('post', { length: 255 }),                        // live: post (alias)
  notes:          text('comments'),                                        // live: comments (alias)
  lead_id:        integer('lead_id'),                                      // live: lead_id (real)
  assigned_by_id: integer('assigned_by_id'),                               // live: assigned_by_id (real)
  created_at:     ts('date_create').defaultNow(),                          // live: date_create (alias)
  updated_at:     ts('date_modify').defaultNow(),                          // live: date_modify (alias)
  deleted_at:     ts('deleted_at'),
});

export const crmCompanies = pgTable('crm_companies', {
  id:           integer('id').primaryKey(),
  title:        text('title').notNull(),
  status:       text('status').notNull().default('active'),
  industry:     text('industry'),
  website:      text('websites'),
  inn:          text('stir'),
  address:      text('address'),
  credit_limit: decimal('credit_limit').default('0'),
  used_credit:  decimal('credit_used').default('0'),
  // Financial/risk fields (columns already added live via migrations-drift.ts
  // + drift-fix-04a-missing-cols.sql). Not previously mapped here, so
  // db.select().from(crmCompanies) silently omitted them from getCompany()
  // (VISION-3340 #29 — Customer 360 financial status block).
  is_blocked:   boolean('is_blocked').notNull().default(false),
  block_reason: text('block_reason'),
  open_debt:    decimal('open_debt'),
  created_at:   ts('date_create').defaultNow(),
  deleted_at:   ts('deleted_at'),
  updated_at:   ts('date_modify').defaultNow(),
});

export const crmPipelines = pgTable('crm_pipelines', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  sort: integer('sort').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: ts('created_at').defaultNow(),
});

export const crmStages = pgTable('crm_stages', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  categoryId: integer('category_id'),
  sort: integer('sort').default(0),
  probability: integer('probability').default(0),
  createdAt: ts('created_at').defaultNow(),
});

export const candidates = pgTable('candidates', {
  id:          integer('id').primaryKey(),
  vacancy_id:  integer('vacancy_id'),
  first_name:  text('first_name'),
  last_name:   text('last_name'),
  email:       text('email'),
  phone:       text('phone'),
  full_name:   text('full_name'),
  status:      text('status').default('applied'),
  rating:      integer('rating'),
  is_archived: boolean('is_archived').default(false),
  source:      text('source'),
  resume_url:  text('resume_url'),
  created_at:  ts('created_at').defaultNow(),
  updated_at:  ts('updated_at').defaultNow(),
  deleted_at:  ts('deleted_at'),
});

export const vacancies = pgTable('vacancies', {
  id: integer('id').primaryKey(),
  title: text('title').notNull(),
  department: text('department'),
  department_id: integer('department_id'),
  status: text('status').notNull().default('open'),
  isActive: boolean('is_active').default(true),
  requirements: text('requirements'),
  closing_date: date('closing_date'),
  createdAt: ts('created_at').defaultNow(),
  closedAt: ts('closed_at'),
  description: text('description'),
});

export const hrCandidateFunnels = pgTable('hr_candidate_funnels', {
  id: integer('id').primaryKey(),
  candidateId: integer('candidate_id').notNull(),
  vacancyId: integer('vacancy_id'),
  funnelId: integer('funnel_id'),
  funnelStage: text('funnel_stage').notNull().default('applied'),
  productivityCategory: text('productivity_category'),
  source: text('source'),
  assignedRecruiterId: integer('assigned_recruiter_id'),
  isActive: boolean('is_active').default(true),
  notes: text('notes'),
  metadata: text('metadata'),
  screeningScore: decimal('screening_score', { precision: 5, scale: 2 }),
  initialScreeningNotes: text('initial_screening_notes'),
  quickRejectionReason: text('quick_rejection_reason'),
  rejectedAt: ts('rejected_at'),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
  hiredAt: ts('hired_at'),
  isQuickRejected: boolean('is_quick_rejected').default(false),
});
