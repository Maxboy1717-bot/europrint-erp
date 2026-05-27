/**
 * @module schema-compat-1a
 * @description Source module. See exports for details.
 */

import { date } from 'drizzle-orm/pg-core';
import { pgTable, uuid, text, boolean, decimal, integer, varchar, createId, ts } from './schema-compat-helpers';

export const users = pgTable('users', {
  id: integer('id').primaryKey(),
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

export const crmLeads = pgTable('crm_leads', {
  id:                 integer('id').primaryKey(),
  // CRM-1: title NOT NULL in canonical schema — exposed here so DDD-layer save() can set it
  title:              text('title'),
  customer_id:        integer('customer_id'),
  manager_id:         integer('manager_id'),
  status:             varchar('status', { length: 50 }).default('new'),
  status_description: varchar('status_description', { length: 200 }),
  source:             varchar('source', { length: 50 }),
  contact_name:       varchar('contact_name', { length: 200 }),
  contact_phone:      varchar('contact_phone', { length: 50 }),
  contact_email:      varchar('contact_email', { length: 200 }),
  notes:              text('notes'),
  deleted_at:         ts('deleted_at'),
  created_at:         ts('created_at').defaultNow(),
  updated_at:         ts('updated_at').defaultNow(),
});

export const crmDeals = pgTable('crm_deals', {
  id:              integer('id').primaryKey(),
  lead_id:         integer('lead_id'),
  company_id:      text('company_id'),
  name:            text('name'),
  title:           text('title'),
  status:          text('status').default('open'),
  amount:          decimal('amount', { precision: 18, scale: 2 }),
  expected_amount: decimal('expected_amount', { precision: 18, scale: 2 }),
  assigned_to:     integer('assigned_to'),
  created_by:      integer('created_by'),
  created_at:      ts('created_at').defaultNow(),
  updated_at:      ts('updated_at').defaultNow(),
  deleted_at:      ts('deleted_at'),
  metadata:        text('metadata'),
  stage_id:        integer('stage_id'),
});

export const crmContacts = pgTable('crm_contacts', {
  id:         integer('id').primaryKey(),
  company_id: integer('company_id'),
  first_name: text('first_name'),
  last_name:  text('last_name'),
  email:      text('email'),
  phone:      text('phone'),
  position:   text('position'),
  notes:      text('notes'),
  created_at: ts('created_at').defaultNow(),
  updated_at: ts('updated_at').defaultNow(),
  deleted_at: ts('deleted_at'),
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
