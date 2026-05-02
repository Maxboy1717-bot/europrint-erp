import { numericMoney } from "./numeric-money";
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, serial, unique, uuid, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { Admin, Position, admins, departments, positions, users } from "./core-schema";
import { cameraZones, cameras } from "./iot-schema";
import { Mentor, courses, progress, skills } from "./lms-schema";
import { workCenters } from "./pp-schema";
import { adaptationPrograms } from "./hr-personal";

export const employeeTransferHistory = pgTable("employee_transfer_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  transferDate: varchar("transfer_date", { length: 10 }).notNull(), // YYYY-MM-DD
  transferType: varchar("transfer_type", { length: 50 }).notNull(), // department, position, work_center, promotion, demotion
  // Eski ma'lumotlar
  fromDepartmentId: varchar("from_department_id").references(() => departments.id, { onDelete: 'set null' }),
  fromPositionId: varchar("from_position_id").references(() => positions.id, { onDelete: 'set null' }),
  fromWorkCenterId: varchar("from_work_center_id").references(() => workCenters.id),
  // Yangi ma'lumotlar
  toDepartmentId: varchar("to_department_id").references(() => departments.id, { onDelete: 'set null' }),
  toPositionId: varchar("to_position_id").references(() => positions.id, { onDelete: 'set null' }),
  toWorkCenterId: varchar("to_work_center_id").references(() => workCenters.id),
  reason: text("reason"), // O'zgarish sababi
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const insertEmployeeTransferHistorySchema = createInsertSchema(employeeTransferHistory, {
  transferDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  transferType: z.enum(["department", "position", "work_center", "promotion", "demotion"]),
}).omit({ id: true, createdAt: true } as never);


export type EmployeeTransferHistory = typeof employeeTransferHistory.$inferSelect;

export type InsertEmployeeTransferHistory = z.infer<typeof insertEmployeeTransferHistorySchema>;


// Employee Strengths & Weaknesses (AI tomonidan aniqlangan kuchli/zaif tomonlar)
export const employeeStrengthsWeaknesses = pgTable("employee_strengths_weaknesses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  analysisDate: varchar("analysis_date", { length: 10 }).notNull(), // YYYY-MM-DD
  periodType: varchar("period_type", { length: 20 }).notNull().default("monthly"), // weekly, monthly, quarterly
  // Kuchli tomonlar
  strengths: jsonb("strengths").notNull(), // [{category: string, description: string, score: number}]
  // Zaif tomonlar
  weaknesses: jsonb("weaknesses").notNull(), // [{category: string, description: string, score: number}]
  // AI xulosalar
  aiSummary: text("ai_summary"), // GPT tomonidan yaratilgan umumiy xulosalar
  recommendations: text("recommendations"), // Tavsiyalar
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const insertEmployeeStrengthsWeaknessesSchema = createInsertSchema(employeeStrengthsWeaknesses, {
  analysisDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  periodType: z.enum(["weekly", "monthly", "quarterly"]),
  strengths: z.array(z.object({
    category: z.string(),
    description: z.string(),
    score: z.number().min(0).max(10),
  })),
  weaknesses: z.array(z.object({
    category: z.string(),
    description: z.string(),
    score: z.number().min(0).max(10),
  })),
}).omit({ id: true, createdAt: true } as never);


export type EmployeeStrengthsWeaknesses = typeof employeeStrengthsWeaknesses.$inferSelect;

export type InsertEmployeeStrengthsWeaknesses = z.infer<typeof insertEmployeeStrengthsWeaknessesSchema>;


// Employee Comparison Logs (Xodimlarni solishtirish tarixi)
export const employeeComparisonLogs = pgTable("employee_comparison_logs", {
  id: serial("id").primaryKey(),
  comparedBy: varchar("compared_by").references(() => users.id, { onDelete: 'set null' }),
  employee1Id: varchar("employee1_id").references(() => users.id).notNull(),
  employee2Id: varchar("employee2_id").references(() => users.id).notNull(),
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
export const employeeProductivity = pgTable("employee_productivity", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  shift: varchar("shift", { length: 20 }), // 1-smena, 2-smena, 3-smena
  workCenterId: varchar("work_center_id").references(() => workCenters.id),
  // Vaqt statistikasi (daqiqa)
  totalWorkMinutes: integer("total_work_minutes").default(0),
  activeWorkMinutes: integer("active_work_minutes").default(0), // Faol ishlagan
  idleMinutes: integer("idle_minutes").default(0), // Bekor turgan
  breakMinutes: integer("break_minutes").default(0), // Tanaffus
  // Ishlab chiqarish
  unitsProduced: integer("units_produced").default(0), // Ishlab chiqarilgan birliklar
  defectsCount: integer("defects_count").default(0), // Brak soni
  // Xavfsizlik
  safetyViolationsCount: integer("safety_violations_count").default(0),
  // Umumiy ball (AI hisoblaydi)
  productivityScore: numericMoney("productivity_score").default(0), // 0-100
  qualityScore: numericMoney("quality_score").default(0), // 0-100
  safetyScore: numericMoney("safety_score").default(0), // 0-100
  overallScore: numericMoney("overall_score").default(0), // 0-100
  // AI tahlil
  aiNotes: text("ai_notes"),
  aiNotesRu: text("ai_notes_ru"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});


export const insertEmployeeProductivitySchema = createInsertSchema(employeeProductivity, {
  userId: z.string().min(1, "Xodim kerak"),
  date: z.string().min(1, "Sana kerak"),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);


export type EmployeeProductivity = typeof employeeProductivity.$inferSelect;

export type InsertEmployeeProductivity = z.infer<typeof insertEmployeeProductivitySchema>;


// ========== AI CAMERA FACE RECOGNITION ==========

// Face Embeddings (Yuz vektorlari)
export const faceEmbeddings = pgTable("face_embeddings", {
  id: serial("id").primaryKey(),
  employeeId: varchar("employee_id").references(() => users.id).notNull(),
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
export const dailyAttendanceSummary = pgTable("daily_attendance_summary", {
  id: serial("id").primaryKey(),
  employeeId: varchar("employee_id").references(() => users.id).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  firstSeenAt: timestamp("first_seen_at"), // Birinchi marta ko'rilgan
  lastSeenAt: timestamp("last_seen_at"), // Oxirgi marta ko'rilgan
  totalMinutes: integer("total_minutes").default(0), // Jami ishlagan vaqt
  workZoneMinutes: integer("work_zone_minutes").default(0), // Ish zonasida
  restZoneMinutes: integer("rest_zone_minutes").default(0), // Dam olish zonasida
  zonesVisited: jsonb("zones_visited").default([]), // [{zoneId, zoneName, minutes}]
  detectionCount: integer("detection_count").default(0), // Necha marta aniqlandi
  avgConfidence: numericMoney("avg_confidence").default(0), // O'rtacha ishonchlilik
  status: varchar("status", { length: 20 }).default("present"), // present, late, absent, early_leave
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
});


export type DailyAttendanceSummary = typeof dailyAttendanceSummary.$inferSelect;


// Face Recognition Logs (Yuz aniqlash loglari)