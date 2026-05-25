/**
 * @module lms
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 *
 * Canonical sources for duplicated tables:
 *   courses, lessons, tests          → ./lms-schema
 *   certificates                     → ./hr-questionnaire
 *   positionRequiredCourses          → this file (lms.ts)
 */

import { pgTable, serial, integer, timestamp, varchar, boolean, text, decimal, jsonb, uniqueIndex, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { employees } from "./employees";
import { courses } from "./lms-schema";
import { positions } from "./core-schema";

// ── Re-exports from canonical sources ───────────────────────────────────────
export {
  courses,
  lessons,
  tests,
  insertCourseSchema,
  insertLessonSchema,
  insertTestSchema,
  type Course,
  type InsertCourse,
  type Lesson,
  type InsertLesson,
  type Test,
  type InsertTest,
} from "./lms-schema";

export { certificates } from "./hr-questionnaire";

export {
  insertCertificateSchema,
  type Certificate,
  type InsertCertificate,
} from "./hr-personal-core";

// ── positionRequiredCourses — canonical definition ───────────────────────────
export const positionRequiredCourses = pgTable("position_required_courses", {
  id: serial("id").primaryKey(),
  positionId: integer("position_id").references(() => positions.id, { onDelete: "cascade" }).notNull(),
  courseId: integer("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
  isMandatory: boolean("is_mandatory").default(true),
  deadlineDays: integer("deadline_days"),
  blocksMesAccess: boolean("blocks_mes_access").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Local tables (not duplicated elsewhere) ──────────────────────────────────

export const courseModules = pgTable("course_modules", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
  moduleNumber: integer("module_number").notNull(),
  titleUz: varchar("title_uz", { length: 200 }).notNull(),
  titleRu: varchar("title_ru", { length: 200 }),
  description: text("description"),
  durationMinutes: integer("duration_minutes"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const testQuestions = pgTable("test_questions", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").notNull(),
  questionText: text("question_text").notNull(),
  questionType: varchar("question_type", { length: 30 }),
  options: jsonb("options"),
  correctAnswer: text("correct_answer"),
  explanation: text("explanation"),
  weight: decimal("weight", { precision: 3, scale: 1 }).default("1.0"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const testAttempts = pgTable("test_attempts", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").notNull(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  attemptNumber: integer("attempt_number").default(1),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  score: decimal("score", { precision: 5, scale: 2 }),
  totalQuestions: integer("total_questions"),
  correctAnswers: integer("correct_answers"),
  isPassed: boolean("is_passed").default(false),
  answers: jsonb("answers"),
  timeTakenSeconds: integer("time_taken_seconds"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  courseId: integer("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  progressPercent: integer("progress_percent").default(0),
  lastAccessedAt: timestamp("last_accessed_at"),
  status: varchar("status", { length: 20 }).default("enrolled"),
  currentModuleId: integer("current_module_id"),
  currentLessonId: integer("current_lesson_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("uq_enrollment_emp_course").on(table.employeeId, table.courseId),
  check("enrollments_status_chk", sql`${table.status} IS NULL OR ${table.status} IN ('enrolled','in_progress','completed','dropped')`),
  check("enrollments_progress_chk", sql`${table.progressPercent} IS NULL OR (${table.progressPercent} >= 0 AND ${table.progressPercent} <= 100)`),
]);

export const insertCourseModuleSchema = createInsertSchema(courseModules).omit({ id: true, createdAt: true } as never);
export type InsertCourseModule = z.infer<typeof insertCourseModuleSchema>;
export type CourseModule = typeof courseModules.$inferSelect;

export const insertTestQuestionSchema = createInsertSchema(testQuestions).omit({ id: true, createdAt: true } as never);
export type InsertTestQuestion = z.infer<typeof insertTestQuestionSchema>;
export type TestQuestion = typeof testQuestions.$inferSelect;

export const insertTestAttemptSchema = createInsertSchema(testAttempts).omit({ id: true, createdAt: true } as never);
export type InsertTestAttempt = z.infer<typeof insertTestAttemptSchema>;
export type TestAttempt = typeof testAttempts.$inferSelect;

export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Enrollment = typeof enrollments.$inferSelect;

export const insertPositionRequiredCourseSchema = createInsertSchema(positionRequiredCourses).omit({ id: true, createdAt: true } as never);
export type InsertPositionRequiredCourse = z.infer<typeof insertPositionRequiredCourseSchema>;
export type PositionRequiredCourse = typeof positionRequiredCourses.$inferSelect;
