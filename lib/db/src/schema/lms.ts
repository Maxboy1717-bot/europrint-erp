import { pgTable, serial, integer, timestamp, varchar, boolean, text, decimal, date, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { employees } from "./employees";

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  courseCode: varchar("course_code", { length: 30 }).unique(),
  titleUz: varchar("title_uz", { length: 200 }).notNull(),
  titleRu: varchar("title_ru", { length: 200 }),
  description: text("description"),
  category: varchar("category", { length: 50 }),
  difficultyLevel: varchar("difficulty_level", { length: 20 }),
  durationHours: integer("duration_hours"),
  passingScore: decimal("passing_score", { precision: 5, scale: 2 }).default("70.00"),
  maxAttempts: integer("max_attempts").default(3),
  isMandatory: boolean("is_mandatory").default(false),
  prerequisiteCourseId: integer("prerequisite_course_id"),
  thumbnailUrl: text("thumbnail_url"),
  authorId: integer("author_id"),
  isActive: boolean("is_active").default(true),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const courseModules = pgTable("course_modules", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  moduleNumber: integer("module_number").notNull(),
  titleUz: varchar("title_uz", { length: 200 }).notNull(),
  titleRu: varchar("title_ru", { length: 200 }),
  description: text("description"),
  durationMinutes: integer("duration_minutes"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").references(() => courseModules.id).notNull(),
  lessonNumber: integer("lesson_number").notNull(),
  titleUz: varchar("title_uz", { length: 200 }).notNull(),
  titleRu: varchar("title_ru", { length: 200 }),
  contentType: varchar("content_type", { length: 30 }),
  contentUrl: text("content_url"),
  contentHtml: text("content_html"),
  videoUrl: text("video_url"),
  durationMinutes: integer("duration_minutes"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tests = pgTable("tests", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id),
  moduleId: integer("module_id").references(() => courseModules.id),
  titleUz: varchar("title_uz", { length: 200 }).notNull(),
  titleRu: varchar("title_ru", { length: 200 }),
  testType: varchar("test_type", { length: 30 }),
  timeLimitMinutes: integer("time_limit_minutes"),
  passingScore: decimal("passing_score", { precision: 5, scale: 2 }).default("70.00"),
  maxAttempts: integer("max_attempts").default(3),
  shuffleQuestions: boolean("shuffle_questions").default(true),
  showResults: boolean("show_results").default(true),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const testQuestions = pgTable("test_questions", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").references(() => tests.id).notNull(),
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
  testId: integer("test_id").references(() => tests.id).notNull(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
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

export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  certificateNumber: varchar("certificate_number", { length: 50 }).unique(),
  issuedDate: date("issued_date").notNull(),
  expiryDate: date("expiry_date"),
  score: decimal("score", { precision: 5, scale: 2 }),
  certificateUrl: text("certificate_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
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
]);

export const positionRequiredCourses = pgTable("position_required_courses", {
  id: serial("id").primaryKey(),
  positionId: integer("position_id").notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  isMandatory: boolean("is_mandatory").default(true),
  deadlineDays: integer("deadline_days"),
  blocksMesAccess: boolean("blocks_mes_access").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

export const insertCourseModuleSchema = createInsertSchema(courseModules).omit({ id: true, createdAt: true } as never);
export type InsertCourseModule = z.infer<typeof insertCourseModuleSchema>;
export type CourseModule = typeof courseModules.$inferSelect;

export const insertLessonSchema = createInsertSchema(lessons).omit({ id: true, createdAt: true } as never);
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Lesson = typeof lessons.$inferSelect;

export const insertTestSchema = createInsertSchema(tests).omit({ id: true, createdAt: true } as never);
export type InsertTest = z.infer<typeof insertTestSchema>;
export type Test = typeof tests.$inferSelect;

export const insertTestQuestionSchema = createInsertSchema(testQuestions).omit({ id: true, createdAt: true } as never);
export type InsertTestQuestion = z.infer<typeof insertTestQuestionSchema>;
export type TestQuestion = typeof testQuestions.$inferSelect;

export const insertTestAttemptSchema = createInsertSchema(testAttempts).omit({ id: true, createdAt: true } as never);
export type InsertTestAttempt = z.infer<typeof insertTestAttemptSchema>;
export type TestAttempt = typeof testAttempts.$inferSelect;

export const insertCertificateSchema = createInsertSchema(certificates).omit({ id: true, createdAt: true } as never);
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type Certificate = typeof certificates.$inferSelect;

export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Enrollment = typeof enrollments.$inferSelect;

export const insertPositionRequiredCourseSchema = createInsertSchema(positionRequiredCourses).omit({ id: true, createdAt: true } as never);
export type InsertPositionRequiredCourse = z.infer<typeof insertPositionRequiredCourseSchema>;
export type PositionRequiredCourse = typeof positionRequiredCourses.$inferSelect;
