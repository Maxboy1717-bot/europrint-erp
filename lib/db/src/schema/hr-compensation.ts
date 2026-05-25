/**
 * @module hr-compensation
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, serial, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { admins, users } from "./core-schema";
import { certificates, employeePassports, employeeBankAccounts, employeeEmergencyContacts, employmentContracts, salaryHistory, cashAdvances, bonusPayments, employeeFines, overtimePayments, leaveRequests, sickLeaves, businessTrips, questionnaireTemplates, questionnaireQuestions, questionnaireResponses, jobTemplates, vacancies, candidates, interviews, insertQuestionnaireTemplateSchema, insertQuestionnaireQuestionSchema, insertQuestionnaireResponseSchema, insertJobTemplateSchema, insertVacancySchema, insertCandidateSchema, insertInterviewSchema } from "./hr-recruitment";
import { positionRequiredCourses, disciplineRecords, attendance } from "./hr-personal-core";

// Re-exports from canonical files
export { abcAnalysis, insertAbcAnalysisSchema } from "./attendance";
export type { AbcAnalysis, InsertAbcAnalysis } from "./attendance";
export { employeeFiles, insertEmployeeFileSchema } from "./employees";
export type { EmployeeFile, InsertEmployeeFile } from "./employees";


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
  assignedTo: integer("assigned_to").references(() => users.id, { onDelete: "set null" }), // Kim ko'rib chiqadi (mas'ul)
  implementerId: varchar("implementer_id").references(() => users.id, { onDelete: "set null" }), // Kim amalga oshiradi
  // Resurslar va muddatlar
  estimatedCost: text("estimated_cost"), // Taxminiy xarajat
  estimatedDuration: varchar("estimated_duration", { length: 100 }), // Taxminiy muddat (masalan: "2 hafta", "1 oy")
  // Ko'rib chiqish
  reviewedBy: varchar("reviewed_by").references(() => admins.id, { onDelete: "set null" }),
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
}, (t) => [
  check("employee_ideas_category_chk", sql`${t.category} IN ('process_improvement','cost_reduction','quality','safety','innovation','other')`),
  check("employee_ideas_status_chk", sql`${t.status} IN ('pending','under_review','in_discussion','approved','implemented','rejected','returned')`),
  check("employee_ideas_likes_chk", sql`${t.likes} >= 0 AND ${t.views} >= 0`),
]);


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
// Re-export from canonical adaptation.ts
export { adaptationPrograms, insertAdaptationProgramSchema } from "./adaptation";
export type { AdaptationProgram, InsertAdaptationProgram } from "./adaptation";