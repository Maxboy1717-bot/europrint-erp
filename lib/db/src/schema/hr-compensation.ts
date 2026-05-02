import { numericMoney } from "./numeric-money";
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, serial, unique, uuid, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { Admin, Position, admins, departments, positions, users } from "./core-schema";
import { cameraZones, cameras } from "./iot-schema";
import { Mentor, courses, progress, skills } from "./lms-schema";
import { workCenters } from "./pp-schema";
import { certificates, employeePassports, employeeBankAccounts, employeeEmergencyContacts, employmentContracts, salaryHistory, cashAdvances, bonusPayments, employeeFines, overtimePayments, leaveRequests, sickLeaves, businessTrips, questionnaireTemplates, questionnaireQuestions, questionnaireResponses, jobTemplates, vacancies, candidates, interviews, insertQuestionnaireTemplateSchema, insertQuestionnaireQuestionSchema, insertQuestionnaireResponseSchema, insertJobTemplateSchema, insertVacancySchema, insertCandidateSchema, insertInterviewSchema } from "./hr-recruitment";
import { positionRequiredCourses, disciplineRecords, attendance } from "./hr-personal-core";

export const abcAnalysis = pgTable("abc_analysis", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  grade: varchar("grade", { length: 1 }).notNull().default("C"), // A, B, C
  score: integer("score").notNull().default(3), // 5=A, 4=B, 3=C
  performanceRate: integer("performance_rate").default(0), // 0-200% (100+ is A)
  attendanceRate: integer("attendance_rate").default(0), // 0-100%
  punctualityRate: integer("punctuality_rate").default(0), // 0-100% (kech qolmaslik)
  disciplineScore: integer("discipline_score").default(0), // -10 to +10 (jarima va mukofotlar asosida)
  courseCompletionRate: integer("course_completion_rate").default(0), // 0-100%
  testPassRate: integer("test_pass_rate").default(0), // 0-100%
  taskCompletionRate: integer("task_completion_rate").default(0), // 0-100% (topshiriqlar bajarish)
  initiativeCount: integer("initiative_count").default(0), // Takliflar soni
  loyaltyScore: integer("loyalty_score").default(0), // 0-100% (kompaniyaga sodiqlik)
  benefits: jsonb("benefits"), // ["loan", "trip", "salary_increase", "bonus"]
  notes: text("notes"), // Qo'shimcha izohlar
  notesRu: text("notes_ru"),
  lastCalculated: timestamp("last_calculated").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});


// Position Required Courses schemas
export const insertPositionRequiredCourseSchema = createInsertSchema(positionRequiredCourses).omit({
  id: true,
  createdAt: true,
} as never);


export type PositionRequiredCourse = typeof positionRequiredCourses.$inferSelect;

export type InsertPositionRequiredCourse = z.infer<typeof insertPositionRequiredCourseSchema>;


// Discipline Records schemas
export const insertDisciplineRecordSchema = createInsertSchema(disciplineRecords).omit({
  id: true,
  createdAt: true,
} as never);


export type DisciplineRecord = typeof disciplineRecords.$inferSelect;

export type InsertDisciplineRecord = z.infer<typeof insertDisciplineRecordSchema>;


// Attendance schemas
export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  createdAt: true,
} as never);


export type Attendance = typeof attendance.$inferSelect;

export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;


// ABC Analysis schemas
export const insertAbcAnalysisSchema = createInsertSchema(abcAnalysis).omit({
  id: true,
  lastCalculated: true,
  updatedAt: true,
} as never);


export type AbcAnalysis = typeof abcAnalysis.$inferSelect;

export type InsertAbcAnalysis = z.infer<typeof insertAbcAnalysisSchema>;


// Employee Files (Xodim fayllari - papkasi)
export const employeeFiles = pgTable("employee_files", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'set null' }),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(), // Object storage path
  fileType: varchar("file_type", { length: 50 }), // PDF, DOCX, XLSX, JPG, etc.
  fileSize: integer("file_size"), // bytes
  description: text("description"), // Fayl haqida ma'lumot
  uploadedBy: varchar("uploaded_by").references(() => admins.id), // Kim yukladi
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const insertEmployeeFileSchema = createInsertSchema(employeeFiles).omit({
  id: true,
  createdAt: true,
} as never);


export type EmployeeFile = typeof employeeFiles.$inferSelect;

export type InsertEmployeeFile = z.infer<typeof insertEmployeeFileSchema>;


// Employee Ideas/Suggestions (Xodim g'oyalari/takliflari)
export const employeeIdeas = pgTable("employee_ideas", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  // G'oya tarkibi: muammo-sabab-yechim (yangi g'oyalar uchun majburiy)
  problem: text("problem"), // Muammo nima?
  cause: text("cause"), // Sababi nima?
  solution: text("solution"), // Yechim taklifi
  expectedResult: text("expected_result"), // Kutilayotgan natija
  // Qo'shimcha ma'lumotlar
  description: text("description"), // Qo'shimcha tavsif
  category: varchar("category", { length: 50 }).notNull(), // process_improvement, cost_reduction, quality, safety, innovation, other
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, under_review, in_discussion, approved, implemented, rejected, returned
  // Mas'ul va bajaruvchi
  assignedTo: integer("assigned_to").references(() => users.id), // Kim ko'rib chiqadi (mas'ul)
  implementerId: varchar("implementer_id").references(() => users.id), // Kim amalga oshiradi
  // Resurslar va muddatlar
  estimatedCost: text("estimated_cost"), // Taxminiy xarajat
  estimatedDuration: varchar("estimated_duration", { length: 100 }), // Taxminiy muddat (masalan: "2 hafta", "1 oy")
  // Ko'rib chiqish
  reviewedBy: varchar("reviewed_by").references(() => admins.id),
  reviewedAt: timestamp("reviewed_at"),
  implementedAt: timestamp("implemented_at"),
  // Javoblar va muhokama
  adminNotes: text("admin_notes"), // Admin izohlari
  adminResponse: text("admin_response"), // Xodimga ko'rinadigan javob
  discussionNotes: text("discussion_notes"), // Muhokama yozuvlari
  returnReason: text("return_reason"), // Qaytarilgan sabab
  // Statistika
  likes: integer("likes").notNull().default(0), // Boshqa xodimlar tomonidan yoqtirilganlar
  views: integer("views").notNull().default(0),
  reward: text("reward"), // Mukofot (agar berilgan bo'lsa)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});


export const insertEmployeeIdeaSchema = createInsertSchema(employeeIdeas, {
  title: z.string().min(3, "Sarlavha kamida 3 ta belgidan iborat bo'lishi kerak"),
  problem: z.string().min(10, "Muammo kamida 10 ta belgidan iborat bo'lishi kerak").optional().or(z.literal("")),
  cause: z.string().min(10, "Sabab kamida 10 ta belgidan iborat bo'lishi kerak").optional().or(z.literal("")),
  solution: z.string().min(10, "Yechim kamida 10 ta belgidan iborat bo'lishi kerak").optional().or(z.literal("")),
  category: z.enum(["process_improvement", "cost_reduction", "quality", "safety", "innovation", "other"]),
  status: z.enum(["pending", "under_review", "in_discussion", "approved", "implemented", "rejected", "returned"]).default("pending"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  likes: true,
  views: true,
} as never);


export type EmployeeIdea = typeof employeeIdeas.$inferSelect;

export type InsertEmployeeIdea = z.infer<typeof insertEmployeeIdeaSchema>;


// ==================== ADAPTATSINIYA BO'LIMI ====================

// Adaptatsiya dasturlari (1 kun, 1 hafta, 1 oy, 3 oy rejalar)
export const adaptationPrograms = pgTable("adaptation_programs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(), // Dastur nomi (UZ)
  titleRu: text("title_ru").notNull(), // Dastur nomi (RU)
  description: text("description"), // Tavsif (UZ)
  descriptionRu: text("description_ru"), // Tavsif (RU)
  positionId: integer("position_id").references(() => positions.id), // Qaysi lavozim uchun (null = barcha lavozimlar)
  departmentId: integer("department_id").references(() => departments.id), // Qaysi bo'lim uchun (null = barcha bo'limlar)
  duration: integer("duration").notNull(), // Davomiyligi (kunlarda)
  durationType: varchar("duration_type", { length: 20 }).notNull(), // day, week, month
  tasks: jsonb("tasks").notNull(), // [{title, description, day, isCompleted}]
  checkpoints: jsonb("checkpoints"), // [{day, title, description}] - muhim tekshirish nuqtalari
  mentorRequired: boolean("mentor_required").notNull().default(true),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, archived
  createdBy: varchar("created_by").references(() => admins.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
  deletedBy: varchar("deleted_by"),
});


export const insertAdaptationProgramSchema = createInsertSchema(adaptationPrograms, {
  title: z.string().min(3, "Sarlavha kamida 3 ta belgidan iborat bo'lishi kerak"),
  titleRu: z.string().min(3, "Sarlavha kamida 3 ta belgidan iborat bo'lishi kerak"),
  duration: z.number().min(1, "Davomiylik kamida 1 kun bo'lishi kerak"),
  durationType: z.enum(["day", "week", "month"]),
  status: z.enum(["active", "archived"]).default("active"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as never);


export type AdaptationProgram = typeof adaptationPrograms.$inferSelect;

export type InsertAdaptationProgram = z.infer<typeof insertAdaptationProgramSchema>;


// Adaptatsiya yozuvlari (xodimning adaptatsiya jarayoni)