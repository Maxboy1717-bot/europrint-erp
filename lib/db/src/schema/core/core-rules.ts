/**
 * @module core-rules
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { numericMoney } from "../numeric-money";
import { sql } from "drizzle-orm";
import { serial, pgTable, text, varchar, integer, boolean, timestamp, jsonb, decimal, type AnyPgColumn, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./core-users";

export const businessRules = pgTable("business_rules", {
  id: serial("id").primaryKey(),
  ruleCode: varchar("rule_code", { length: 50 }).notNull().unique(),
  ruleName: text("rule_name").notNull(),
  ruleNameRu: text("rule_name_ru"),
  ruleType: varchar("rule_type", { length: 30 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  targetTable: varchar("target_table", { length: 100 }),
  targetAction: varchar("target_action", { length: 30 }),
  condition: jsonb("condition").notNull(),
  errorMessageUz: text("error_message_uz").notNull(),
  errorMessageRu: text("error_message_ru"),
  priority: integer("priority").notNull().default(10),
  isActive: boolean("is_active").notNull().default(true),
  requiresApproval: boolean("requires_approval").notNull().default(false),
  approverRole: varchar("approver_role", { length: 50 }),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export type BusinessRule = typeof businessRules.$inferSelect;

export const ruleViolations = pgTable("rule_violations", {
  id: serial("id").primaryKey(),
  ruleId: varchar("rule_id").notNull().references(() => businessRules.id, { onDelete: "cascade" }),
  ruleCode: varchar("rule_code", { length: 50 }).notNull(),
  violationType: varchar("violation_type", { length: 30 }).notNull(),
  tableName: varchar("table_name", { length: 100 }).notNull(),
  recordId: varchar("record_id"),
  attemptedData: jsonb("attempted_data"),
  violationMessage: text("violation_message").notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  userFullName: text("user_full_name"),
  ipAddress: varchar("ip_address", { length: 50 }),
  overrideApprovedBy: varchar("override_approved_by").references(() => users.id, { onDelete: "set null" }),
  overrideReason: text("override_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type RuleViolation = typeof ruleViolations.$inferSelect;

export const unitOfMeasures = pgTable("unit_of_measures", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  category: varchar("category", { length: 30 }).notNull(),
  baseUnitId: varchar("base_unit_id").references((): AnyPgColumn => unitOfMeasures.id, { onDelete: "set null" }),
  conversionFactor: numericMoney("conversion_factor").default(1),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type UnitOfMeasure = typeof unitOfMeasures.$inferSelect;

export const validationRules = pgTable("validation_rules", {
  id: serial("id").primaryKey(),
  ruleCode: varchar("rule_code", { length: 50 }).notNull().unique(),
  ruleName: text("rule_name").notNull(),
  ruleNameRu: text("rule_name_ru"),
  ruleDescription: text("rule_description"),
  category: varchar("category", { length: 50 }).notNull(),
  severity: varchar("severity", { length: 20 }).notNull(),
  checkQuery: text("check_query"),
  expectedResult: varchar("expected_result", { length: 50 }),
  errorMessageUz: text("error_message_uz").notNull(),
  errorMessageRu: text("error_message_ru"),
  suggestedActionUz: text("suggested_action_uz"),
  suggestedActionRu: text("suggested_action_ru"),
  isActive: boolean("is_active").notNull().default(true),
  runFrequency: varchar("run_frequency", { length: 20 }).default("daily"),
  lastRunAt: timestamp("last_run_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ValidationRule = typeof validationRules.$inferSelect;

export const validationResults = pgTable("validation_results", {
  id: serial("id").primaryKey(),
  validationRuleId: varchar("validation_rule_id").notNull().references(() => validationRules.id, { onDelete: "cascade" }),
  ruleCode: varchar("rule_code", { length: 50 }).notNull(),
  runAt: timestamp("run_at").notNull().defaultNow(),
  status: varchar("status", { length: 20 }).notNull(),
  violationCount: integer("violation_count").default(0),
  violationDetails: jsonb("violation_details"),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: integer("resolved_by").references(() => users.id, { onDelete: "set null" }),
  resolutionNotes: text("resolution_notes"),
});

export type ValidationResult = typeof validationResults.$inferSelect;

export const deletedRecords = pgTable("deleted_records", {
  id: serial("id").primaryKey(),
  tableName: varchar("table_name", { length: 100 }).notNull(),
  recordId: varchar("record_id").notNull(),
  recordData: jsonb("record_data").notNull(),
  deletedBy: varchar("deleted_by").references(() => users.id, { onDelete: "set null" }),
  deletedByName: text("deleted_by_name"),
  deletedAt: timestamp("deleted_at").notNull().defaultNow(),
  deleteReason: text("delete_reason"),
  canRestore: boolean("can_restore").notNull().default(true),
  restoredAt: timestamp("restored_at"),
  restoredBy: varchar("restored_by").references(() => users.id, { onDelete: "set null" }),
});

export type DeletedRecord = typeof deletedRecords.$inferSelect;

export const statusChangeHistory = pgTable("status_change_history", {
  id: serial("id").primaryKey(),
  tableName: varchar("table_name", { length: 100 }).notNull(),
  recordId: varchar("record_id").notNull(),
  documentNumber: varchar("document_number", { length: 50 }),
  oldStatus: varchar("old_status", { length: 50 }).notNull(),
  newStatus: varchar("new_status", { length: 50 }).notNull(),
  changedBy: varchar("changed_by").references(() => users.id, { onDelete: "set null" }),
  changedByName: text("changed_by_name"),
  changeReason: text("change_reason"),
  isReversal: boolean("is_reversal").notNull().default(false),
  approvalRequired: boolean("approval_required").notNull().default(false),
  approvedBy: varchar("approved_by").references(() => users.id, { onDelete: "set null" }),
  changedAt: timestamp("changed_at").notNull().defaultNow(),
});

export type StatusChangeHistory = typeof statusChangeHistory.$inferSelect;

export const kpiDefinitions = pgTable("kpi_definitions", {
  id: serial("id").primaryKey(),
  kpiCode: varchar("kpi_code", { length: 50 }).notNull().unique(),
  kpiName: text("kpi_name").notNull(),
  kpiNameRu: text("kpi_name_ru"),
  category: varchar("category", { length: 50 }).notNull(),
  calculationMethod: varchar("calculation_method", { length: 30 }).notNull(),
  calculationQuery: text("calculation_query"),
  calculationFormula: text("calculation_formula"),
  targetValue: numericMoney("target_value"),
  warningThreshold: numericMoney("warning_threshold"),
  criticalThreshold: numericMoney("critical_threshold"),
  thresholdDirection: varchar("threshold_direction", { length: 10 }).notNull().default("above"),
  unit: varchar("unit", { length: 20 }),
  frequency: varchar("frequency", { length: 20 }).notNull().default("daily"),
  blockOnViolation: boolean("block_on_violation").notNull().default(false),
  alertOnWarning: boolean("alert_on_warning").notNull().default(true),
  alertOnCritical: boolean("alert_on_critical").notNull().default(true),
  notifyRoles: jsonb("notify_roles"),
  notifyUserIds: jsonb("notify_user_ids"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type KpiDefinition = typeof kpiDefinitions.$inferSelect;

export const kpiValues = pgTable("kpi_values", {
  id: serial("id").primaryKey(),
  kpiId: varchar("kpi_id").notNull().references(() => kpiDefinitions.id, { onDelete: "cascade" }),
  kpiCode: varchar("kpi_code", { length: 50 }).notNull(),
  periodDate: varchar("period_date", { length: 10 }).notNull(),
  periodType: varchar("period_type", { length: 20 }).notNull(),
  value: numericMoney("value").notNull(),
  previousValue: numericMoney("previous_value"),
  changePercent: numericMoney("change_percent"),
  status: varchar("status", { length: 20 }).notNull(),
  targetValue: numericMoney("target_value"),
  achievementPercent: numericMoney("achievement_percent"),
  calculatedAt: timestamp("calculated_at").notNull().defaultNow(),
});

export type KpiValue = typeof kpiValues.$inferSelect;

export const systemAlerts = pgTable("system_alerts", {
  id: serial("id").primaryKey(),
  alertType: varchar("alert_type", { length: 30 }).notNull(),
  severity: varchar("severity", { length: 20 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  title: text("title").notNull(),
  titleRu: text("title_ru"),
  message: text("message").notNull(),
  messageRu: text("message_ru"),
  sourceType: varchar("source_type", { length: 50 }),
  sourceId: varchar("source_id"),
  relatedTable: varchar("related_table", { length: 100 }),
  relatedRecordId: varchar("related_record_id"),
  actionRequired: boolean("action_required").notNull().default(false),
  actionUrl: text("action_url"),
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at"),
  readBy: varchar("read_by").references(() => users.id, { onDelete: "set null" }),
  isResolved: boolean("is_resolved").notNull().default(false),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: integer("resolved_by").references(() => users.id, { onDelete: "set null" }),
  resolutionNotes: text("resolution_notes"),
  notifiedUsers: jsonb("notified_users"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type SystemAlert = typeof systemAlerts.$inferSelect;

export const roleMenus = pgTable("role_menus", {
  id: serial("id").primaryKey(),
  role: varchar("role", { length: 50 }).notNull(),
  menuKey: varchar("menu_key", { length: 100 }).notNull(),
  label: text("label").notNull(),
  labelUz: text("label_uz"),
  labelRu: text("label_ru"),
  icon: text("icon"),
  path: text("path"),
  parentKey: varchar("parent_key", { length: 100 }),
  sortOrder: integer("sort_order").notNull().default(0),
  isVisible: boolean("is_visible").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type RoleMenu = typeof roleMenus.$inferSelect;

export const roleDashboardWidgets = pgTable("role_dashboard_widgets", {
  id: serial("id").primaryKey(),
  role: varchar("role", { length: 50 }).notNull(),
  widgetCode: varchar("widget_code", { length: 50 }).notNull(),
  widgetName: text("widget_name").notNull(),
  widgetNameRu: text("widget_name_ru"),
  widgetType: varchar("widget_type", { length: 30 }).notNull(),
  widgetConfig: jsonb("widget_config"),
  dataSourceType: varchar("data_source_type", { length: 30 }),
  dataSource: text("data_source"),
  refreshInterval: integer("refresh_interval").default(300),
  sortOrder: integer("sort_order").notNull().default(0),
  gridColumn: integer("grid_column").default(1),
  gridRow: integer("grid_row").default(1),
  gridWidth: integer("grid_width").default(1),
  gridHeight: integer("grid_height").default(1),
  isVisible: boolean("is_visible").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type RoleDashboardWidget = typeof roleDashboardWidgets.$inferSelect;

export const insertBusinessRuleSchema = createInsertSchema(businessRules).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type InsertBusinessRule = z.infer<typeof insertBusinessRuleSchema>;

export const insertRuleViolationSchema = createInsertSchema(ruleViolations).omit({ id: true, createdAt: true } as never);
export type InsertRuleViolation = z.infer<typeof insertRuleViolationSchema>;

export const insertUnitOfMeasureSchema = createInsertSchema(unitOfMeasures).omit({ id: true, createdAt: true } as never);
export type InsertUnitOfMeasure = z.infer<typeof insertUnitOfMeasureSchema>;

export const insertValidationRuleSchema = createInsertSchema(validationRules).omit({ id: true, createdAt: true } as never);
export type InsertValidationRule = z.infer<typeof insertValidationRuleSchema>;

export const insertValidationResultSchema = createInsertSchema(validationResults).omit({ id: true } as never);
export type InsertValidationResult = z.infer<typeof insertValidationResultSchema>;

export const insertDeletedRecordSchema = createInsertSchema(deletedRecords).omit({ id: true, deletedAt: true } as never);
export type InsertDeletedRecord = z.infer<typeof insertDeletedRecordSchema>;

export const insertStatusChangeHistorySchema = createInsertSchema(statusChangeHistory).omit({ id: true, changedAt: true } as never);
export type InsertStatusChangeHistory = z.infer<typeof insertStatusChangeHistorySchema>;

export const insertKpiDefinitionSchema = createInsertSchema(kpiDefinitions).omit({ id: true, createdAt: true } as never);
export type InsertKpiDefinition = z.infer<typeof insertKpiDefinitionSchema>;

export const insertKpiValueSchema = createInsertSchema(kpiValues).omit({ id: true, calculatedAt: true } as never);
export type InsertKpiValue = z.infer<typeof insertKpiValueSchema>;

export const insertSystemAlertSchema = createInsertSchema(systemAlerts).omit({ id: true, createdAt: true } as never);
export type InsertSystemAlert = z.infer<typeof insertSystemAlertSchema>;

export const insertRoleMenuSchema = createInsertSchema(roleMenus).omit({ id: true, createdAt: true } as never);
export type InsertRoleMenu = z.infer<typeof insertRoleMenuSchema>;

export const insertRoleDashboardWidgetSchema = createInsertSchema(roleDashboardWidgets).omit({ id: true, createdAt: true } as never);
export type InsertRoleDashboardWidget = z.infer<typeof insertRoleDashboardWidgetSchema>;

// ========== EXCEPTION LOGS — Istisno holatlar jadvali ==========
// Qachon, kim, qaysi buyurtma/modul bo'yicha istisno berilgan va kim ruxsat bergan

export const exceptionLogs = pgTable("exception_logs", {
  id: serial("id").primaryKey(),

  // Istisno turi
  exceptionType: varchar("exception_type", { length: 50 }).notNull(),
  // advance_bypass | tech_override | planning_override | status_force |
  // material_return_skip | qc_bypass | delivery_override | billing_override | custom

  // Qaysi modul / jarayon
  module: varchar("module", { length: 30 }).notNull(),
  // SD | PP | QC | TECH | WMS | MES | FI | HR | LOGISTICS

  // Bog'liq hujjat
  relatedTable: varchar("related_table", { length: 100 }),
  relatedRecordId: varchar("related_record_id", { length: 100 }),
  documentNumber: varchar("document_number", { length: 50 }),

  // Istisno mazmuni
  description: text("description").notNull(),
  originalValue: jsonb("original_value"),   // bloklangan operatsiya
  overrideValue: jsonb("override_value"),   // qo'llangan qiymat

  // Ruxsat bergan
  requestedBy: varchar("requested_by").references(() => users.id, { onDelete: "restrict" }).notNull(),
  requestedByName: text("requested_by_name"),
  requestedAt: timestamp("requested_at").notNull().defaultNow(),

  approvedBy: varchar("approved_by").references(() => users.id, { onDelete: "set null" }),
  approvedByName: text("approved_by_name"),
  approvedByRole: varchar("approved_by_role", { length: 50 }),
  approvedAt: timestamp("approved_at"),

  // Sabablar
  reason: text("reason").notNull(),
  businessJustification: text("business_justification"),

  // Holat
  status: varchar("status", { length: 20 }).notNull().default("approved"),
  // approved | rejected | pending_approval

  // Qo'shimcha
  ipAddress: varchar("ip_address", { length: 50 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("exception_logs_type_chk", sql`${t.exceptionType} IN ('advance_bypass','tech_override','planning_override','status_force','material_return_skip','qc_bypass','delivery_override','billing_override','custom')`),
  check("exception_logs_module_chk", sql`${t.module} IN ('SD','PP','QC','TECH','WMS','MES','FI','HR','LOGISTICS','CRM')`),
  check("exception_logs_status_chk", sql`${t.status} IN ('approved','rejected','pending_approval')`),
]);

export const insertExceptionLogSchema = createInsertSchema(exceptionLogs, {
  exceptionType: z.enum([
    "advance_bypass", "tech_override", "planning_override",
    "status_force", "material_return_skip", "qc_bypass",
    "delivery_override", "billing_override", "custom"
  ]),
  module: z.enum(["SD", "PP", "QC", "TECH", "WMS", "MES", "FI", "HR", "LOGISTICS", "CRM"]),
  status: z.enum(["approved", "rejected", "pending_approval"]).default("approved"),
  reason: z.string().min(10, "Sabab kamida 10 ta belgi bo'lishi kerak"),
}).omit({ id: true, createdAt: true, requestedAt: true } as never);

export type ExceptionLog = typeof exceptionLogs.$inferSelect;
export type InsertExceptionLog = z.infer<typeof insertExceptionLogSchema>;

// ========== AUDIT TRAIL LOG — Muhim operatsiyalar yozuvi ==========

export const auditTrailLog = pgTable("audit_trail_log", {
  id: serial("id").primaryKey(),
  action: varchar("action", { length: 50 }).notNull(),
  // CREATE | UPDATE | DELETE | STATUS_CHANGE | APPROVE | REJECT | BYPASS | EXPORT | LOGIN | LOGOUT
  tableName: varchar("table_name", { length: 100 }),
  recordId: varchar("record_id", { length: 100 }),
  documentNumber: varchar("document_number", { length: 50 }),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  userFullName: text("user_full_name"),
  userRole: varchar("user_role", { length: 50 }),
  module: varchar("module", { length: 30 }),
  oldData: jsonb("old_data"),
  newData: jsonb("new_data"),
  changedFields: text("changed_fields").array(),
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
  sessionId: varchar("session_id", { length: 100 }),
  requestId: varchar("request_id", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("audit_trail_log_action_chk", sql`${t.action} IN ('CREATE','UPDATE','DELETE','STATUS_CHANGE','APPROVE','REJECT','BYPASS','EXPORT','LOGIN','LOGOUT','CUSTOM')`),
]);

export const insertAuditTrailLogSchema = createInsertSchema(auditTrailLog, {
  action: z.enum([
    "CREATE", "UPDATE", "DELETE", "STATUS_CHANGE",
    "APPROVE", "REJECT", "BYPASS", "EXPORT", "LOGIN", "LOGOUT", "CUSTOM"
  ]),
}).omit({ id: true, createdAt: true } as never);

export type AuditTrailLog = typeof auditTrailLog.$inferSelect;
export type InsertAuditTrailLog = z.infer<typeof insertAuditTrailLogSchema>;
