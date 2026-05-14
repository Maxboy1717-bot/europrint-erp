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
  description: text('description'),
  orderIndex:  integer('order_index').notNull().default(0),
  createdAt:   timestamp('created_at').notNull().defaultNow(),
  updatedAt:   timestamp('updated_at').notNull().defaultNow(),
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

export const lmsExamAttempts = pgTable('lms_exam_attempts', {
  id:          serial('id').primaryKey(),
  examId:      integer('exam_id').notNull().references(() => lmsExams.id, { onDelete: 'cascade' }),
  userId:      integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  startedAt:   timestamp('started_at').notNull().defaultNow(),
  submittedAt: timestamp('submitted_at'),
  score:       real('score'),
  status:      varchar('status', { length: 20 }).notNull().default('in_progress'),
  createdAt:   timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  check("lms_exam_attempts_status_chk", sql`${t.status} IN ('in_progress','completed','failed','cancelled')`),
]);

export const lmsExamAnswers = pgTable('lms_exam_answers', {
  id:             serial('id').primaryKey(),
  attemptId:      integer('attempt_id').notNull().references(() => lmsExamAttempts.id, { onDelete: 'cascade' }),
  questionId:     integer('question_id').notNull(),
  selectedOption: integer('selected_option').notNull(),
  isCorrect:      boolean('is_correct').notNull().default(false),
  createdAt:      timestamp('created_at').notNull().defaultNow(),
});

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
