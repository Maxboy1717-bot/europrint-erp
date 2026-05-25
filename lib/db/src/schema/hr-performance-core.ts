/**
 * @module hr-performance-core
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { numericMoney } from "./numeric-money";
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, serial, unique, uuid, index, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { Admin, Position, admins, departments, positions, users } from "./core-schema";
import { cameraZones, cameras } from "./iot-schema";
import { Mentor, courses, progress, skills } from "./lms-schema";
import { workCenters } from "./pp-schema";
// adaptationRecords — canonical: adaptation.ts
import { adaptationRecords as newEmployees } from "./adaptation";
export { adaptationRecords, insertAdaptationRecordSchema } from "./adaptation";
export type { AdaptationRecord, InsertAdaptationRecord } from "./adaptation";

// newEmployees alias kept for backward compatibility
export { adaptationRecords as newEmployees } from "./adaptation";
export { insertAdaptationRecordSchema as insertNewEmployeeSchema } from "./adaptation";


// Adaptatsiya bo'yicha feedbacklar (1 hafta, 1 oy, 3 oy suhbatlari)
export const adaptationFeedback = pgTable("adaptation_feedback", {
  id: serial("id").primaryKey(),
  newEmployeeId: varchar("new_employee_id").notNull().references(() => newEmployees.id, { onDelete: "cascade" }),
  feedbackType: varchar("feedback_type", { length: 20 }).notNull(), // week1, month1, month3, final
  scheduledDate: varchar("scheduled_date", { length: 10 }).notNull(), // YYYY-MM-DD
  completedDate: varchar("completed_date", { length: 10 }), // YYYY-MM-DD
  conductedBy: varchar("conducted_by").references(() => admins.id, { onDelete: "set null" }), // Kim o'tkazdi
  rating: integer("rating"), // 1-5 ball
  satisfactionLevel: varchar("satisfaction_level", { length: 20 }), // very_low, low, medium, high, very_high
  strengths: text("strengths"), // Kuchli tomonlar
  weaknesses: text("weaknesses"), // Zaif tomonlar
  suggestions: text("suggestions"), // Takliflar
  employeeFeedback: text("employee_feedback"), // Xodimning o'z fikrini
  mentorFeedback: text("mentor_feedback"), // Mentorning fikrini
  actionItems: jsonb("action_items"), // [{action, deadline, responsible}]
  status: varchar("status", { length: 20 }).notNull().default("scheduled"), // scheduled, completed, cancelled
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  check("adaptation_feedback_type_chk", sql`${t.feedbackType} IN ('week1','month1','month3','final')`),
  check("adaptation_feedback_status_chk", sql`${t.status} IN ('scheduled','completed','cancelled')`),
  check("adaptation_feedback_rating_chk", sql`${t.rating} IS NULL OR (${t.rating} >= 1 AND ${t.rating} <= 5)`),
  check("adaptation_feedback_sat_chk", sql`${t.satisfactionLevel} IS NULL OR ${t.satisfactionLevel} IN ('very_low','low','medium','high','very_high')`),
]);


export const insertAdaptationFeedbackSchema = createInsertSchema(adaptationFeedback, {
  feedbackType: z.enum(["week1", "month1", "month3", "final"]),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  completedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak").optional(),
  rating: z.number().min(1).max(5).optional(),
  satisfactionLevel: z.enum(["very_low", "low", "medium", "high", "very_high"]).optional(),
  status: z.enum(["scheduled", "completed", "cancelled"]).default("scheduled"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as never);


export type AdaptationFeedback = typeof adaptationFeedback.$inferSelect;

export type InsertAdaptationFeedback = z.infer<typeof insertAdaptationFeedbackSchema>;


// Employee Work Centers (xodim ↔ ish markazi mapping)
export const employeeWorkCenters = pgTable("employee_work_centers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'set null' }),
  workCenterId: varchar("work_center_id").notNull().references(() => workCenters.id, { onDelete: "cascade" }),
  isPrimary: boolean("is_primary").notNull().default(false), // Asosiy ish markazi
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const insertEmployeeWorkCenterSchema = createInsertSchema(employeeWorkCenters).omit({
  id: true,
  createdAt: true,
} as never);


export type EmployeeWorkCenter = typeof employeeWorkCenters.$inferSelect;

export type InsertEmployeeWorkCenter = z.infer<typeof insertEmployeeWorkCenterSchema>;


// ========== 5. KAMERA FACE RECOGNITION VA XODIM MONITORING ==========

// Employee Face Encodings (Xodimlarning yuz ma'lumotlari)
export const employeeFaceEncodings = pgTable("employee_face_encodings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  encodingData: text("encoding_data").notNull(), // Face encoding (JSON string or base64)
  faceImageUrl: text("face_image_url"), // Original face image URL
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const insertEmployeeFaceEncodingSchema = createInsertSchema(employeeFaceEncodings, {
  encodingData: z.string().min(1, "Encoding data talab qilinadi"),
}).omit({ id: true, createdAt: true, uploadedAt: true } as never);


export type EmployeeFaceEncoding = typeof employeeFaceEncodings.$inferSelect;

export type InsertEmployeeFaceEncoding = z.infer<typeof insertEmployeeFaceEncodingSchema>;


// Employee Performance Metrics (Xodim samaradorligi metrikalar)
export const employeePerformanceMetrics = pgTable("employee_performance_metrics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  metricDate: varchar("metric_date", { length: 10 }).notNull(), // YYYY-MM-DD
  periodType: varchar("period_type", { length: 20 }).notNull().default("daily"), // daily, weekly, monthly
  // Vaqt metrikalar
  totalWorkMinutes: integer("total_work_minutes").notNull().default(0), // Jami ish vaqti (minut)
  plannedWorkMinutes: integer("planned_work_minutes").notNull().default(480), // Rejalashtirilgan vaqt (8 soat)
  // Samaradorlik metrikalar
  productivityScore: numericMoney("productivity_score"), // Samaradorlik bali (0-10)
  qualityScore: numericMoney("quality_score"), // Sifat bali (0-10)
  speedScore: numericMoney("speed_score"), // Tezlik bali (0-10)
  attendanceScore: numericMoney("attendance_score"), // Davomat bali (0-10)
  // Umumiy rating
  overallRating: numericMoney("overall_rating"), // Umumiy rating (0-10)
  // Qo'shimcha ma'lumotlar
  absenceDays: integer("absence_days").notNull().default(0), // Yo'qlamalar soni
  overtimeMinutes: integer("overtime_minutes").notNull().default(0), // Ortiqcha ish vaqti
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("emp_perf_metrics_period_chk", sql`${t.periodType} IN ('daily','weekly','monthly')`),
  check("emp_perf_metrics_work_min_chk", sql`${t.totalWorkMinutes} >= 0 AND ${t.plannedWorkMinutes} > 0`),
  check("emp_perf_metrics_overtime_chk", sql`${t.overtimeMinutes} >= 0`),
]);


export const insertEmployeePerformanceMetricSchema = createInsertSchema(employeePerformanceMetrics, {
  metricDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  periodType: z.enum(["daily", "weekly", "monthly"]),
  totalWorkMinutes: z.number().int().nonnegative(),
  plannedWorkMinutes: z.number().int().positive(),
  absenceDays: z.number().int().nonnegative(),
  overtimeMinutes: z.number().int().nonnegative(),
}).omit({ id: true, createdAt: true } as never);


export type EmployeePerformanceMetric = typeof employeePerformanceMetrics.$inferSelect;

export type InsertEmployeePerformanceMetric = z.infer<typeof insertEmployeePerformanceMetricSchema>;


// Employee Transfer History (Xodimlarning bo'lim/lavozim o'zgarishlari)