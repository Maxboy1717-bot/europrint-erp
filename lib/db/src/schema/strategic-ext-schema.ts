/**
 * @module strategic-ext-schema
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { numericMoney } from "./numeric-money";
import { sql } from "drizzle-orm";
import { pgTable, varchar, text, integer, boolean, timestamp, jsonb, numeric, date, serial, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users, departments } from "./core-schema";

// ============================================================
// STRATEGIK REJALASHTIRISH
// ============================================================

export const strategicCategories = pgTable("strategic_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),
  color: varchar("color", { length: 20 }).default("#3B82F6"),
  icon: varchar("icon", { length: 50 }),
  parentId: varchar("parent_id"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const strategicTasks = pgTable("strategic_tasks", {
  id: serial("id").primaryKey(),
  taskNumber: integer("task_number").notNull(),
  categoryId: varchar("category_id").references(() => strategicCategories.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  titleRu: text("title_ru"),
  description: text("description"),
  descriptionRu: text("description_ru"),
  priority: varchar("priority", { length: 20 }).notNull().default("medium"),
  status: varchar("status", { length: 30 }).notNull().default("planned"),
  phase: varchar("phase", { length: 30 }),
  targetModule: varchar("target_module", { length: 50 }),
  assignedDepartmentId: varchar("assigned_department_id").references(() => departments.id, { onDelete: "set null" }),
  assignedUserId: varchar("assigned_user_id").references(() => users.id, { onDelete: "set null" }),
  startDate: varchar("start_date", { length: 10 }),
  targetDate: varchar("target_date", { length: 10 }),
  completedDate: varchar("completed_date", { length: 10 }),
  progressPercent: integer("progress_percent").notNull().default(0),
  estimatedHours: numericMoney("estimated_hours"),
  actualHours: numericMoney("actual_hours"),
  kpiImpact: text("kpi_impact"),
  aiRecommendation: text("ai_recommendation"),
  aiPriority: numericMoney("ai_priority"),
  dependencies: jsonb("dependencies"),
  tags: jsonb("tags"),
  notes: text("notes"),
  isAutomatable: boolean("is_automatable").default(false),
  automationLevel: varchar("automation_level", { length: 20 }),
  industryAdaptable: boolean("industry_adaptable").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  check("strategic_tasks_priority_chk", sql`${t.priority} IN ('low','medium','high','critical')`),
  check("strategic_tasks_status_chk", sql`${t.status} IN ('planned','in_progress','testing','completed','on_hold','cancelled')`),
]);

export const strategicMilestones = pgTable("strategic_milestones", {
  id: serial("id").primaryKey(),
  taskId: varchar("task_id").notNull().references(() => strategicTasks.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  titleRu: text("title_ru"),
  targetDate: varchar("target_date", { length: 10 }),
  completedDate: varchar("completed_date", { length: 10 }),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("strategic_milestones_status_chk", sql`${t.status} IN ('pending','in_progress','completed','overdue')`),
]);

export const insertStrategicCategorySchema = createInsertSchema(strategicCategories, {
  name: z.string().min(1, "Kategoriya nomi kerak"),
  code: z.string().min(1, "Kod kerak"),
}).omit({ id: true, createdAt: true } as never);

export const insertStrategicTaskSchema = createInsertSchema(strategicTasks, {
  taskNumber: z.number().int().positive(),
  title: z.string().min(1, "Vazifa nomi kerak"),
  priority: z.enum(["low", "medium", "high", "critical"]),
  status: z.enum(["planned", "in_progress", "testing", "completed", "on_hold", "cancelled"]),
  progressPercent: z.number().int().min(0).max(100),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export const insertStrategicMilestoneSchema = createInsertSchema(strategicMilestones, {
  title: z.string().min(1, "Bosqich nomi kerak"),
  status: z.enum(["pending", "in_progress", "completed", "overdue"]),
}).omit({ id: true, createdAt: true } as never);

export type StrategicCategory = typeof strategicCategories.$inferSelect;
export type InsertStrategicCategory = z.infer<typeof insertStrategicCategorySchema>;
export type StrategicTask = typeof strategicTasks.$inferSelect;
export type InsertStrategicTask = z.infer<typeof insertStrategicTaskSchema>;
export type StrategicMilestone = typeof strategicMilestones.$inferSelect;
export type InsertStrategicMilestone = z.infer<typeof insertStrategicMilestoneSchema>;

// ============================================================
// TOKEN BLACKLIST
// ============================================================

export const tokenBlacklist = pgTable("token_blacklist", {
  id: serial("id").primaryKey(),
  token: text("token").notNull(),
  userId: varchar("user_id"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================
// 7 TA ASOSIY FUNKSIYA MODELI (Vysotskiy)
// ============================================================

export const companyFunctions = pgTable("company_functions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  nameRu: varchar("name_ru", { length: 100 }),
  description: text("description"),
  descriptionRu: text("description_ru"),
  icon: varchar("icon", { length: 50 }),
  color: varchar("color", { length: 20 }),
  orderIndex: integer("order_index"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const functionKpis = pgTable("function_kpis", {
  id: serial("id").primaryKey(),
  functionId: varchar("function_id").notNull().references(() => companyFunctions.id, { onDelete: "cascade" }),
  kpiName: varchar("kpi_name", { length: 200 }).notNull(),
  kpiNameRu: varchar("kpi_name_ru", { length: 200 }),
  description: text("description"),
  measurementUnit: varchar("measurement_unit", { length: 50 }),
  targetValue: numeric("target_value", { precision: 10, scale: 2 }),
  currentValue: numeric("current_value", { precision: 10, scale: 2 }),
  calculationFormula: text("calculation_formula"),
  updateFrequency: varchar("update_frequency", { length: 50 }).default("monthly"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCompanyFunctionSchema = createInsertSchema(companyFunctions).omit({ id: true, createdAt: true } as never);
export const insertFunctionKpiSchema = createInsertSchema(functionKpis).omit({ id: true, createdAt: true } as never);

export type CompanyFunction = typeof companyFunctions.$inferSelect;
export type InsertCompanyFunction = z.infer<typeof insertCompanyFunctionSchema>;
export type FunctionKpi = typeof functionKpis.$inferSelect;
export type InsertFunctionKpi = z.infer<typeof insertFunctionKpiSchema>;

// ============================================================
// RACI MATRIX
// ============================================================

export const raciTasks = pgTable("raci_tasks", {
  id: serial("id").primaryKey(),
  taskName: varchar("task_name", { length: 200 }).notNull(),
  taskNameRu: varchar("task_name_ru", { length: 200 }),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const raciAssignments = pgTable("raci_assignments", {
  id: serial("id").primaryKey(),
  taskId: varchar("task_id").notNull().references(() => raciTasks.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  role: varchar("role", { length: 20 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRaciTaskSchema = createInsertSchema(raciTasks).omit({ id: true, createdAt: true } as never);
export const insertRaciAssignmentSchema = createInsertSchema(raciAssignments).omit({ id: true, createdAt: true } as never);

export type RaciTask = typeof raciTasks.$inferSelect;
export type InsertRaciTask = z.infer<typeof insertRaciTaskSchema>;
export type RaciAssignment = typeof raciAssignments.$inferSelect;
export type InsertRaciAssignment = z.infer<typeof insertRaciAssignmentSchema>;

// ============================================================
// BIZNES KRIZISLAR VA O'SISH BOSQICHLARI
// ============================================================

export const businessStages = pgTable("business_stages", {
  id: serial("id").primaryKey(),
  stageNumber: integer("stage_number"),
  name: varchar("name", { length: 100 }).notNull(),
  nameRu: varchar("name_ru", { length: 100 }),
  description: text("description"),
  descriptionRu: text("description_ru"),
  typicalEmployeeCount: varchar("typical_employee_count", { length: 50 }),
  typicalRevenueRange: varchar("typical_revenue_range", { length: 100 }),
  keyChallenges: text("key_challenges").array(),
  successFactors: text("success_factors").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const businessCrises = pgTable("business_crises", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  nameRu: varchar("name_ru", { length: 100 }),
  description: text("description"),
  descriptionRu: text("description_ru"),
  symptoms: text("symptoms").array(),
  solutions: text("solutions").array(),
  preventionTips: text("prevention_tips").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const companyHealthAssessment = pgTable("company_health_assessment", {
  id: serial("id").primaryKey(),
  assessmentDate: date("assessment_date").notNull(),
  currentStageId: varchar("current_stage_id").references(() => businessStages.id, { onDelete: "set null" }),
  employeeCount: integer("employee_count"),
  monthlyRevenue: numeric("monthly_revenue", { precision: 15, scale: 2 }),
  identifiedCrises: text("identified_crises").array(),
  aiRecommendations: jsonb("ai_recommendations"),
  overallHealthScore: integer("overall_health_score"),
  assessedBy: varchar("assessed_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBusinessStageSchema = createInsertSchema(businessStages).omit({ id: true, createdAt: true } as never);
export const insertBusinessCrisisSchema = createInsertSchema(businessCrises).omit({ id: true, createdAt: true } as never);
export const insertCompanyHealthAssessmentSchema = createInsertSchema(companyHealthAssessment).omit({ id: true, createdAt: true } as never);

export type BusinessStage = typeof businessStages.$inferSelect;
export type InsertBusinessStage = z.infer<typeof insertBusinessStageSchema>;
export type BusinessCrisis = typeof businessCrises.$inferSelect;
export type InsertBusinessCrisis = z.infer<typeof insertBusinessCrisisSchema>;
export type CompanyHealthAssessment = typeof companyHealthAssessment.$inferSelect;
export type InsertCompanyHealthAssessment = z.infer<typeof insertCompanyHealthAssessmentSchema>;

// ============================================================
// ORG CHART SOZLAMALARI
// ============================================================

export const orgChartSettings = pgTable("org_chart_settings", {
  id: serial("id").primaryKey(),
  companyName: varchar("company_name", { length: 200 }),
  ceoUserId: varchar("ceo_user_id").references(() => users.id, { onDelete: "set null" }),
  chartStyle: varchar("chart_style", { length: 50 }).default("hierarchical"),
  showPhotos: boolean("show_photos").default(true),
  showContactInfo: boolean("show_contact_info").default(false),
  colorBy: varchar("color_by", { length: 50 }).default("department"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orgChartSnapshots = pgTable("org_chart_snapshots", {
  id: serial("id").primaryKey(),
  snapshotDate: date("snapshot_date").notNull(),
  chartData: jsonb("chart_data").notNull(),
  employeeCount: integer("employee_count"),
  departmentCount: integer("department_count"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOrgChartSettingsSchema = createInsertSchema(orgChartSettings).omit({ id: true, updatedAt: true } as never);
export const insertOrgChartSnapshotSchema = createInsertSchema(orgChartSnapshots).omit({ id: true, createdAt: true } as never);

export type OrgChartSettings = typeof orgChartSettings.$inferSelect;
export type InsertOrgChartSettings = z.infer<typeof insertOrgChartSettingsSchema>;
export type OrgChartSnapshot = typeof orgChartSnapshots.$inferSelect;
export type InsertOrgChartSnapshot = z.infer<typeof insertOrgChartSnapshotSchema>;

// ============================================================
// OKR (Objectives and Key Results)
// ============================================================

export const okrObjectives = pgTable("okr_objectives", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: varchar("type", { length: 20 }).notNull().default("company"),
  departmentId: integer("department_id").references(() => departments.id, { onDelete: "set null" }),
  ownerId: integer("owner_id").references(() => users.id, { onDelete: "set null" }),
  quarter: varchar("quarter", { length: 2 }),
  year: integer("year").notNull(),
  description: text("description"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  progressPercent: integer("progress_percent").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  check("okr_objectives_type_chk", sql`${t.type} IN ('company','department','individual')`),
  check("okr_objectives_status_chk", sql`${t.status} IN ('active','completed','cancelled','on_hold')`),
]);

export const okrKeyResults = pgTable("okr_key_results", {
  id: serial("id").primaryKey(),
  objectiveId: integer("objective_id").notNull().references(() => okrObjectives.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  targetValue: numeric("target_value", { precision: 12, scale: 2 }),
  currentValue: numeric("current_value", { precision: 12, scale: 2 }).default("0"),
  unit: varchar("unit", { length: 50 }),
  status: varchar("status", { length: 20 }).notNull().default("on_track"),
  dueDate: varchar("due_date", { length: 10 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  check("okr_key_results_status_chk", sql`${t.status} IN ('on_track','at_risk','behind','completed')`),
]);

export const insertOkrObjectiveSchema = createInsertSchema(okrObjectives, {
  title: z.string().min(1, "Maqsad nomi kerak"),
  type: z.enum(["company", "department", "individual"]).default("company"),
  quarter: z.enum(["Q1", "Q2", "Q3", "Q4"]).optional(),
  year: z.number().int().min(2020).max(2030),
  status: z.enum(["active", "completed", "cancelled", "on_hold"]).default("active"),
  progressPercent: z.number().int().min(0).max(100).default(0),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export const insertOkrKeyResultSchema = createInsertSchema(okrKeyResults, {
  title: z.string().min(1, "Natija nomi kerak"),
  targetValue: z.number().positive().optional(),
  currentValue: z.number().nonnegative().default(0),
  status: z.enum(["on_track", "at_risk", "behind", "completed"]).default("on_track"),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type OkrObjective = typeof okrObjectives.$inferSelect;
export type InsertOkrObjective = z.infer<typeof insertOkrObjectiveSchema>;
export type OkrKeyResult = typeof okrKeyResults.$inferSelect;
export type InsertOkrKeyResult = z.infer<typeof insertOkrKeyResultSchema>;

// ============================================================
// RACI MATRIX (extended — task/employee/role junction)
// NOTE: raci_tasks and raci_assignments (named-role RACI) are above.
//       raci_matrix is a simpler legacy junction used by older reports.
// Canonical source: apps/api/src/shared/db/schema-ext-b-2.ts
// ============================================================

export const raciMatrix = pgTable('raci_matrix', {
  id:         serial('id').primaryKey(),
  taskId:     integer('task_id'),
  employeeId: integer('employee_id'),
  roleType:   text('role_type'),
  stageId:    integer('stage_id'),
  createdAt:  timestamp('created_at').notNull().defaultNow(),
});

export const insertRaciMatrixSchema = createInsertSchema(raciMatrix).omit({ id: true, createdAt: true } as never);
export type RaciMatrix = typeof raciMatrix.$inferSelect;
export type InsertRaciMatrix = z.infer<typeof insertRaciMatrixSchema>;
