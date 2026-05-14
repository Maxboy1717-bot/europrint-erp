/**
 * @module core-ai-reports
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { numericMoney } from "../numeric-money";
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, serial, numeric, unique, decimal, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./core-users";

export const aiPrompts = pgTable("ai_prompts", {
  id: serial("id").primaryKey(),
  promptNumber: varchar("prompt_number", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }),
  promptText: text("prompt_text").notNull(),
  variables: jsonb("variables").default('[]'),
  examples: jsonb("examples").default('[]'),
  usageCount: integer("usage_count").notNull().default(0),
  avgRating: numericMoney("avg_rating"),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAiPromptSchema = createInsertSchema(aiPrompts, {
  promptNumber: z.string().min(1, "Prompt raqami kerak"),
  name: z.string().min(1, "Prompt nomi kerak"),
  promptText: z.string().min(1, "Prompt matni kerak"),
  variables: z.array(z.object({
    name: z.string(),
    description: z.string(),
    example: z.string(),
  })).default([]),
}).omit({ id: true, createdAt: true, updatedAt: true, usageCount: true, avgRating: true } as never);

export type AiPrompt = typeof aiPrompts.$inferSelect;
export type InsertAiPrompt = z.infer<typeof insertAiPromptSchema>;

export const aiReportCategories = pgTable("ai_report_categories", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  nameRu: text("name_ru").notNull(),
  icon: varchar("icon", { length: 50 }),
  color: varchar("color", { length: 20 }),
  reportCount: integer("report_count").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAiReportCategorySchema = createInsertSchema(aiReportCategories, {
  code: z.string().min(1).max(50),
  name: z.string().min(1),
  nameRu: z.string().min(1),
}).omit({ id: true, createdAt: true } as never);

export type AiReportCategory = typeof aiReportCategories.$inferSelect;
export type InsertAiReportCategory = z.infer<typeof insertAiReportCategorySchema>;

export const aiReportDefinitions = pgTable("ai_report_definitions", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 100 }).notNull().unique(),
  categoryId: integer("category_id").references(() => aiReportCategories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  nameRu: text("name_ru").notNull(),
  description: text("description"),
  aiEngines: text("ai_engines").array(),
  schedule: varchar("schedule", { length: 20 }).default("daily"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("ai_report_defs_schedule_chk", sql`${t.schedule} IS NULL OR ${t.schedule} IN ('daily','weekly','monthly','realtime')`),
]);

export const insertAiReportDefinitionSchema = createInsertSchema(aiReportDefinitions, {
  code: z.string().min(1).max(100),
  name: z.string().min(1),
  nameRu: z.string().min(1),
  schedule: z.enum(["daily", "weekly", "monthly", "realtime"]).default("daily"),
}).omit({ id: true, createdAt: true } as never);

export type AiReportDefinition = typeof aiReportDefinitions.$inferSelect;
export type InsertAiReportDefinition = z.infer<typeof insertAiReportDefinitionSchema>;

export const aiReportRuns = pgTable("ai_report_runs", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").references(() => aiReportDefinitions.id, { onDelete: "cascade" }),
  runType: varchar("run_type", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  executionTimeMs: integer("execution_time_ms"),
  dataSnapshot: jsonb("data_snapshot"),
  error: text("error"),
}, (t) => [
  check("ai_report_runs_run_type_chk", sql`${t.runType} IN ('scheduled','manual','triggered')`),
  check("ai_report_runs_status_chk", sql`${t.status} IN ('pending','running','completed','failed')`),
]);

export const insertAiReportRunSchema = createInsertSchema(aiReportRuns, {
  runType: z.enum(["scheduled", "manual", "triggered"]),
  status: z.enum(["pending", "running", "completed", "failed"]).default("pending"),
}).omit({ id: true } as never);

export type AiReportRun = typeof aiReportRuns.$inferSelect;
export type InsertAiReportRun = z.infer<typeof insertAiReportRunSchema>;

export const aiReportInsights = pgTable("ai_report_insights", {
  id: serial("id").primaryKey(),
  reportRunId: integer("report_run_id").references(() => aiReportRuns.id, { onDelete: "cascade" }),
  aiEngine: varchar("ai_engine", { length: 50 }),
  insightType: varchar("insight_type", { length: 50 }),
  severity: varchar("severity", { length: 20 }).default("info"),
  title: text("title").notNull(),
  titleRu: text("title_ru"),
  content: text("content"),
  contentRu: text("content_ru"),
  data: jsonb("data"),
  actionRequired: boolean("action_required").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("ai_report_insights_type_chk", sql`${t.insightType} IS NULL OR ${t.insightType} IN ('analysis','prediction','anomaly','recommendation')`),
  check("ai_report_insights_severity_chk", sql`${t.severity} IS NULL OR ${t.severity} IN ('info','warning','critical')`),
]);

export const insertAiReportInsightSchema = createInsertSchema(aiReportInsights, {
  insightType: z.enum(["analysis", "prediction", "anomaly", "recommendation"]).optional(),
  severity: z.enum(["info", "warning", "critical"]).default("info"),
  title: z.string().min(1),
}).omit({ id: true, createdAt: true } as never);

export type AiReportInsight = typeof aiReportInsights.$inferSelect;
export type InsertAiReportInsight = z.infer<typeof insertAiReportInsightSchema>;

export const aiAlerts = pgTable("ai_alerts", {
  id: serial("id").primaryKey(),
  insightId: integer("insight_id").references(() => aiReportInsights.id, { onDelete: "set null" }),
  reportId: integer("report_id").references(() => aiReportDefinitions.id, { onDelete: "cascade" }),
  alertType: varchar("alert_type", { length: 50 }),
  severity: varchar("severity", { length: 20 }).default("medium"),
  title: text("title").notNull(),
  titleRu: text("title_ru"),
  message: text("message"),
  messageRu: text("message_ru"),
  data: jsonb("data"),
  isRead: boolean("is_read").default(false),
  isResolved: boolean("is_resolved").default(false),
  resolvedById: varchar("resolved_by_id").references(() => users.id, { onDelete: "set null" }),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("ai_alerts_type_chk", sql`${t.alertType} IS NULL OR ${t.alertType} IN ('anomaly','threshold','prediction')`),
  check("ai_alerts_severity_chk", sql`${t.severity} IS NULL OR ${t.severity} IN ('low','medium','high','critical')`),
]);

export const insertAiAlertSchema = createInsertSchema(aiAlerts, {
  alertType: z.enum(["anomaly", "threshold", "prediction"]).optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  title: z.string().min(1),
}).omit({ id: true, createdAt: true } as never);

export type AiAlert = typeof aiAlerts.$inferSelect;
export type InsertAiAlert = z.infer<typeof insertAiAlertSchema>;

export const aiTasks = pgTable("ai_tasks", {
  id: serial("id").primaryKey(),
  insightId: integer("insight_id").references(() => aiReportInsights.id, { onDelete: "set null" }),
  alertId: integer("alert_id").references(() => aiAlerts.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  titleRu: text("title_ru"),
  description: text("description"),
  descriptionRu: text("description_ru"),
  priority: varchar("priority", { length: 20 }).default("medium"),
  status: varchar("status", { length: 20 }).default("pending"),
  assignedToId: varchar("assigned_to_id").references(() => users.id, { onDelete: "set null" }),
  assignedById: varchar("assigned_by_id"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  completionNotes: text("completion_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("ai_tasks_priority_chk", sql`${t.priority} IS NULL OR ${t.priority} IN ('low','medium','high','urgent')`),
  check("ai_tasks_status_chk", sql`${t.status} IS NULL OR ${t.status} IN ('pending','in_progress','completed','cancelled')`),
]);

export const insertAiTaskSchema = createInsertSchema(aiTasks, {
  title: z.string().min(1),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]).default("pending"),
}).omit({ id: true, createdAt: true } as never);

export type AiTask = typeof aiTasks.$inferSelect;
export type InsertAiTask = z.infer<typeof insertAiTaskSchema>;

export const aiReportSubscriptions = pgTable("ai_report_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  reportId: integer("report_id").references(() => aiReportDefinitions.id, { onDelete: "cascade" }),
  deliveryChannel: varchar("delivery_channel", { length: 20 }).default("telegram"),
  schedule: varchar("schedule", { length: 20 }).default("daily"),
  isActive: boolean("is_active").notNull().default(true),
  lastDeliveredAt: timestamp("last_delivered_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("ai_report_subs_channel_chk", sql`${t.deliveryChannel} IS NULL OR ${t.deliveryChannel} IN ('telegram','email','push')`),
  check("ai_report_subs_schedule_chk", sql`${t.schedule} IS NULL OR ${t.schedule} IN ('daily','weekly','monthly')`),
]);

export const insertAiReportSubscriptionSchema = createInsertSchema(aiReportSubscriptions, {
  deliveryChannel: z.enum(["telegram", "email", "push"]).default("telegram"),
  schedule: z.enum(["daily", "weekly", "monthly"]).default("daily"),
}).omit({ id: true, createdAt: true } as never);

export type AiReportSubscription = typeof aiReportSubscriptions.$inferSelect;
export type InsertAiReportSubscription = z.infer<typeof insertAiReportSubscriptionSchema>;

export const documentSequences = pgTable("document_sequences", {
  id: serial("id").primaryKey(),
  prefix: varchar("prefix", { length: 20 }).notNull(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  lastNumber: integer("last_number").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniquePrefixYearMonth: unique().on(table.prefix, table.year, table.month),
}));

export type DocumentSequence = typeof documentSequences.$inferSelect;

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tableName: varchar("table_name", { length: 100 }).notNull(),
  recordId: varchar("record_id", { length: 100 }).notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  changedFields: text("changed_fields").array(),
  reason: text("reason"),
  transactionId: varchar("transaction_id", { length: 100 }),
  userId: varchar("user_id"),
  userFullName: text("user_full_name"),
  userRole: varchar("user_role", { length: 50 }),
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AuditLog = typeof auditLogs.$inferSelect;

export const documentReversals = pgTable("document_reversals", {
  id: serial("id").primaryKey(),
  originalDocumentType: varchar("original_document_type", { length: 50 }).notNull(),
  originalDocumentId: varchar("original_document_id", { length: 100 }).notNull(),
  originalDocumentNumber: varchar("original_document_number", { length: 100 }),
  reversalReason: text("reversal_reason").notNull(),
  reversalDocumentId: varchar("reversal_document_id", { length: 100 }),
  reversalDocumentNumber: varchar("reversal_document_number", { length: 100 }),
  reversedBy: varchar("reversed_by").references(() => users.id, { onDelete: "set null" }),
  reversedAt: timestamp("reversed_at").notNull().defaultNow(),
  status: varchar("status", { length: 20 }).notNull().default("reversed"),
});

export type DocumentReversal = typeof documentReversals.$inferSelect;

export const currencies = pgTable("currencies", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 3 }).notNull().unique(),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  symbol: varchar("symbol", { length: 5 }).notNull(),
  isBaseCurrency: boolean("is_base_currency").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  decimalPlaces: integer("decimal_places").notNull().default(2),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Currency = typeof currencies.$inferSelect;

export const exchangeRates = pgTable("exchange_rates", {
  id: serial("id").primaryKey(),
  fromCurrency: varchar("from_currency", { length: 3 }).notNull(),
  toCurrency: varchar("to_currency", { length: 3 }).notNull(),
  rate: numericMoney("rate").notNull(),
  rateDate: varchar("rate_date", { length: 10 }).notNull(),
  source: varchar("source", { length: 50 }).default("manual"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ExchangeRate = typeof exchangeRates.$inferSelect;

export const approvalRequests = pgTable("approval_requests", {
  id: serial("id").primaryKey(),
  documentType: varchar("document_type", { length: 50 }).notNull(),
  documentId: varchar("document_id", { length: 100 }).notNull(),
  documentNumber: varchar("document_number", { length: 100 }),
  amount: numericMoney("amount").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("UZS"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  requestedBy: varchar("requested_by").references(() => users.id, { onDelete: "set null" }),
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  approverUserId: varchar("approver_user_id").references(() => users.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  notes: text("notes"),
});

export type ApprovalRequest = typeof approvalRequests.$inferSelect;

export const approvalWorkflowTemplates = pgTable("approval_workflow_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  documentType: varchar("document_type", { length: 50 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type ApprovalWorkflowTemplate = typeof approvalWorkflowTemplates.$inferSelect;

export const approvalWorkflowSteps = pgTable("approval_workflow_steps", {
  id: serial("id").primaryKey(),
  templateId: varchar("template_id").notNull().references(() => approvalWorkflowTemplates.id, { onDelete: "cascade" }),
  stepNumber: integer("step_number").notNull(),
  approverRole: varchar("approver_role", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ApprovalWorkflowStep = typeof approvalWorkflowSteps.$inferSelect;

export const approvalWorkflows = pgTable("approval_workflows", {
  id: serial("id").primaryKey(),
  documentType: varchar("document_type", { length: 50 }).notNull(),
  documentId: varchar("document_id", { length: 100 }).notNull(),
  templateId: varchar("template_id").notNull().references(() => approvalWorkflowTemplates.id, { onDelete: "restrict" }),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  currentStep: integer("current_step").notNull().default(1),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  submittedAt: timestamp("submitted_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ApprovalWorkflow = typeof approvalWorkflows.$inferSelect;

export const approvalWorkflowApprovals = pgTable("approval_workflow_approvals", {
  id: serial("id").primaryKey(),
  workflowId: varchar("workflow_id").notNull().references(() => approvalWorkflows.id, { onDelete: "cascade" }),
  stepNumber: integer("step_number").notNull(),
  approverId: varchar("approver_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  comment: text("comment"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ApprovalWorkflowApproval = typeof approvalWorkflowApprovals.$inferSelect;

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true } as never);
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

export const insertDocumentReversalSchema = createInsertSchema(documentReversals).omit({ id: true, reversedAt: true } as never);
export type InsertDocumentReversal = z.infer<typeof insertDocumentReversalSchema>;

export const insertCurrencySchema = createInsertSchema(currencies).omit({ id: true, createdAt: true } as never);
export type InsertCurrency = z.infer<typeof insertCurrencySchema>;

export const insertExchangeRateSchema = createInsertSchema(exchangeRates).omit({ id: true, createdAt: true } as never);
export type InsertExchangeRate = z.infer<typeof insertExchangeRateSchema>;

export const insertApprovalRequestSchema = createInsertSchema(approvalRequests).omit({ id: true, requestedAt: true } as never);
export type InsertApprovalRequest = z.infer<typeof insertApprovalRequestSchema>;

export const insertApprovalWorkflowTemplateSchema = createInsertSchema(approvalWorkflowTemplates).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type InsertApprovalWorkflowTemplate = z.infer<typeof insertApprovalWorkflowTemplateSchema>;

export const insertApprovalWorkflowStepSchema = createInsertSchema(approvalWorkflowSteps).omit({ id: true, createdAt: true } as never);
export type InsertApprovalWorkflowStep = z.infer<typeof insertApprovalWorkflowStepSchema>;

export const insertApprovalWorkflowSchema = createInsertSchema(approvalWorkflows).omit({ id: true, createdAt: true } as never);
export type InsertApprovalWorkflow = z.infer<typeof insertApprovalWorkflowSchema>;

export const insertApprovalWorkflowApprovalSchema = createInsertSchema(approvalWorkflowApprovals).omit({ id: true, createdAt: true } as never);
export type InsertApprovalWorkflowApproval = z.infer<typeof insertApprovalWorkflowApprovalSchema>;
