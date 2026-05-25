/**
 * @module pp-papka
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { numericMoney } from "../numeric-money";
import { sql } from "drizzle-orm";
import { serial, pgTable, text, varchar, integer, boolean, timestamp, jsonb, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "../core-schema";
import { salesOrders } from "../sd-schema";
import { bomHeaders, equipment, products, routingOperations, routings, workCenters } from "./pp-production";

// Papka Orders (Buyurtmalar - Markaziy Master Data)
export const papkaOrders = pgTable("papka_orders", {
  id: varchar("id", { length: 50 }).primaryKey().default(sql`gen_random_uuid()::text`),
  papkaNo: varchar("papka_no", { length: 50 }).notNull().unique(),
  mijozNomi: text("mijoz_nomi").notNull(),
  mahsulotNomi: text("mahsulot_nomi").notNull(),
  mahsulotTuri: varchar("mahsulot_turi", { length: 50 }),
  tiraj: integer("tiraj").notNull(),
  listSoni: integer("list_soni"),
  qoshimchaList: integer("qoshimcha_list").default(0),
  formatA: numericMoney("format_a"),
  formatB: numericMoney("format_b"),
  gofraFormatA: numericMoney("gofra_format_a"),
  gofraFormatB: numericMoney("gofra_format_b"),
  status: varchar("status", { length: 30 }).notNull().default("draft"),
  bolim: varchar("bolim", { length: 30 }),
  sana: varchar("sana", { length: 10 }),
  planSanaIch: varchar("plan_sana_ich", { length: 10 }),
  tayyorBolishSanasi: varchar("tayyor_bolish_sanasi", { length: 10 }),
  materialMenejer: text("material_menejer"),
  materialTaminot: text("material_taminot"),
  dizayner: text("dizayner"),
  marketolog: text("marketolog"),
  bomId: varchar("bom_id").references(() => bomHeaders.id, { onDelete: "set null" }),
  productId: varchar("product_id").references(() => products.id, { onDelete: "set null" }),
  routingId: varchar("routing_id").references(() => routings.id, { onDelete: "set null" }),
  materialRequirements: jsonb("material_requirements"),
  stockCheckResult: jsonb("stock_check_result"),
  estimatedProductionTime: numericMoney("estimated_production_time"),
  notes: text("notes"),
  texnologikKarta: jsonb("texnologik_karta"),
  excelSourceBatchId: varchar("excel_source_batch_id"),
  salesOrderId: varchar("sales_order_id", { length: 36 }).references(() => salesOrders.id, { onDelete: "set null" }),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  check("papka_orders_status_chk", sql`${t.status} IN ('draft','pending_design','pending_tech','pending_qc','approved','ready_for_planning','planned','production','qc_final','completed','cancelled')`),
]);

export const insertPapkaOrderSchema = createInsertSchema(papkaOrders, {
  papkaNo: z.string().min(1, "Papka № kerak"),
  mijozNomi: z.string().min(1, "Mijoz nomi kerak"),
  mahsulotNomi: z.string().min(1, "Mahsulot nomi kerak"),
  tiraj: z.number().int().positive("Tiraj musbat bo'lishi kerak"),
  status: z.enum(["draft", "pending_design", "pending_tech", "pending_qc", "approved", "ready_for_planning", "planned", "production", "qc_final", "completed", "cancelled"]),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type PapkaOrder = typeof papkaOrders.$inferSelect;
export type InsertPapkaOrder = z.infer<typeof insertPapkaOrderSchema>;

// Excel Import Batches
export const excelImportBatches = pgTable("excel_import_batches", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  sheetName: text("sheet_name").notNull(),
  sourceType: varchar("source_type", { length: 30 }).notNull(),
  totalRows: integer("total_rows").default(0),
  importedRows: integer("imported_rows").default(0),
  errorRows: integer("error_rows").default(0),
  mismatchRows: integer("mismatch_rows").default(0),
  status: varchar("status", { length: 20 }).notNull().default("uploaded"),
  errorLog: jsonb("error_log"),
  columnMapping: jsonb("column_mapping"),
  importedBy: integer("imported_by"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("excel_import_batches_source_type_chk", sql`${t.sourceType} IN ('plan_2019','plan_2018','sm72_fact','warehouse','machine_task','raw_material')`),
  check("excel_import_batches_status_chk", sql`${t.status} IN ('uploaded','parsing','validating','importing','completed','failed')`),
]);

export const insertExcelImportBatchSchema = createInsertSchema(excelImportBatches, {
  fileName: z.string().min(1, "Fayl nomi kerak"),
  sheetName: z.string().min(1, "Sheet nomi kerak"),
  sourceType: z.enum(["plan_2019", "plan_2018", "sm72_fact", "warehouse", "machine_task", "raw_material"]),
  status: z.enum(["uploaded", "parsing", "validating", "importing", "completed", "failed"]),
}).omit({ id: true, createdAt: true } as never);

export type ExcelImportBatch = typeof excelImportBatches.$inferSelect;
export type InsertExcelImportBatch = z.infer<typeof insertExcelImportBatchSchema>;

// Excel Source Columns
export const excelSourceColumns = pgTable("excel_source_columns", {
  id: serial("id").primaryKey(),
  batchId: varchar("batch_id").references(() => excelImportBatches.id, { onDelete: "cascade" }).notNull(),
  colLetter: varchar("col_letter", { length: 5 }).notNull(),
  colIndex: integer("col_index").notNull(),
  colName: text("col_name").notNull(),
  mappedField: varchar("mapped_field", { length: 100 }),
  dataType: varchar("data_type", { length: 20 }),
  hasFormula: boolean("has_formula").default(false),
  formulaPattern: text("formula_pattern"),
  sampleValues: jsonb("sample_values"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ExcelSourceColumn = typeof excelSourceColumns.$inferSelect;

// Excel Import Rows
export const excelImportRows = pgTable("excel_import_rows", {
  id: serial("id").primaryKey(),
  batchId: varchar("batch_id").references(() => excelImportBatches.id, { onDelete: "cascade" }).notNull(),
  rowNumber: integer("row_number").notNull(),
  rawData: jsonb("raw_data").notNull(),
  normalizedData: jsonb("normalized_data"),
  targetRecordId: varchar("target_record_id"),
  targetTable: varchar("target_table", { length: 50 }),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  errorMessage: text("error_message"),
  mismatchDetails: jsonb("mismatch_details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ExcelImportRow = typeof excelImportRows.$inferSelect;

// Formula Definitions
export const formulaDefinitions = pgTable("formula_definitions", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  description: text("description"),
  excelFormula: text("excel_formula").notNull(),
  excelColumn: varchar("excel_column", { length: 5 }),
  variables: jsonb("variables").notNull(),
  operation: text("operation").notNull(),
  resultUnit: varchar("result_unit", { length: 20 }),
  divisionFactor: numericMoney("division_factor").default(1),
  coefficients: jsonb("coefficients"),
  minValue: numericMoney("min_value"),
  maxValue: numericMoney("max_value"),
  allowEmpty: boolean("allow_empty").default(true),
  isActive: boolean("is_active").notNull().default(true),
  category: varchar("category", { length: 30 }),
  sourceType: varchar("source_type", { length: 30 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFormulaDefinitionSchema = createInsertSchema(formulaDefinitions, {
  code: z.string().min(1, "Kod kerak"),
  name: z.string().min(1, "Nom kerak"),
  excelFormula: z.string().min(1, "Excel formula kerak"),
  operation: z.string().min(1, "Operation kerak"),
}).omit({ id: true, createdAt: true } as never);

export type FormulaDefinition = typeof formulaDefinitions.$inferSelect;
export type InsertFormulaDefinition = z.infer<typeof insertFormulaDefinitionSchema>;

// Formula Calculations
export const formulaCalculations = pgTable("formula_calculations", {
  id: serial("id").primaryKey(),
  formulaId: varchar("formula_id").references(() => formulaDefinitions.id, { onDelete: "cascade" }).notNull(),
  papkaOrderId: varchar("papka_order_id").references(() => papkaOrders.id, { onDelete: "set null" }),
  excelImportRowId: varchar("excel_import_row_id").references(() => excelImportRows.id, { onDelete: "set null" }),
  inputValues: jsonb("input_values").notNull(),
  calculatedResult: numericMoney("calculated_result"),
  excelResult: numericMoney("excel_result"),
  hasMismatch: boolean("has_mismatch").default(false),
  mismatchPercentage: numericMoney("mismatch_percentage"),
  mismatchReason: text("mismatch_reason"),
  status: varchar("status", { length: 20 }).notNull().default("calculated"),
  calculatedAt: timestamp("calculated_at").notNull().defaultNow(),
});

export type FormulaCalculation = typeof formulaCalculations.$inferSelect;

// Planning Operations
export const planningOperations = pgTable("planning_operations", {
  id: serial("id").primaryKey(),
  papkaOrderId: varchar("papka_order_id").references(() => papkaOrders.id, { onDelete: "cascade" }).notNull(),
  operationCode: varchar("operation_code", { length: 30 }).notNull(),
  operationName: text("operation_name").notNull(),
  operationNameRu: text("operation_name_ru"),
  sequence: integer("sequence").notNull(),
  equipmentId: integer("equipment_id").references(() => equipment.id, { onDelete: "set null" }),
  machineCode: varchar("machine_code", { length: 30 }),
  shift: varchar("shift", { length: 10 }),
  plannedDate: varchar("planned_date", { length: 10 }),
  plannedStartTime: varchar("planned_start_time", { length: 5 }),
  plannedEndTime: varchar("planned_end_time", { length: 5 }),
  plannedDurationMinutes: integer("planned_duration_minutes"),
  plannedQuantity: integer("planned_quantity"),
  plannedUnit: varchar("planned_unit", { length: 20 }),
  actualStartTime: varchar("actual_start_time", { length: 5 }),
  actualEndTime: varchar("actual_end_time", { length: 5 }),
  actualQuantity: integer("actual_quantity"),
  actualDurationMinutes: integer("actual_duration_minutes"),
  status: varchar("status", { length: 20 }).notNull().default("planned"),
  completionPercent: numericMoney("completion_percent").default(0),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("planning_operations_status_chk", sql`${t.status} IN ('planned','in_progress','completed','cancelled')`),
]);

export const insertPlanningOperationSchema = createInsertSchema(planningOperations, {
  operationCode: z.string().min(1, "Operatsiya kodi kerak"),
  operationName: z.string().min(1, "Operatsiya nomi kerak"),
  sequence: z.number().int().positive(),
  status: z.enum(["planned", "in_progress", "completed", "cancelled"]),
}).omit({ id: true, createdAt: true } as never);

export type PlanningOperation = typeof planningOperations.$inferSelect;
export type InsertPlanningOperation = z.infer<typeof insertPlanningOperationSchema>;

// Production Facts (SM72 fakt hisobot)
export const productionFacts = pgTable("production_facts", {
  id: serial("id").primaryKey(),
  papkaOrderId: varchar("papka_order_id").references(() => papkaOrders.id, { onDelete: "set null" }),
  papkaNo: varchar("papka_no", { length: 50 }).notNull(),
  planningOperationId: varchar("planning_operation_id").references(() => planningOperations.id, { onDelete: "set null" }),
  sana: varchar("sana", { length: 10 }).notNull(),
  buyurtmaNomi: text("buyurtma_nomi"),
  bajarilganListSoni: integer("bajarilgan_list_soni").notNull(),
  brak: integer("brak").default(0),
  izoh: text("izoh"),
  berilganBolim: varchar("berilgan_bolim", { length: 50 }),
  operator1: text("operator1"),
  operator2: text("operator2"),
  operator3: text("operator3"),
  operator4: text("operator4"),
  muammolar: text("muammolar"),
  planQuantity: integer("plan_quantity"),
  variance: integer("variance"),
  variancePercent: numericMoney("variance_percent"),
  brakPercent: numericMoney("brak_percent"),
  excelImportRowId: varchar("excel_import_row_id").references(() => excelImportRows.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSm72FactSchema = createInsertSchema(productionFacts, {
  papkaNo: z.string().min(1, "Papka № kerak"),
  sana: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida"),
  bajarilganListSoni: z.number().int().min(0),
}).omit({ id: true, createdAt: true } as never);

export type Sm72Fact = typeof productionFacts.$inferSelect;
export type InsertSm72Fact = z.infer<typeof insertSm72FactSchema>;

// Machine Tasks (Dastgoh vazifalari)
export const machineTasks = pgTable("machine_tasks", {
  id: serial("id").primaryKey(),
  taskNumber: integer("task_number"),
  title: text("title").notNull(),
  titleRu: text("title_ru"),
  priority: varchar("priority", { length: 20 }).notNull().default("normal"),
  responsiblePerson: text("responsible_person"),
  responsibleUserId: integer("responsible_user_id").references(() => users.id, { onDelete: "set null" }),
  dueDate: varchar("due_date", { length: 10 }),
  completedDate: varchar("completed_date", { length: 10 }),
  instructions: text("instructions"),
  instructionsRu: text("instructions_ru"),
  equipmentId: varchar("equipment_id").references(() => equipment.id, { onDelete: "set null" }),
  papkaOrderId: varchar("papka_order_id").references(() => papkaOrders.id, { onDelete: "set null" }),
  routingOperationId: varchar("routing_operation_id").references(() => routingOperations.id, { onDelete: "set null" }),
  workCenterId: varchar("work_center_id").references(() => workCenters.id, { onDelete: "set null" }),
  plannedQuantity: numericMoney("planned_quantity"),
  completedQuantity: numericMoney("completed_quantity").default(0),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  completionPercent: numericMoney("completion_percent").default(0),
  excelImportRowId: varchar("excel_import_row_id").references(() => excelImportRows.id, { onDelete: "set null" }),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
}, (t) => [
  check("machine_tasks_priority_chk", sql`${t.priority} IN ('low','normal','high','urgent')`),
  check("machine_tasks_status_chk", sql`${t.status} IN ('pending','in_progress','completed','cancelled')`),
]);

export const insertMachineTaskSchema = createInsertSchema(machineTasks, {
  title: z.string().min(1, "Vazifa nomi kerak"),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type MachineTask = typeof machineTasks.$inferSelect;
export type InsertMachineTask = z.infer<typeof insertMachineTaskSchema>;
