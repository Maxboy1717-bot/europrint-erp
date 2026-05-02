import { sql } from "drizzle-orm";
import { serial, pgTable, text, varchar, integer, boolean, timestamp, jsonb, unique, uuid, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { Admin, User, departments, goals, positions, users } from "./core-schema";
import { attendance } from "./hr-schema";


// Guidelines (lavozim yo'riqnomalari)
export const guidelines = pgTable("guidelines", {
  id: serial("id").primaryKey(),
  positionId: integer("position_id").references(() => positions.id, { onDelete: 'set null' }),
  filePath: text("file_path").notNull(),
  version: varchar("version", { length: 20 }).notNull().default("1.0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
  deletedAt: timestamp("deleted_at"),
  deletedBy: varchar("deleted_by"),
});


// Mentors (kurs mentorlari)
export const mentors = pgTable("mentors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Mentor ismi
  bio: text("bio"), // Kim (qisqacha ma'lumot)
  source: text("source"), // Qayerdan (kompaniya, universitet, tashkilot)
  achievements: text("achievements"), // Yutuqlar
  experience: text("experience"), // Tajriba (yillar, loyihalar)
  expertise: text("expertise"), // Mutaxassislik sohalari
  userId: integer("user_id").references(() => users.id), // Agar bizning xodimimiz bo'lsa
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
  deletedAt: timestamp("deleted_at"),
  deletedBy: varchar("deleted_by"),
});


// Courses
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  title: text("title").notNull(),
  titleRu: text("title_ru"),
  description: text("description"),
  descriptionRu: text("description_ru"),
  thumbnail: text("thumbnail"),
  isRequired: boolean("is_required").notNull().default(false),
  duration: integer("duration"), // minutes
  level: varchar("level", { length: 20 }).notNull().default("beginner"), // beginner, intermediate, advanced
  departmentId: integer("department_id").references(() => departments.id), // which department this course is for
  mentorId: varchar("mentor_id").references(() => mentors.id), // Tayinlangan mentor
  startDate: varchar("start_date", { length: 10 }), // Default start date in YYYY-MM-DD format (optional)
  endDate: varchar("end_date", { length: 10 }), // Default end date in YYYY-MM-DD format (optional)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("idx_courses_department_id").on(t.departmentId),
  index("idx_courses_is_required").on(t.isRequired),
  index("idx_courses_level").on(t.level),
]);


// Modules
export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  titleRu: text("title_ru"),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("idx_modules_course_id").on(t.courseId),
]);


// Lessons
export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  moduleId: varchar("module_id").notNull().references(() => modules.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 20 }).notNull(), // video, text, pdf
  title: text("title").notNull(),
  titleRu: text("title_ru"),
  content: text("content"), // for text type
  contentRu: text("content_ru"),
  filePath: text("file_path"), // for video/pdf
  duration: integer("duration"), // minutes
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("idx_lessons_module_id").on(t.moduleId),
]);


// Tests
export const tests = pgTable("tests", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id, { onDelete: "cascade" }),
  moduleId: varchar("module_id").references(() => modules.id, { onDelete: "cascade" }),
  departmentId: integer("department_id").references(() => departments.id, { onDelete: 'set null' }),
  positionId: integer("position_id").references(() => positions.id, { onDelete: 'set null' }),
  title: text("title").notNull(),
  titleRu: text("title_ru"),
  passPercentage: integer("pass_percentage").notNull().default(80),
  timeLimit: integer("time_limit"), // minutes
  maxAttempts: integer("max_attempts").notNull().default(3),
  randomizeQuestions: boolean("randomize_questions").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_tests_course_id").on(t.courseId),
  index("idx_tests_module_id").on(t.moduleId),
]);


// Questions
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  testId: varchar("test_id").notNull().references(() => tests.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 20 }).notNull(), // mcq, open, practice
  question: text("question").notNull(),
  questionRu: text("question_ru"),
  options: jsonb("options"), // for MCQ: ["option1", "option2", ...]
  optionsRu: jsonb("options_ru"),
  correctAnswer: text("correct_answer"), // for MCQ: index or text
  difficulty: varchar("difficulty", { length: 20 }).notNull().default("medium"), // easy, medium, hard
  category: text("category"),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});


// Attempts
export const attempts = pgTable("attempts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'set null' }),
  testId: varchar("test_id").notNull().references(() => tests.id),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  finishedAt: timestamp("finished_at"),
  score: integer("score"),
  passed: boolean("passed"),
  gptUsed: boolean("gpt_used").notNull().default(false),
}, (t) => [
  index("idx_attempts_user_id").on(t.userId),
  index("idx_attempts_test_id").on(t.testId),
]);


// Answers
export const answers = pgTable("answers", {
  id: serial("id").primaryKey(),
  attemptId: varchar("attempt_id").notNull().references(() => attempts.id, { onDelete: "cascade" }),
  questionId: varchar("question_id").notNull().references(() => questions.id),
  response: text("response").notNull(),
  score: integer("score"),
  feedback: text("feedback"),
  gptFeedback: jsonb("gpt_feedback"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});


// Course Assignments
export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId: integer("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  startDate: varchar("start_date", { length: 10 }), // YYYY-MM-DD format
  endDate: varchar("end_date", { length: 10 }), // YYYY-MM-DD format
  dueAt: timestamp("due_at"),
  completedAt: timestamp("completed_at"),
}, (t) => [
  index("idx_assignments_user_id").on(t.userId),
  index("idx_assignments_course_id").on(t.courseId),
]);


// Progress tracking
export const progress = pgTable("progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'set null' }),
  lessonId: varchar("lesson_id").notNull().references(() => lessons.id),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
}, (t) => [
  index("idx_progress_user_id").on(t.userId),
  index("idx_progress_lesson_id").on(t.lessonId),
]);


// AI Exam Attempts (35-question AI generated exams)
export const aiExamAttempts = pgTable("ai_exam_attempts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'set null' }),
  positionId: varchar("position_id").notNull().references(() => positions.id, { onDelete: 'set null' }),
  questions: jsonb("questions").notNull(), // AI generated 35 questions with categories
  answers: jsonb("answers").notNull(), // Employee's answers
  gptAnalysis: text("gpt_analysis"), // 2500-word analysis in Abdulla Oripov style
  score: integer("score"), // Overall score
  evaluation: jsonb("evaluation"), // Detailed evaluation by category
  status: varchar("status", { length: 20 }).notNull().default("assigned"), // assigned, in_progress, completed, analyzed
  assignedBy: varchar("assigned_by").references(() => users.id), // Admin who assigned the exam
  assignedAt: timestamp("assigned_at").defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  analyzedAt: timestamp("analyzed_at"),
});

export const insertMentorSchema = createInsertSchema(mentors).omit({ id: true, createdAt: true } as never);

export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true } as never);

export const insertModuleSchema = createInsertSchema(modules).omit({ id: true, createdAt: true } as never);

export const insertLessonSchema = createInsertSchema(lessons).omit({ id: true, createdAt: true } as never);

export const insertTestSchema = createInsertSchema(tests).omit({ id: true, createdAt: true } as never);

export const insertQuestionSchema = createInsertSchema(questions).omit({ id: true, createdAt: true } as never);

export const insertAttemptSchema = createInsertSchema(attempts).omit({ id: true, startedAt: true } as never);

export const insertAnswerSchema = createInsertSchema(answers).omit({ id: true, createdAt: true } as never);

export const insertAssignmentSchema = createInsertSchema(assignments).omit({ id: true, assignedAt: true } as never);

export const insertProgressSchema = createInsertSchema(progress).omit({ id: true } as never);

export const insertAiExamAttemptSchema = createInsertSchema(aiExamAttempts).omit({ id: true, startedAt: true } as never);

export type Mentor = typeof mentors.$inferSelect;

export type InsertMentor = z.infer<typeof insertMentorSchema>;

export type Course = typeof courses.$inferSelect;

export type InsertCourse = z.infer<typeof insertCourseSchema>;

export type Module = typeof modules.$inferSelect;

export type InsertModule = z.infer<typeof insertModuleSchema>;

export type Lesson = typeof lessons.$inferSelect;

export type InsertLesson = z.infer<typeof insertLessonSchema>;

export type Test = typeof tests.$inferSelect;

export type InsertTest = z.infer<typeof insertTestSchema>;

export type Question = typeof questions.$inferSelect;

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type Attempt = typeof attempts.$inferSelect;

export type InsertAttempt = z.infer<typeof insertAttemptSchema>;

export type Answer = typeof answers.$inferSelect;

export type InsertAnswer = z.infer<typeof insertAnswerSchema>;

export type Assignment = typeof assignments.$inferSelect;

export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;

export type Progress = typeof progress.$inferSelect;

export type InsertProgress = z.infer<typeof insertProgressSchema>;

export type AiExamAttempt = typeof aiExamAttempts.$inferSelect;

export type InsertAiExamAttempt = z.infer<typeof insertAiExamAttemptSchema>;


// Video Progress (video qayerda to'xtagan)
export const videoProgress = pgTable("video_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lessonId: varchar("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  currentTime: integer("current_time").notNull().default(0), // seconds
  duration: integer("duration").notNull().default(0), // seconds
  completed: boolean("completed").notNull().default(false),
  lastWatchedAt: timestamp("last_watched_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


// Achievements (yutuqlar)
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  description: text("description").notNull(),
  descriptionRu: text("description_ru"),
  icon: text("icon"), // emoji or icon name
  points: integer("points").notNull().default(0), // ballar
  condition: text("condition").notNull(), // JSON: {type: "course_complete", courseId: "xxx"}
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});


// User Achievements (xodim yutuqlari)
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  achievementId: varchar("achievement_id").notNull().references(() => achievements.id, { onDelete: "cascade" }),
  earnedAt: timestamp("earned_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});


// User Points (xodim ballari)
export const userPoints = pgTable("user_points", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  points: integer("points").notNull().default(0),
  source: varchar("source", { length: 50 }).notNull(), // achievement, course, test, attendance
  sourceId: varchar("source_id"), // achievement_id, course_id, etc.
  reason: text("reason"),
  reasonRu: text("reason_ru"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


// Skills (ko'nikmalar)
export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  category: varchar("category", { length: 50 }).notNull(), // technical, soft, leadership
  level: varchar("level", { length: 20 }).notNull().default("beginner"), // beginner, intermediate, advanced, expert
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


// User Skills (xodim ko'nikmalari - skill matrix)
export const userSkills = pgTable("user_skills", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  skillId: varchar("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
  level: varchar("level", { length: 20 }).notNull(), // beginner, intermediate, advanced, expert
  verifiedBy: varchar("verified_by").references(() => users.id), // HR/Manager who verified
  verifiedAt: timestamp("verified_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});


// Onboarding Tasks (yangi xodimlar uchun vazifalar)
export const onboardingTasks = pgTable("onboarding_tasks", {
  id: serial("id").primaryKey(),
  positionId: integer("position_id").references(() => positions.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  titleRu: text("title_ru"),
  description: text("description"),
  descriptionRu: text("description_ru"),
  type: varchar("type", { length: 20 }).notNull(), // document, course, meeting, task
  relatedId: varchar("related_id"), // course_id, etc.
  daysToComplete: integer("days_to_complete"), // days after hire
  order: integer("order").notNull(),
  isRequired: boolean("is_required").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
  deletedAt: timestamp("deleted_at"),
  deletedBy: varchar("deleted_by"),
});


// User Onboarding Progress
export const userOnboardingProgress = pgTable("user_onboarding_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  taskId: varchar("task_id").notNull().references(() => onboardingTasks.id, { onDelete: "cascade" }),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


// Mentorships (mentorlik)
export const mentorships = pgTable("mentorships", {
  id: serial("id").primaryKey(),
  mentorId: varchar("mentor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  menteeId: varchar("mentee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: varchar("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }), // majburiy kurs
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, completed, cancelled
  startDate: varchar("start_date", { length: 10 }).notNull(), // YYYY-MM-DD
  endDate: varchar("end_date", { length: 10 }), // YYYY-MM-DD
  deadline: varchar("deadline", { length: 10 }), // YYYY-MM-DD muddat
  bonusPercentage: integer("bonus_percentage").default(0), // Mentor bonusi %
  goals: text("goals"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});


// Mentorship Sessions (mentorlik uchrashuvlari)
export const mentorshipSessions = pgTable("mentorship_sessions", {
  id: serial("id").primaryKey(),
  mentorshipId: varchar("mentorship_id").notNull().references(() => mentorships.id, { onDelete: "cascade" }),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  duration: integer("duration").notNull(), // minutes
  topics: text("topics"),
  feedback: text("feedback"),
  nextSteps: text("next_steps"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


// ==================== INSERT SCHEMAS ====================

export const insertVideoProgressSchema = createInsertSchema(videoProgress).omit({ id: true, createdAt: true, lastWatchedAt: true } as never);

export const insertAchievementSchema = createInsertSchema(achievements).omit({ id: true, createdAt: true } as never);

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({ id: true, earnedAt: true } as never);

export const insertUserPointsSchema = createInsertSchema(userPoints).omit({ id: true, createdAt: true } as never);

export const insertSkillSchema = createInsertSchema(skills).omit({ id: true, createdAt: true } as never);

export const insertUserSkillSchema = createInsertSchema(userSkills).omit({ id: true, createdAt: true, updatedAt: true } as never);

export const insertOnboardingTaskSchema = createInsertSchema(onboardingTasks).omit({ id: true, createdAt: true } as never);

export const insertUserOnboardingProgressSchema = createInsertSchema(userOnboardingProgress).omit({ id: true, createdAt: true } as never);

export const insertMentorshipSchema = createInsertSchema(mentorships).omit({ id: true, createdAt: true, updatedAt: true } as never);

export const insertMentorshipSessionSchema = createInsertSchema(mentorshipSessions).omit({ id: true, createdAt: true } as never);


// ==================== TYPES ====================

export type VideoProgress = typeof videoProgress.$inferSelect;

export type InsertVideoProgress = z.infer<typeof insertVideoProgressSchema>;


export type Achievement = typeof achievements.$inferSelect;

export type InsertAchievement = z.infer<typeof insertAchievementSchema>;


export type UserAchievement = typeof userAchievements.$inferSelect;

export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;


export type UserPoints = typeof userPoints.$inferSelect;

export type InsertUserPoints = z.infer<typeof insertUserPointsSchema>;


export type Skill = typeof skills.$inferSelect;

export type InsertSkill = z.infer<typeof insertSkillSchema>;


export type UserSkill = typeof userSkills.$inferSelect;

export type InsertUserSkill = z.infer<typeof insertUserSkillSchema>;


export type OnboardingTask = typeof onboardingTasks.$inferSelect;

export type InsertOnboardingTask = z.infer<typeof insertOnboardingTaskSchema>;


export type UserOnboardingProgress = typeof userOnboardingProgress.$inferSelect;

export type InsertUserOnboardingProgress = z.infer<typeof insertUserOnboardingProgressSchema>;


export type Mentorship = typeof mentorships.$inferSelect;

export type InsertMentorship = z.infer<typeof insertMentorshipSchema>;


export type MentorshipSession = typeof mentorshipSessions.$inferSelect;

export type InsertMentorshipSession = z.infer<typeof insertMentorshipSessionSchema>;


// ============================================================
// HR CAPITAL - PDF KURSLAR TIZIMI (LMS uchun)
// ============================================================

export const hrCapitalCourses = pgTable("hr_capital_courses", {
  id: serial("id").primaryKey(),
  sessionNumber: integer("session_number"),
  title: text("title").notNull(),
  titleRu: text("title_ru"),
  content: text("content"),
  contentStructured: jsonb("content_structured"),
  keywords: text("keywords").array(),
  difficulty: varchar("difficulty", { length: 20 }).default("intermediate"),
  durationMinutes: integer("duration_minutes"),
  author: varchar("author", { length: 100 }),
  sourcePdfUrl: text("source_pdf_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const hrCapitalModules = pgTable("hr_capital_modules", {
  id: serial("id").primaryKey(),
  courseId: varchar("course_id").notNull().references(() => hrCapitalCourses.id),
  moduleNumber: integer("module_number"),
  title: text("title").notNull(),
  titleRu: text("title_ru"),
  content: text("content"),
  learningObjectives: text("learning_objectives").array(),
  keyConcepts: jsonb("key_concepts"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const hrCapitalQuizQuestions = pgTable("hr_capital_quiz_questions", {
  id: serial("id").primaryKey(),
  moduleId: varchar("module_id").notNull().references(() => hrCapitalModules.id),
  questionType: varchar("question_type", { length: 50 }).notNull().default("multiple_choice"),
  questionText: text("question_text").notNull(),
  questionTextRu: text("question_text_ru"),
  options: jsonb("options"),
  correctAnswer: text("correct_answer"),
  explanation: text("explanation"),
  explanationRu: text("explanation_ru"),
  difficulty: varchar("difficulty", { length: 20 }).default("intermediate"),
  generatedByAi: boolean("generated_by_ai").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const hrCapitalQuizAttempts = pgTable("hr_capital_quiz_attempts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'set null' }),
  moduleId: varchar("module_id").notNull().references(() => hrCapitalModules.id),
  score: integer("score"),
  totalQuestions: integer("total_questions"),
  correctAnswers: integer("correct_answers"),
  answers: jsonb("answers"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const insertHrCapitalCourseSchema = createInsertSchema(hrCapitalCourses).omit({ id: true, createdAt: true } as never);

export const insertHrCapitalModuleSchema = createInsertSchema(hrCapitalModules).omit({ id: true, createdAt: true } as never);

export const insertHrCapitalQuizQuestionSchema = createInsertSchema(hrCapitalQuizQuestions).omit({ id: true, createdAt: true } as never);

export const insertHrCapitalQuizAttemptSchema = createInsertSchema(hrCapitalQuizAttempts).omit({ id: true, createdAt: true } as never);


export type HrCapitalCourse = typeof hrCapitalCourses.$inferSelect;

export type InsertHrCapitalCourse = z.infer<typeof insertHrCapitalCourseSchema>;

export type HrCapitalModule = typeof hrCapitalModules.$inferSelect;

export type InsertHrCapitalModule = z.infer<typeof insertHrCapitalModuleSchema>;

export type HrCapitalQuizQuestion = typeof hrCapitalQuizQuestions.$inferSelect;

export type InsertHrCapitalQuizQuestion = z.infer<typeof insertHrCapitalQuizQuestionSchema>;

export type HrCapitalQuizAttempt = typeof hrCapitalQuizAttempts.$inferSelect;

export type InsertHrCapitalQuizAttempt = z.infer<typeof insertHrCapitalQuizAttemptSchema>;


// ======== TZ_12 (12-02): Course Progress — video pozitsiya saqlanishi ========
export const courseProgress = pgTable("course_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'set null' }),
  lessonId: varchar("lesson_id").notNull().references(() => lessons.id),
  courseId: varchar("course_id").notNull().references(() => courses.id),
  videoPosition: integer("video_position").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  lastAccessedAt: timestamp("last_accessed_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCourseProgressSchema = createInsertSchema(courseProgress).omit({ id: true, createdAt: true } as never);

export type CourseProgress = typeof courseProgress.$inferSelect;

export type InsertCourseProgress = z.infer<typeof insertCourseProgressSchema>;

