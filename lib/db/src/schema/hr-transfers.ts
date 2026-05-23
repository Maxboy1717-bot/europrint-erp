/**
 * @module hr-transfers
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { numericMoney } from "./numeric-money";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./core-schema";

export { employeeTransferHistory, insertEmployeeTransferHistorySchema, InsertEmployeeTransferHistory, EmployeeTransferHistory } from "./assessment";


// Employee Strengths & Weaknesses (AI tomonidan aniqlangan kuchli/zaif tomonlar)
export { employeeStrengthsWeaknesses, insertEmployeeStrengthsWeaknessesSchema, InsertEmployeeStrengthsWeaknesses, EmployeeStrengthsWeakness } from "./assessment";


// Employee Comparison Logs (Xodimlarni solishtirish tarixi)
export const employeeComparisonLogs = pgTable("employee_comparison_logs", {
  id: serial("id").primaryKey(),
  comparedBy: varchar("compared_by").references(() => users.id, { onDelete: 'set null' }),
  employee1Id: varchar("employee1_id").references(() => users.id, { onDelete: "restrict" }).notNull(),
  employee2Id: varchar("employee2_id").references(() => users.id, { onDelete: "restrict" }).notNull(),
  comparisonDate: varchar("comparison_date", { length: 10 }).notNull(), // YYYY-MM-DD
  comparisonType: varchar("comparison_type", { length: 50 }).notNull().default("performance"), // performance, productivity, attendance
  results: jsonb("results"), // Solishtirish natijalari
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const insertEmployeeComparisonLogSchema = createInsertSchema(employeeComparisonLogs, {
  comparisonDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  comparisonType: z.enum(["performance", "productivity", "attendance"]),
}).omit({ id: true, createdAt: true } as never);


export type EmployeeComparisonLog = typeof employeeComparisonLogs.$inferSelect;

export type InsertEmployeeComparisonLog = z.infer<typeof insertEmployeeComparisonLogSchema>;


// Employee Productivity (Xodim samaradorligi - kamera asosida)
export { employeeProductivity, insertEmployeeProductivitySchema, InsertEmployeeProductivity, EmployeeProductivity } from "./kpi";


// ========== AI CAMERA FACE RECOGNITION ==========

// Face Embeddings (Yuz vektorlari)
export const faceEmbeddings = pgTable("face_embeddings", {
  id: serial("id").primaryKey(),
  employeeId: varchar("employee_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  embedding: text("embedding").notNull(), // AES-256 encrypted face vector
  imageUrl: text("image_url"), // Original face image URL
  isActive: boolean("is_active").default(true),
  confidence: numericMoney("confidence").default(0), // Quality score of the embedding
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const insertFaceEmbeddingSchema = createInsertSchema(faceEmbeddings, {
  embedding: z.array(z.number()),
}).omit({ id: true, createdAt: true } as never);


export type FaceEmbedding = typeof faceEmbeddings.$inferSelect;

export type InsertFaceEmbedding = z.infer<typeof insertFaceEmbeddingSchema>;


// Daily Attendance Summary (Kunlik davomad xulosasi)
export { dailyAttendanceSummary, insertDailyAttendanceSummarySchema, InsertDailyAttendanceSummary, DailyAttendanceSummary } from "./attendance";


// Face Recognition Logs (Yuz aniqlash loglari)