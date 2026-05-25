/**
 * @module schema-misc-app-b
 * @description Source module. See exports for details.
 */

import {
  pgTable, integer, text, boolean, timestamp, varchar, date,
} from 'drizzle-orm/pg-core';
import { accounts as canonicalAccounts } from './schema-ext-b-1';

export { chatReactions, chatPolls, chatPollVotes, chatMessageTasks } from './schema-chat';

export const hrAttendance = pgTable('attendance', {
  id: integer('id').primaryKey(),
  employee_id: integer('employee_id'),
  check_in: timestamp('check_in'),
  check_out: timestamp('check_out'),
  status: varchar('status'),
  created_at: timestamp('created_at'),
});

// lmsTestAttempts: redirect to canonical schema-ext-b-1.ts (superset columns: + course_id).
// Consumers only access id/test_id/score/passed via raw sql templates — type-safe.
export { lms_test_attempts as lmsTestAttempts } from './schema-ext-b-1';

export const lmsSessions = pgTable('lms_sessions', {
  id: integer('id').primaryKey(),
  user_id: integer('user_id'),
  duration_seconds: integer('duration_seconds'),
  created_at: timestamp('created_at'),
});

export const lmsTests = pgTable('lms_tests', {
  id: integer('id').primaryKey(),
  title: text('title'),
  difficulty_level: varchar('difficulty_level'),
  is_active: boolean('is_active'),
  created_at: timestamp('created_at'),
});

export const lmsCourses = pgTable('lms_courses', {
  id: integer('id').primaryKey(),
  title: text('title'),
  is_active: boolean('is_active'),
  created_at: timestamp('created_at'),
});

export const lmsEnrollments = pgTable('lms_enrollments', {
  id: integer('id').primaryKey(),
  user_id: integer('user_id'),
  course_id: integer('course_id'),
  status: varchar('status'),
  created_at: timestamp('created_at'),
});

export const lmsEvents = pgTable('lms_events', {
  id: integer('id').primaryKey(),
  type: varchar('type'),
  status: varchar('status'),
  created_at: timestamp('created_at'),
});

export const mentorships = pgTable('mentorships', {
  id: integer('id').primaryKey(),
  mentor_id: integer('mentor_id'),
  mentee_id: integer('mentee_id'),
  status: varchar('status'),
  created_at: timestamp('created_at'),
});

export const applications = pgTable('applications', {
  id: integer('id').primaryKey(),
  status: varchar('status'),
  created_at: timestamp('created_at'),
});

export const applicationResponses = pgTable('application_responses', {
  id: integer('id').primaryKey(),
  application_id: integer('application_id'),
  status: varchar('status'),
  created_at: timestamp('created_at'),
});

export const surveysTable = pgTable('surveys', {
  id: integer('id').primaryKey(),
  status: varchar('status'),
  created_at: timestamp('created_at'),
});

export const surveyResponses = pgTable('survey_responses', {
  id: integer('id').primaryKey(),
  survey_id: integer('survey_id'),
  created_at: timestamp('created_at'),
});

export const broadcastsTable = pgTable('broadcasts', {
  id: integer('id').primaryKey(),
  recipients_count: integer('recipients_count'),
  success_count: integer('success_count'),
  failed_count: integer('failed_count'),
  created_at: timestamp('created_at'),
});

export const skillsTable = pgTable('skills', {
  id: integer('id').primaryKey(),
  category: varchar('category'),
  name: text('name'),
  created_at: timestamp('created_at'),
});

export const userSkills = pgTable('user_skills', {
  id: integer('id').primaryKey(),
  skill_id: integer('skill_id'),
  employee_id: integer('employee_id'),
  user_id: integer('user_id'),
  verified: boolean('verified'),
  created_at: timestamp('created_at'),
});

// productionOrders: 3-col stub removed — barrel uses full 14-col version from schema-compat-3.ts.
// Consumers only need .status/.id which exist in the canonical version.

export const invoicesTable = pgTable('invoices', {
  id: integer('id').primaryKey(),
  status: varchar('status'),
  amount: text('amount'),
  due_date: date('due_date'),
  created_at: timestamp('created_at'),
});

// accountsTable: re-exported from canonical accounts definition in schema-ext-b-1.ts
export const accountsTable = canonicalAccounts;

export { systemAlerts } from '@workspace/db';

export const iotAlerts = pgTable('iot_alerts', {
  id: integer('id').primaryKey(),
  created_at: timestamp('created_at'),
  resolved_at: timestamp('resolved_at'),
});

export const adminsTable = pgTable('admins', {
  id: integer('id').primaryKey(),
  username: varchar('username'),
  created_at: timestamp('created_at'),
});
