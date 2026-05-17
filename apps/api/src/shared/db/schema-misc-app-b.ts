/**
 * @module schema-misc-app-b
 * @description Source module. See exports for details.
 */

import {
  pgTable, integer, text, boolean, timestamp, varchar, date,
} from 'drizzle-orm/pg-core';
import { accounts as canonicalAccounts } from './schema-ext-b-1';
const stub = <T extends object>(t: T): T => t;

export { chatReactions, chatPolls, chatPollVotes, chatMessageTasks } from './schema-chat';

export const hrAttendance = stub(pgTable('attendance', {
  id: integer('id').primaryKey(),
  employee_id: integer('employee_id'),
  check_in: timestamp('check_in'),
  check_out: timestamp('check_out'),
  status: varchar('status'),
  created_at: timestamp('created_at'),
}));

export const lmsTestAttempts = stub(pgTable('lms_test_attempts', {
  id: integer('id').primaryKey(),
  user_id: integer('user_id'),
  test_id: integer('test_id'),
  score: integer('score'),
  passed: boolean('passed'),
  duration_seconds: integer('duration_seconds'),
  created_at: timestamp('created_at'),
}));

export const lmsSessions = stub(pgTable('lms_sessions', {
  id: integer('id').primaryKey(),
  user_id: integer('user_id'),
  duration_seconds: integer('duration_seconds'),
  created_at: timestamp('created_at'),
}));

export const lmsTests = stub(pgTable('lms_tests', {
  id: integer('id').primaryKey(),
  title: text('title'),
  difficulty_level: varchar('difficulty_level'),
  is_active: boolean('is_active'),
  created_at: timestamp('created_at'),
}));

export const lmsCourses = stub(pgTable('lms_courses', {
  id: integer('id').primaryKey(),
  title: text('title'),
  is_active: boolean('is_active'),
  created_at: timestamp('created_at'),
}));

export const lmsEnrollments = stub(pgTable('lms_enrollments', {
  id: integer('id').primaryKey(),
  user_id: integer('user_id'),
  course_id: integer('course_id'),
  status: varchar('status'),
  created_at: timestamp('created_at'),
}));

export const lmsEvents = stub(pgTable('lms_events', {
  id: integer('id').primaryKey(),
  type: varchar('type'),
  status: varchar('status'),
  created_at: timestamp('created_at'),
}));

export const mentorships = stub(pgTable('mentorships', {
  id: integer('id').primaryKey(),
  mentor_id: integer('mentor_id'),
  mentee_id: integer('mentee_id'),
  status: varchar('status'),
  created_at: timestamp('created_at'),
}));

export const applications = stub(pgTable('applications', {
  id: integer('id').primaryKey(),
  status: varchar('status'),
  created_at: timestamp('created_at'),
}));

export const applicationResponses = stub(pgTable('application_responses', {
  id: integer('id').primaryKey(),
  application_id: integer('application_id'),
  status: varchar('status'),
  created_at: timestamp('created_at'),
}));

export const surveysTable = stub(pgTable('surveys', {
  id: integer('id').primaryKey(),
  status: varchar('status'),
  created_at: timestamp('created_at'),
}));

export const surveyResponses = stub(pgTable('survey_responses', {
  id: integer('id').primaryKey(),
  survey_id: integer('survey_id'),
  created_at: timestamp('created_at'),
}));

export const broadcastsTable = stub(pgTable('broadcasts', {
  id: integer('id').primaryKey(),
  recipients_count: integer('recipients_count'),
  success_count: integer('success_count'),
  failed_count: integer('failed_count'),
  created_at: timestamp('created_at'),
}));

export const skillsTable = stub(pgTable('skills', {
  id: integer('id').primaryKey(),
  category: varchar('category'),
  name: text('name'),
  created_at: timestamp('created_at'),
}));

export const userSkills = stub(pgTable('user_skills', {
  id: integer('id').primaryKey(),
  skill_id: integer('skill_id'),
  employee_id: integer('employee_id'),
  user_id: integer('user_id'),
  verified: boolean('verified'),
  created_at: timestamp('created_at'),
}));

export const productionOrders = stub(pgTable('production_orders', {
  id: integer('id').primaryKey(),
  status: varchar('status'),
  created_at: timestamp('created_at'),
}));

export const invoicesTable = stub(pgTable('invoices', {
  id: integer('id').primaryKey(),
  status: varchar('status'),
  amount: text('amount'),
  due_date: date('due_date'),
  created_at: timestamp('created_at'),
}));

// accountsTable: re-exported from canonical accounts definition in schema-ext-b-1.ts
export const accountsTable = canonicalAccounts;

export const systemAlerts = stub(pgTable('system_alerts', {
  id: integer('id').primaryKey(),
  severity: varchar('severity'),
  title: text('title'),
  message: text('message'),
  module: varchar('module'),
  created_at: timestamp('created_at'),
  resolved_at: timestamp('resolved_at'),
}));

export const iotAlerts = stub(pgTable('iot_alerts', {
  id: integer('id').primaryKey(),
  created_at: timestamp('created_at'),
  resolved_at: timestamp('resolved_at'),
}));

export const adminsTable = stub(pgTable('admins', {
  id: integer('id').primaryKey(),
  username: varchar('username'),
  created_at: timestamp('created_at'),
}));
