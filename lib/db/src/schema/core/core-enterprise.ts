import { numericMoney } from "../numeric-money";
import { sql } from "drizzle-orm";
import { serial, pgTable, text, varchar, integer, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { costCenters } from "../fi-schema";
import { users } from "./core-users";
export const documentLifecycle = pgTable("document_lifecycle", {
  id: serial("id").primaryKey(),
  documentType: varchar("document_type", { length: 50 }).notNull(),
  documentId: varchar("document_id", { length: 100 }).notNull(),
  documentNumber: varchar("document_number", { length: 100 }),
  currentStatus: varchar("current_status", { length: 30 }).notNull().default("draft"),
  previousStatus: varchar("previous_status", { length: 30 }),
  statusChangedBy: varchar("status_changed_by").references(() => users.id),
  statusChangedAt: timestamp("status_changed_at").notNull().defaultNow(),
  reason: text("reason"),
  metadata: jsonb("metadata"),
});

export type DocumentLifecycle = typeof documentLifecycle.$inferSelect;

export const documentLifecycleHistory = pgTable("document_lifecycle_history", {
  id: serial("id").primaryKey(),
  documentType: varchar("document_type", { length: 50 }).notNull(),
  documentId: varchar("document_id", { length: 100 }).notNull(),
  fromStatus: varchar("from_status", { length: 30 }),
  toStatus: varchar("to_status", { length: 30 }).notNull(),
  changedBy: varchar("changed_by").references(() => users.id),
  changedAt: timestamp("changed_at").notNull().defaultNow(),
  reason: text("reason"),
  ipAddress: varchar("ip_address", { length: 50 }),
});

export type DocumentLifecycleHistory = typeof documentLifecycleHistory.$inferSelect;

export const changeRequests = pgTable("change_requests", {
  id: serial("id").primaryKey(),
  requestNumber: varchar("request_number", { length: 50 }).notNull().unique(),
  changeType: varchar("change_type", { length: 50 }).notNull(),
  targetTable: varchar("target_table", { length: 100 }),
  targetId: varchar("target_id", { length: 100 }),
  targetField: varchar("target_field", { length: 100 }),
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  reason: text("reason").notNull(),
  priority: varchar("priority", { length: 20 }).notNull().default("normal"),
  status: varchar("status", { length: 30 }).notNull().default("pending"),
  requestedBy: varchar("requested_by").references(() => users.id),
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  implementedBy: varchar("implemented_by").references(() => users.id),
  implementedAt: timestamp("implemented_at"),
  effectiveDate: timestamp("effective_date"),
});

export type ChangeRequest = typeof changeRequests.$inferSelect;

export const separationOfDutiesRules = pgTable("separation_of_duties_rules", {
  id: serial("id").primaryKey(),
  ruleCode: varchar("rule_code", { length: 50 }).notNull().unique(),
  ruleName: text("rule_name").notNull(),
  ruleNameRu: text("rule_name_ru"),
  documentType: varchar("document_type", { length: 50 }).notNull(),
  creatorRole: varchar("creator_role", { length: 50 }).notNull(),
  approverRole: varchar("approver_role", { length: 50 }).notNull(),
  payerRole: varchar("payer_role", { length: 50 }),
  auditorRole: varchar("auditor_role", { length: 50 }),
  requireDifferentUsers: boolean("require_different_users").notNull().default(true),
  minApprovers: integer("min_approvers").notNull().default(1),
  maxAmount: decimal("max_amount", { precision: 18, scale: 2 }),
  escalationRole: varchar("escalation_role", { length: 50 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type SeparationOfDutiesRule = typeof separationOfDutiesRules.$inferSelect;

export const postingEntries = pgTable("posting_entries", {
  id: serial("id").primaryKey(),
  entryNumber: varchar("entry_number", { length: 50 }).notNull().unique(),
  sourceType: varchar("source_type", { length: 50 }).notNull(),
  sourceId: varchar("source_id", { length: 100 }).notNull(),
  sourceDocumentNumber: varchar("source_document_number", { length: 100 }),
  postingDate: timestamp("posting_date").notNull(),
  accountCode: varchar("account_code", { length: 20 }).notNull(),
  accountName: text("account_name"),
  debit: decimal("debit", { precision: 18, scale: 2 }).notNull().default("0"),
  credit: decimal("credit", { precision: 18, scale: 2 }).notNull().default("0"),
  currency: varchar("currency", { length: 3 }).notNull().default("UZS"),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }).notNull().default("1"),
  amountInBaseCurrency: decimal("amount_in_base_currency", { precision: 18, scale: 2 }).notNull().default("0"),
  costCenterId: varchar("cost_center_id").references(() => costCenters.id),
  costObjectType: varchar("cost_object_type", { length: 30 }),
  costObjectId: varchar("cost_object_id", { length: 100 }),
  description: text("description"),
  reference: text("reference"),
  isReversed: boolean("is_reversed").notNull().default(false),
  reversalEntryId: varchar("reversal_entry_id"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type PostingEntry = typeof postingEntries.$inferSelect;

export const costObjects = pgTable("cost_objects", {
  id: serial("id").primaryKey(),
  objectType: varchar("object_type", { length: 30 }).notNull(),
  objectCode: varchar("object_code", { length: 50 }).notNull().unique(),
  objectName: text("object_name").notNull(),
  objectNameRu: text("object_name_ru"),
  parentId: varchar("parent_id"),
  costCenterId: varchar("cost_center_id").references(() => costCenters.id),
  responsibleUserId: integer("responsible_user_id").references(() => users.id),
  budget: decimal("budget", { precision: 18, scale: 2 }),
  actualCost: decimal("actual_cost", { precision: 18, scale: 2 }).notNull().default("0"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type CostObject = typeof costObjects.$inferSelect;

export const sopTemplates = pgTable("sop_templates", {
  id: serial("id").primaryKey(),
  sopCode: varchar("sop_code", { length: 50 }).notNull().unique(),
  sopName: text("sop_name").notNull(),
  sopNameRu: text("sop_name_ru"),
  processType: varchar("process_type", { length: 50 }).notNull(),
  description: text("description"),
  version: varchar("version", { length: 20 }).notNull().default("1.0"),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export type SopTemplate = typeof sopTemplates.$inferSelect;

export const sopSteps = pgTable("sop_steps", {
  id: serial("id").primaryKey(),
  sopId: varchar("sop_id").references(() => sopTemplates.id).notNull(),
  stepNumber: integer("step_number").notNull(),
  stepName: text("step_name").notNull(),
  stepNameRu: text("step_name_ru"),
  description: text("description"),
  isMandatory: boolean("is_mandatory").notNull().default(true),
  requiredRole: varchar("required_role", { length: 50 }),
  expectedDuration: integer("expected_duration"),
  checklistItems: jsonb("checklist_items"),
  nextStepOnComplete: integer("next_step_on_complete"),
  nextStepOnFail: integer("next_step_on_fail"),
  isActive: boolean("is_active").notNull().default(true),
});

export type SopStep = typeof sopSteps.$inferSelect;

export const roleUiConfigs = pgTable("role_ui_configs", {
  id: serial("id").primaryKey(),
  role: varchar("role", { length: 50 }).notNull(),
  configType: varchar("config_type", { length: 30 }).notNull(),
  targetModule: varchar("target_module", { length: 50 }),
  targetPage: varchar("target_page", { length: 100 }),
  visibleElements: jsonb("visible_elements"),
  hiddenElements: jsonb("hidden_elements"),
  readOnlyElements: jsonb("read_only_elements"),
  defaultFilters: jsonb("default_filters"),
  defaultSort: jsonb("default_sort"),
  customLayout: jsonb("custom_layout"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export type RoleUiConfig = typeof roleUiConfigs.$inferSelect;

export const exceptionTypes = pgTable("exception_types", {
  id: serial("id").primaryKey(),
  typeCode: varchar("type_code", { length: 50 }).notNull().unique(),
  typeName: text("type_name").notNull(),
  typeNameRu: text("type_name_ru"),
  category: varchar("category", { length: 50 }).notNull(),
  severity: varchar("severity", { length: 20 }).notNull().default("medium"),
  detectionQuery: text("detection_query"),
  thresholdValue: decimal("threshold_value", { precision: 18, scale: 4 }),
  thresholdOperator: varchar("threshold_operator", { length: 10 }),
  autoResolveAfterDays: integer("auto_resolve_after_days"),
  escalationAfterHours: integer("escalation_after_hours"),
  escalationRole: varchar("escalation_role", { length: 50 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ExceptionType = typeof exceptionTypes.$inferSelect;

export const exceptionInbox = pgTable("exception_inbox", {
  id: serial("id").primaryKey(),
  exceptionTypeId: varchar("exception_type_id").references(() => exceptionTypes.id),
  exceptionCode: varchar("exception_code", { length: 50 }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  severity: varchar("severity", { length: 20 }).notNull().default("medium"),
  category: varchar("category", { length: 50 }).notNull(),
  sourceType: varchar("source_type", { length: 50 }),
  sourceId: varchar("source_id", { length: 100 }),
  sourceDocumentNumber: varchar("source_document_number", { length: 100 }),
  affectedAmount: decimal("affected_amount", { precision: 18, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("UZS"),
  status: varchar("status", { length: 30 }).notNull().default("open"),
  assignedTo: integer("assigned_to").references(() => users.id),
  detectedAt: timestamp("detected_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: integer("resolved_by").references(() => users.id),
  resolution: text("resolution"),
  dueDate: timestamp("due_date"),
  escalatedAt: timestamp("escalated_at"),
  escalatedTo: varchar("escalated_to").references(() => users.id),
  metadata: jsonb("metadata"),
});

export type ExceptionInbox = typeof exceptionInbox.$inferSelect;

export const exceptionActivities = pgTable("exception_activities", {
  id: serial("id").primaryKey(),
  exceptionId: varchar("exception_id").references(() => exceptionInbox.id).notNull(),
  activityType: varchar("activity_type", { length: 30 }).notNull(),
  content: text("content"),
  previousValue: text("previous_value"),
  newValue: text("new_value"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ExceptionActivity = typeof exceptionActivities.$inferSelect;

export const processChains = pgTable("process_chains", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  nameUz: varchar("name_uz", { length: 100 }).notNull(),
  nameRu: varchar("name_ru", { length: 100 }),
  description: text("description"),
  chainType: varchar("chain_type", { length: 50 }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const fiscalPeriods = pgTable("fiscal_periods", {
  id: serial("id").primaryKey(),
  periodYear: integer("period_year").notNull(),
  periodMonth: integer("period_month").notNull(),
  periodName: varchar("period_name", { length: 50 }).notNull(),
  periodType: varchar("period_type", { length: 20 }).default("month"),
  status: varchar("status", { length: 20 }).default("open"),
  openedAt: timestamp("opened_at").defaultNow(),
  softClosedAt: timestamp("soft_closed_at"),
  hardClosedAt: timestamp("hard_closed_at"),
  closedByUserId: varchar("closed_by_user_id").references(() => users.id, { onDelete: 'set null' }),
  reopenedAt: timestamp("reopened_at"),
  reopenedByUserId: varchar("reopened_by_user_id").references(() => users.id, { onDelete: 'set null' }),
  reopenReason: text("reopen_reason"),
  closingNotes: text("closing_notes"),
  deletedAt: timestamp("deleted_at"),
});

export const batchLots = pgTable("batch_lots", {
  id: serial("id").primaryKey(),
  batchNumber: varchar("batch_number", { length: 50 }).notNull(),
  productId: integer("product_id"),
  materialId: integer("material_id"),
  productionDate: timestamp("production_date"),
  expiryDate: timestamp("expiry_date"),
  quantity: numericMoney("quantity").notNull(),
  remainingQuantity: numericMoney("remaining_quantity").notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
  warehouseId: integer("warehouse_id"),
  qualityStatus: varchar("quality_status", { length: 30 }).default("pending"),
  qualityCheckDate: timestamp("quality_check_date"),
  qualityCheckBy: integer("quality_check_by").references(() => users.id),
  supplierBatchNumber: varchar("supplier_batch_number", { length: 50 }),
  supplierId: integer("supplier_id"),
  costPerUnit: numericMoney("cost_per_unit"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

export const batchLotMovements = pgTable("batch_lot_movements", {
  id: serial("id").primaryKey(),
  batchLotId: varchar("batch_lot_id").references(() => batchLots.id),
  movementType: varchar("movement_type", { length: 30 }).notNull(),
  quantity: numericMoney("quantity").notNull(),
  fromWarehouseId: integer("from_warehouse_id"),
  toWarehouseId: integer("to_warehouse_id"),
  referenceType: varchar("reference_type", { length: 50 }),
  referenceId: varchar("reference_id", { length: 100 }),
  movementDate: timestamp("movement_date").defaultNow(),
  movedByUserId: varchar("moved_by_user_id").references(() => users.id, { onDelete: 'set null' }),
  reason: text("reason"),
});

export const currencyTransactions = pgTable("currency_transactions", {
  id: serial("id").primaryKey(),
  documentType: varchar("document_type", { length: 50 }).notNull(),
  documentId: varchar("document_id", { length: 100 }).notNull(),
  originalCurrency: varchar("original_currency", { length: 10 }).notNull(),
  originalAmount: numericMoney("original_amount").notNull(),
  baseCurrency: varchar("base_currency", { length: 10 }).default("UZS"),
  baseAmount: numericMoney("base_amount").notNull(),
  exchangeRate: numericMoney("exchange_rate").notNull(),
  rateDate: timestamp("rate_date").notNull(),
  exchangeDifference: numericMoney("exchange_difference").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDocumentLifecycleSchema = createInsertSchema(documentLifecycle).omit({ id: true, statusChangedAt: true } as never);
export type InsertDocumentLifecycle = z.infer<typeof insertDocumentLifecycleSchema>;

export const insertDocumentLifecycleHistorySchema = createInsertSchema(documentLifecycleHistory).omit({ id: true, changedAt: true } as never);
export type InsertDocumentLifecycleHistory = z.infer<typeof insertDocumentLifecycleHistorySchema>;

export const insertChangeRequestSchema = createInsertSchema(changeRequests).omit({ id: true, requestedAt: true } as never);
export type InsertChangeRequest = z.infer<typeof insertChangeRequestSchema>;

export const insertSeparationOfDutiesRuleSchema = createInsertSchema(separationOfDutiesRules).omit({ id: true, createdAt: true } as never);
export type InsertSeparationOfDutiesRule = z.infer<typeof insertSeparationOfDutiesRuleSchema>;

export const insertPostingEntrySchema = createInsertSchema(postingEntries).omit({ id: true, createdAt: true } as never);
export type InsertPostingEntry = z.infer<typeof insertPostingEntrySchema>;

export const insertCostObjectSchema = createInsertSchema(costObjects).omit({ id: true, createdAt: true } as never);
export type InsertCostObject = z.infer<typeof insertCostObjectSchema>;

export const insertSopTemplateSchema = createInsertSchema(sopTemplates).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type InsertSopTemplate = z.infer<typeof insertSopTemplateSchema>;

export const insertSopStepSchema = createInsertSchema(sopSteps).omit({ id: true } as never);
export type InsertSopStep = z.infer<typeof insertSopStepSchema>;

export const insertRoleUiConfigSchema = createInsertSchema(roleUiConfigs).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type InsertRoleUiConfig = z.infer<typeof insertRoleUiConfigSchema>;

export const insertExceptionTypeSchema = createInsertSchema(exceptionTypes).omit({ id: true, createdAt: true } as never);
export type InsertExceptionType = z.infer<typeof insertExceptionTypeSchema>;

export const insertExceptionInboxSchema = createInsertSchema(exceptionInbox).omit({ id: true, detectedAt: true } as never);
export type InsertExceptionInbox = z.infer<typeof insertExceptionInboxSchema>;

export const insertExceptionActivitySchema = createInsertSchema(exceptionActivities).omit({ id: true, createdAt: true } as never);
export type InsertExceptionActivity = z.infer<typeof insertExceptionActivitySchema>;

export const insertProcessChainSchema = createInsertSchema(processChains).omit({ id: true, createdAt: true } as never);
export type InsertProcessChain = z.infer<typeof insertProcessChainSchema>;
export type ProcessChain = typeof processChains.$inferSelect;

export const insertFiscalPeriodSchema = createInsertSchema(fiscalPeriods).omit({ id: true, openedAt: true } as never);
export type InsertFiscalPeriod = z.infer<typeof insertFiscalPeriodSchema>;
export type FiscalPeriod = typeof fiscalPeriods.$inferSelect;

export const insertBatchLotSchema = createInsertSchema(batchLots).omit({ id: true, createdAt: true } as never);
export type InsertBatchLot = z.infer<typeof insertBatchLotSchema>;
export type BatchLot = typeof batchLots.$inferSelect;

export const insertBatchLotMovementSchema = createInsertSchema(batchLotMovements).omit({ id: true, movementDate: true } as never);
export type InsertBatchLotMovement = z.infer<typeof insertBatchLotMovementSchema>;
export type BatchLotMovement = typeof batchLotMovements.$inferSelect;

export const insertCurrencyTransactionSchema = createInsertSchema(currencyTransactions).omit({ id: true, createdAt: true } as never);
export type InsertCurrencyTransaction = z.infer<typeof insertCurrencyTransactionSchema>;
export type CurrencyTransaction = typeof currencyTransactions.$inferSelect;
