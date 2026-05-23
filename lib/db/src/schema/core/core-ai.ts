/**
 * @module core-ai
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { sql } from "drizzle-orm";
import { serial, pgTable, text, varchar, integer, boolean, timestamp, jsonb, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { AdaptationRecord, InsertAdaptationRecord } from "../hr-schema";
import { admins } from "./core-users";

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(),
  targetType: varchar("target_type", { length: 20 }).notNull(),
  targetId: varchar("target_id"),
  metric: varchar("metric", { length: 50 }).notNull(),
  currentValue: integer("current_value").notNull().default(0),
  targetValue: integer("target_value").notNull(),
  startDate: varchar("start_date", { length: 10 }).notNull(),
  endDate: varchar("end_date", { length: 10 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  priority: varchar("priority", { length: 20 }).notNull().default("medium"),
  createdBy: varchar("created_by").references(() => admins.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  check("goals_category_chk", sql`${t.category} IN ('learning','completion','engagement','performance','retention')`),
  check("goals_target_type_chk", sql`${t.targetType} IN ('department','position','user','global')`),
  check("goals_status_chk", sql`${t.status} IN ('active','completed','failed','cancelled')`),
  check("goals_priority_chk", sql`${t.priority} IN ('low','medium','high','critical')`),
]);

export const insertGoalSchema = createInsertSchema(goals, {
  title: z.string().min(3, "Sarlavha kamida 3 ta belgidan iborat bo'lishi kerak"),
  category: z.enum(["learning", "completion", "engagement", "performance", "retention"]),
  targetType: z.enum(["department", "position", "user", "global"]),
  metric: z.string().min(1, "Metrika tanlanishi kerak"),
  targetValue: z.number().min(1, "Maqsad qiymati 0 dan katta bo'lishi kerak"),
  status: z.enum(["active", "completed", "failed", "cancelled"]).default("active"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
}).omit({ id: true, createdAt: true, updatedAt: true, currentValue: true } as never);

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;

export const benchmarks = pgTable("benchmarks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(),
  metric: varchar("metric", { length: 50 }).notNull(),
  value: integer("value").notNull(),
  source: text("source"),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").references(() => admins.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  check("benchmarks_category_chk", sql`${t.category} IN ('industry','company','department','custom')`),
]);

export const insertBenchmarkSchema = createInsertSchema(benchmarks, {
  name: z.string().min(3, "Nomi kamida 3 ta belgidan iborat bo'lishi kerak"),
  category: z.enum(["industry", "company", "department", "custom"]),
  metric: z.string().min(1, "Metrika tanlanishi kerak"),
  value: z.number().min(0, "Qiymat 0 dan katta yoki teng bo'lishi kerak"),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type Benchmark = typeof benchmarks.$inferSelect;
export type InsertBenchmark = z.infer<typeof insertBenchmarkSchema>;


export const aiInsights = pgTable("ai_insights", {
  id: serial("id").primaryKey(),
  category: varchar("category", { length: 50 }).notNull(),
  targetId: varchar("target_id"),
  insightType: varchar("insight_type", { length: 50 }).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  severity: varchar("severity", { length: 20 }).notNull().default("info"),
  actionItems: jsonb("action_items"),
  isRead: boolean("is_read").notNull().default(false),
  validUntil: timestamp("valid_until"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("ai_insights_severity_chk", sql`${t.severity} IN ('info','warning','critical','success')`),
]);

export const insertAiInsightSchema = createInsertSchema(aiInsights, {
  title: z.string().min(3, "Sarlavha kamida 3 ta belgidan iborat bo'lishi kerak"),
  content: z.string().min(10, "Kontent kamida 10 ta belgidan iborat bo'lishi kerak"),
  severity: z.enum(["info", "warning", "critical", "success"]).default("info"),
}).omit({ id: true, createdAt: true } as never);

export type AiInsight = typeof aiInsights.$inferSelect;
export type InsertAiInsight = z.infer<typeof insertAiInsightSchema>;

export type NewEmployee = AdaptationRecord;
export type InsertNewEmployee = InsertAdaptationRecord;
