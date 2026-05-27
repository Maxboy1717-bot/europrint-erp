/**
 * @module lms-extended
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { pgTable, serial, integer, varchar, text, timestamp, real, boolean, jsonb, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { courses } from './lms';
import { users } from './users';

export const lmsExams = pgTable('lms_exams', {
  id:              serial('id').primaryKey(),
  title:           varchar('title', { length: 200 }).notNull(),
  courseId:        integer('course_id').references(() => courses.id, { onDelete: 'set null' }),
  durationMinutes: integer('duration_minutes').notNull().default(60),
  passingScore:    real('passing_score').notNull().default(70),
  isActive:        boolean('is_active').notNull().default(true),
  createdAt:       timestamp('created_at').notNull().defaultNow(),
  updatedAt:       timestamp('updated_at').notNull().defaultNow(),
});

export const lmsExamQuestions = pgTable('lms_exam_questions', {
  id:            serial('id').primaryKey(),
  examId:        integer('exam_id').notNull().references(() => lmsExams.id, { onDelete: 'cascade' }),
  questionText:  text('question_text').notNull(),
  options:       jsonb('options').notNull().$type<string[]>(),
  correctOption: integer('correct_option').notNull(),
  orderIndex:    integer('order_index').notNull().default(0),
  createdAt:     timestamp('created_at').notNull().defaultNow(),
});

export const lmsModules = pgTable('lms_modules', {
  id:          serial('id').primaryKey(),
  courseId:    integer('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  title:       varchar('title', { length: 200 }).notNull(),
  titleRu:     text('title_ru'),
  description: text('description'),
  order:       integer('order'),
  orderIndex:  integer('order_index').notNull().default(0),
  sortOrder:   integer('sort_order'),
  createdAt:   timestamp('created_at').notNull().defaultNow(),
  updatedAt:   timestamp('updated_at').notNull().defaultNow(),
  deletedAt:   timestamp('deleted_at'),
});

export const lmsLessons = pgTable('lms_lessons', {
  id:          serial('id').primaryKey(),
  moduleId:    integer('module_id').notNull().references(() => lmsModules.id, { onDelete: 'cascade' }),
  title:       varchar('title', { length: 200 }).notNull(),
  contentType: varchar('content_type', { length: 20 }).notNull().default('text'),
  contentUrl:  text('content_url'),
  contentBody: text('content_body'),
  durationMin: integer('duration_min').default(0),
  orderIndex:  integer('order_index').notNull().default(0),
  createdAt:   timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  check("lms_lessons_content_type_chk", sql`${t.contentType} IN ('text','video','pdf','audio','quiz','assignment')`),
]);

// lmsExamAttempts + lmsExamAnswers: REMOVED — stale schema (serial PK + examId/userId FK).
// Production table lms_exam_attempts uses uuid PK + employeeId + questions/answers JSONB
// (see schema-ai.ts: aiExamAttempts). Zero consumers of these lib/db definitions.

export const lmsCertificates = pgTable('lms_certificates', {
  id:        serial('id').primaryKey(),
  userId:    integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  examId:    integer('exam_id').notNull().references(() => lmsExams.id, { onDelete: 'cascade' }),
  score:     real('score').notNull(),
  issuedAt:  timestamp('issued_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at'),
  status:    varchar('status', { length: 20 }).notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  check("lms_certificates_status_chk", sql`${t.status} IN ('active','expired','revoked')`),
]);
