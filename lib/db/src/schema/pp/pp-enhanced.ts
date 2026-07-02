/**
 * @module pp-enhanced
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { numericMoney } from "../numeric-money";
import { sql } from "drizzle-orm";
import { serial, pgTable, text, varchar, integer, boolean, timestamp, jsonb, type AnyPgColumn, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { departments, unitOfMeasures, users } from "../core-schema";
import { materialCategories, materialKits, rawMaterials } from "../mm-schema";
import { qcMaterialTests } from "../qc-schema";
import { warehouses } from "../wms-schema";
import { equipment, products } from "./pp-production";
import { productionSessions } from "./pp-iot";
import { papkaOrders } from "./pp-papka";

// Machine Crews (Mashina jamoalari)
export const machineCrews = pgTable("machine_crews", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id").references(() => productionSessions.id, { onDelete: "cascade" }).notNull(),
  masterId: integer("master_id").notNull(),
  polmasterId: integer("polmaster_id"),
  shogirdId: integer("shogird_id"),
  roklerId: integer("rokler_id"),
  // ── ADD-ONLY: live DB superset columns ──
  workCenterId: integer("work_center_id"),
  employeeId: integer("employee_id"),
  productionOrderId: integer("production_order_id"),
  role: varchar("role", { length: 30 }),
  startDate: varchar("start_date", { length: 10 }),
  endDate: varchar("end_date", { length: 10 }),
  isActive: boolean("is_active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMachineCrewSchema = createInsertSchema(machineCrews).omit({ id: true, createdAt: true } as never);
export type MachineCrew = typeof machineCrews.$inferSelect;
export type InsertMachineCrew = z.infer<typeof insertMachineCrewSchema>;

// Setup Checklists (Sozlash oldi cheklistlari)
export const setupChecklists = pgTable("setup_checklists", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id").references(() => productionSessions.id, { onDelete: "cascade" }).notNull(),
  kitId: varchar("kit_id").references(() => materialKits.id, { onDelete: "set null" }),
  orderId: varchar("order_id").references(() => papkaOrders.id, { onDelete: "set null" }),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  completedBy: integer("completed_by"),
  allMaterialsScanned: boolean("all_materials_scanned").default(false),
  allSettingsConfirmed: boolean("all_settings_confirmed").default(false),
  allCrewAssigned: boolean("all_crew_assigned").default(false),
  testPieceApproved: boolean("test_piece_approved").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSetupChecklistSchema = createInsertSchema(setupChecklists).omit({ id: true, createdAt: true } as never);
export type SetupChecklist = typeof setupChecklists.$inferSelect;
export type InsertSetupChecklist = z.infer<typeof insertSetupChecklistSchema>;

// Checklist Items
export const checklistItems = pgTable("checklist_items", {
  id: serial("id").primaryKey(),
  checklistId: varchar("checklist_id").references(() => setupChecklists.id, { onDelete: "cascade" }).notNull(),
  category: varchar("category", { length: 30 }).notNull(),
  itemType: varchar("item_type", { length: 50 }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  isRequired: boolean("is_required").default(true),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  completedBy: integer("completed_by"),
  value: text("value"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertChecklistItemSchema = createInsertSchema(checklistItems).omit({ id: true, createdAt: true } as never);
export type ChecklistItem = typeof checklistItems.$inferSelect;
export type InsertChecklistItem = z.infer<typeof insertChecklistItemSchema>;

// Material Consumption (Sarflangan materiallar hisobi)
export const materialConsumption = pgTable("material_consumption", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id").references(() => productionSessions.id, { onDelete: "cascade" }).notNull(),
  orderId: varchar("order_id").references(() => papkaOrders.id, { onDelete: "cascade" }).notNull(),
  kitId: varchar("kit_id").references(() => materialKits.id, { onDelete: "set null" }),
  materialId: varchar("material_id").references(() => rawMaterials.id, { onDelete: "set null" }),
  materialName: text("material_name").notNull(),
  issuedQuantity: numericMoney("issued_quantity").notNull(),
  consumedQuantity: numericMoney("consumed_quantity").notNull(),
  returnedQuantity: numericMoney("returned_quantity").default(0),
  wasteQuantity: numericMoney("waste_quantity").default(0),
  unit: varchar("unit", { length: 20 }).notNull(),
  calculatedByAI: boolean("calculated_by_ai").default(false),
  notes: text("notes"),
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
  recordedBy: integer("recorded_by"),
});

export const insertMaterialConsumptionSchema = createInsertSchema(materialConsumption).omit({ id: true, recordedAt: true } as never);
export type MaterialConsumption = typeof materialConsumption.$inferSelect;
export type InsertMaterialConsumption = z.infer<typeof insertMaterialConsumptionSchema>;

// Defect Reports (Brak hisobotlari)
export const defectReports = pgTable("defect_reports", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id").references(() => productionSessions.id, { onDelete: "cascade" }).notNull(),
  orderId: varchar("order_id").references(() => papkaOrders.id, { onDelete: "set null" }),
  quantity: integer("quantity").notNull(),
  defectType: varchar("defect_type", { length: 50 }).notNull(),
  defectCause: varchar("defect_cause", { length: 50 }),
  description: text("description"),
  imageUrl: text("image_url"),
  reportedBy: integer("reported_by").notNull(),
  verifiedBy: integer("verified_by"),
  verifiedAt: timestamp("verified_at"),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const insertDefectReportSchema = createInsertSchema(defectReports).omit({ id: true, createdAt: true, deletedAt: true } as never);
export type DefectReport = typeof defectReports.$inferSelect;
export type InsertDefectReport = z.infer<typeof insertDefectReportSchema>;

// BOM Templates (AI uchun material formulalari)
export const bomTemplates = pgTable("bom_templates", {
  id: serial("id").primaryKey(),
  productType: varchar("product_type", { length: 50 }).notNull(),
  materialCategory: varchar("material_category", { length: 50 }).notNull(),
  materialName: text("material_name").notNull(),
  formula: text("formula").notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type BomTemplate = typeof bomTemplates.$inferSelect;

// Technology Cards
export const technologyCards = pgTable("technology_cards", {
  id: serial("id").primaryKey(),
  productId: varchar("product_id").references(() => products.id, { onDelete: "set null" }),
  papkaOrderId: varchar("papka_order_id").references(() => papkaOrders.id, { onDelete: "set null" }),
  productType: varchar("product_type", { length: 50 }),
  formatA: integer("format_a"),
  formatB: integer("format_b"),
  operations: text("operations"),
  totalDurationMinutes: integer("total_duration_minutes"),
  setupDurationMinutes: integer("setup_duration_minutes"),
  basedOnOrdersCount: integer("based_on_orders_count").default(0),
  averageActualDuration: integer("average_actual_duration"),
  calculatedByAI: boolean("calculated_by_ai").default(true),
  aiModel: varchar("ai_model", { length: 50 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
  deletedBy: varchar("deleted_by"),
});

export const insertTechnologyCardSchema = createInsertSchema(technologyCards).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type TechnologyCard = typeof technologyCards.$inferSelect;
export type InsertTechnologyCard = z.infer<typeof insertTechnologyCardSchema>;

// Material Norms
export const materialNorms = pgTable("material_norms", {
  id: serial("id").primaryKey(),
  productId: varchar("product_id").references(() => products.id, { onDelete: "set null" }),
  technologyCardId: varchar("technology_card_id").references(() => technologyCards.id, { onDelete: "set null" }),
  materialCategoryId: varchar("material_category_id").references(() => materialCategories.id, { onDelete: "set null" }),
  materialId: varchar("material_id").references(() => rawMaterials.id, { onDelete: "set null" }),
  materialName: text("material_name").notNull(),
  normQuantityPer1000: numericMoney("norm_quantity_per_1000").notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
  wastePercentage: numericMoney("waste_percentage").default(5),
  safetyStockPercentage: numericMoney("safety_stock_percentage").default(10),
  basedOnOrdersCount: integer("based_on_orders_count").default(0),
  averageActualConsumption: numericMoney("average_actual_consumption"),
  calculatedByAI: boolean("calculated_by_ai").default(true),
  formula: text("formula"),
  // APPROVED: egasi vizyon-qurish 2026-07-01, FAZA J (Bo'lim ombori + AI norma).
  // Bo'lim-darajasidagi norma override (NULL = global/barcha bo'lim uchun norma).
  // Qiymat-fazosi pos_movements.bulim bilan bir xil (erkin matn, FK yo'q).
  departmentCode: varchar("department_code", { length: 50 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
  deletedBy: varchar("deleted_by"),
});

export const insertMaterialNormSchema = createInsertSchema(materialNorms).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type MaterialNorm = typeof materialNorms.$inferSelect;
export type InsertMaterialNorm = z.infer<typeof insertMaterialNormSchema>;

// Order Production History
export const orderProductionHistory = pgTable("order_production_history", {
  id: serial("id").primaryKey(),
  orderId: varchar("order_id").references(() => papkaOrders.id, { onDelete: "cascade" }).notNull(),
  sessionId: varchar("session_id").references(() => productionSessions.id, { onDelete: "set null" }),
  equipmentId: varchar("equipment_id").references(() => equipment.id, { onDelete: "set null" }),
  equipmentName: text("equipment_name"),
  masterId: integer("master_id"),
  masterName: text("master_name"),
  polmasterId: integer("polmaster_id"),
  polmasterName: text("polmaster_name"),
  shogirdId: integer("shogird_id"),
  shogirdName: text("shogird_name"),
  roxlerchiId: integer("roxlerchi_id"),
  roxlerchiName: text("roxlerchi_name"),
  plannedDurationMinutes: integer("planned_duration_minutes"),
  actualDurationMinutes: integer("actual_duration_minutes"),
  setupDurationMinutes: integer("setup_duration_minutes"),
  downtimeMinutes: integer("downtime_minutes"),
  plannedQuantity: integer("planned_quantity"),
  actualQuantity: integer("actual_quantity"),
  defectQuantity: integer("defect_quantity"),
  materialsPlan: text("materials_plan"),
  materialsActual: text("materials_actual"),
  materialsVariance: text("materials_variance"),
  totalMaterialCost: numericMoney("total_material_cost"),
  wasteAnalysis: text("waste_analysis"),
  availability: numericMoney("availability"),
  performance: numericMoney("performance"),
  quality: numericMoney("quality"),
  oee: numericMoney("oee"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOrderProductionHistorySchema = createInsertSchema(orderProductionHistory).omit({ id: true, createdAt: true } as never);
export type OrderProductionHistory = typeof orderProductionHistory.$inferSelect;
export type InsertOrderProductionHistory = z.infer<typeof insertOrderProductionHistorySchema>;

// Asset Inventory (Asosiy vositalar inventarizatsiyasi)
export const assetInventory = pgTable("asset_inventory", {
  id: serial("id").primaryKey(),
  assetCode: varchar("asset_code", { length: 50 }).notNull().unique(),
  assetName: text("asset_name").notNull(),
  assetNameRu: text("asset_name_ru"),
  assetType: varchar("asset_type", { length: 30 }).notNull(),
  location: text("location"),
  departmentId: integer("department_id").references(() => departments.id, { onDelete: "set null" }),
  responsibleId: integer("responsible_id"),
  purchaseDate: varchar("purchase_date", { length: 10 }),
  purchaseValue: numericMoney("purchase_value").notNull(),
  currentValue: numericMoney("current_value").notNull(),
  depreciationMethod: varchar("depreciation_method", { length: 20 }).default("straight_line"),
  usefulLife: integer("useful_life"),
  salvageValue: numericMoney("salvage_value").default(0),
  accumulatedDepreciation: numericMoney("accumulated_depreciation").default(0),
  condition: varchar("condition", { length: 20 }).default("good"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  lastInventoryDate: varchar("last_inventory_date", { length: 10 }),
  serialNumber: varchar("serial_number", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("asset_inventory_type_chk", sql`${t.assetType} IN ('equipment','vehicle','building','furniture','it_equipment')`),
  check("asset_inventory_depreciation_chk", sql`${t.depreciationMethod} IS NULL OR ${t.depreciationMethod} IN ('straight_line','declining_balance')`),
  check("asset_inventory_condition_chk", sql`${t.condition} IS NULL OR ${t.condition} IN ('excellent','good','fair','poor')`),
  check("asset_inventory_status_chk", sql`${t.status} IN ('active','disposed','under_repair')`),
]);

export const insertAssetInventorySchema = createInsertSchema(assetInventory, {
  assetCode: z.string().min(3, "Aktiv kodi kamida 3 ta belgidan iborat bo'lishi kerak"),
  assetName: z.string().min(2, "Aktiv nomi kamida 2 ta belgidan iborat bo'lishi kerak"),
  assetType: z.enum(["equipment", "vehicle", "building", "furniture", "it_equipment"]),
  purchaseValue: z.number().nonnegative("Xarid qiymati 0 dan kam bo'lmasligi kerak"),
  currentValue: z.number().nonnegative("Joriy qiymat 0 dan kam bo'lmasligi kerak"),
  depreciationMethod: z.enum(["straight_line", "declining_balance"]).default("straight_line"),
  condition: z.enum(["excellent", "good", "fair", "poor"]).default("good"),
  status: z.enum(["active", "disposed", "under_repair"]).default("active"),
}).omit({ id: true, createdAt: true } as never);

export type AssetInventory = typeof assetInventory.$inferSelect;
export type InsertAssetInventory = z.infer<typeof insertAssetInventorySchema>;

// Product Categories (Mijoz sayti)
export const productCategories = pgTable("product_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  descriptionRu: text("description_ru"),
  imageUrl: text("image_url"),
  parentId: varchar("parent_id").references((): AnyPgColumn => productCategories.id, { onDelete: "set null" }),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  // ── ADD-ONLY: live DB superset columns ──
  sort: integer("sort"),
  active: boolean("active"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // convergence: live-DB columns added (additive)
  updatedAt: timestamp("updated_at"),
});

export const insertProductCategorySchema = createInsertSchema(productCategories).omit({ id: true, createdAt: true } as never);
export type ProductCategory = typeof productCategories.$inferSelect;
export type InsertProductCategory = z.infer<typeof insertProductCategorySchema>;

// Product Master
export const productMasters = pgTable("product_masters", {
  id: serial("id").primaryKey(),
  productCode: varchar("product_code", { length: 50 }).notNull().unique(),
  productName: text("product_name").notNull(),
  productNameRu: text("product_name_ru"),
  productType: varchar("product_type", { length: 30 }).notNull(),
  categoryCode: varchar("category_code", { length: 50 }),
  unitOfMeasureId: varchar("unit_of_measure_id").references(() => unitOfMeasures.id, { onDelete: "set null" }),
  defaultWarehouseId: varchar("default_warehouse_id").references(() => warehouses.id, { onDelete: "set null" }),
  minimumStock: numericMoney("minimum_stock").default(0),
  maximumStock: numericMoney("maximum_stock"),
  reorderPoint: numericMoney("reorder_point"),
  reorderQuantity: numericMoney("reorder_quantity"),
  standardCost: numericMoney("standard_cost"),
  listPrice: numericMoney("list_price"),
  currency: varchar("currency", { length: 10 }).default("UZS"),
  leadTimeDays: integer("lead_time_days").default(0),
  shelfLifeDays: integer("shelf_life_days"),
  isBatchManaged: boolean("is_batch_managed").default(false),
  isSerialManaged: boolean("is_serial_managed").default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export type ProductMaster = typeof productMasters.$inferSelect;
export const insertProductMasterSchema = createInsertSchema(productMasters).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type InsertProductMaster = z.infer<typeof insertProductMasterSchema>;

// Order Approvals (Buyurtma tasdiqlash tarixi)
export const orderApprovals = pgTable("order_approvals", {
  id: serial("id").primaryKey(),
  orderId: varchar("order_id").notNull().references(() => papkaOrders.id, { onDelete: "cascade" }),
  stage: varchar("stage", { length: 30 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  approvedBy: integer("approved_by"),
  approvedAt: timestamp("approved_at"),
  stageData: jsonb("stage_data"),
  designFileUrl: text("design_file_url"),
  designVersion: varchar("design_version", { length: 20 }),
  bomApproved: boolean("bom_approved"),
  routingApproved: boolean("routing_approved"),
  techCardApproved: boolean("tech_card_approved"),
  qcTestId: varchar("qc_test_id").references(() => qcMaterialTests.id, { onDelete: "set null" }),
  materialApproved: boolean("material_approved"),
  advancePercentage: numericMoney("advance_percentage"),
  advanceAmount: numericMoney("advance_amount"),
  creditLimitOk: boolean("credit_limit_ok"),
  debtStatusOk: boolean("debt_status_ok"),
  comments: text("comments"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
}, (t) => [
  check("order_approvals_stage_chk", sql`${t.stage} IN ('design','technical','qc','finance')`),
  check("order_approvals_status_chk", sql`${t.status} IN ('pending','approved','rejected','revision_requested')`),
]);

export const insertOrderApprovalSchema = createInsertSchema(orderApprovals, {
  stage: z.enum(["design", "technical", "qc", "finance"]),
  status: z.enum(["pending", "approved", "rejected", "revision_requested"]),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type OrderApproval = typeof orderApprovals.$inferSelect;
export type InsertOrderApproval = z.infer<typeof insertOrderApprovalSchema>;

// Waste Records
export const wasteRecords = pgTable("waste_records", {
  id: serial("id").primaryKey(),
  productionOrderId: varchar("production_order_id"),
  orderId: varchar("order_id"),
  machineId: varchar("machine_id"),
  operatorId: integer("operator_id"),
  wasteType: varchar("waste_type", { length: 30 }).notNull(),
  materialType: varchar("material_type", { length: 50 }),
  quantity: numericMoney("quantity").notNull(),
  unit: varchar("unit", { length: 20 }).notNull().default("kg"),
  costPerUnit: numericMoney("cost_per_unit").default(0),
  totalCost: numericMoney("total_cost").default(0),
  cause: text("cause"),
  correctionAction: text("correction_action"),
  shiftNumber: integer("shift_number"),
  date: varchar("date", { length: 10 }).notNull(),
  notes: text("notes"),
  isRecyclable: boolean("is_recyclable").default(false),
  recycledQuantity: numericMoney("recycled_quantity").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("waste_records_waste_type_chk", sql`${t.wasteType} IN ('setup','trim','defect','overrun','material_defect','other')`),
]);

export const wasteTargets = pgTable("waste_targets", {
  id: serial("id").primaryKey(),
  targetType: varchar("target_type", { length: 20 }).notNull(),
  machineId: varchar("machine_id"),
  materialType: varchar("material_type", { length: 50 }),
  maxWastePercentage: numericMoney("max_waste_percentage").notNull(),
  maxWasteCost: numericMoney("max_waste_cost"),
  period: varchar("period", { length: 10 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("waste_targets_target_type_chk", sql`${t.targetType} IN ('daily','weekly','monthly')`),
]);

export const insertWasteRecordSchema = createInsertSchema(wasteRecords, {
  wasteType: z.enum(["setup", "trim", "defect", "overrun", "material_defect", "other"]),
  quantity: z.number().positive("Miqdor musbat bo'lishi kerak"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD formatida"),
}).omit({ id: true, createdAt: true } as never);

export const insertWasteTargetSchema = createInsertSchema(wasteTargets, {
  targetType: z.enum(["daily", "weekly", "monthly"]),
  maxWastePercentage: z.number().min(0).max(100),
}).omit({ id: true, createdAt: true } as never);

export type WasteRecord = typeof wasteRecords.$inferSelect;
export type InsertWasteRecord = z.infer<typeof insertWasteRecordSchema>;
export type WasteTarget = typeof wasteTargets.$inferSelect;
export type InsertWasteTarget = z.infer<typeof insertWasteTargetSchema>;

// OEE Records
export const oeeRecords = pgTable("oee_records", {
  id: serial("id").primaryKey(),
  machineId: varchar("machine_id").notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  shiftNumber: integer("shift_number"),
  availability: numericMoney("availability").notNull(),
  performance: numericMoney("performance").notNull(),
  quality: numericMoney("quality").notNull(),
  oee: numericMoney("oee").notNull(),
  plannedProductionTime: numericMoney("planned_production_time").default(0),
  actualRunTime: numericMoney("actual_run_time").default(0),
  totalCount: integer("total_count").default(0),
  goodCount: integer("good_count").default(0),
  idealCycleTime: numericMoney("ideal_cycle_time").default(0),
  downtimeMinutes: numericMoney("downtime_minutes").default(0),
  downtimeReasons: jsonb("downtime_reasons"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOeeRecordSchema = createInsertSchema(oeeRecords).omit({ id: true, createdAt: true } as never);
export type OeeRecord = typeof oeeRecords.$inferSelect;
export type InsertOeeRecord = z.infer<typeof insertOeeRecordSchema>;

// AI Production Plans
export const aiProductionPlans = pgTable("ai_production_plans", {
  id: serial("id").primaryKey(),
  planNumber: varchar("plan_number", { length: 20 }).notNull(),
  planDate: varchar("plan_date", { length: 10 }).notNull(),
  planType: varchar("plan_type", { length: 20 }).notNull().default("daily"),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  confidenceScore: numericMoney("confidence_score").notNull().default(0),
  autoApproved: boolean("auto_approved").notNull().default(false),
  autoApprovalThreshold: numericMoney("auto_approval_threshold").default(85),
  totalOrders: integer("total_orders").default(0),
  totalMachineHours: numericMoney("total_machine_hours").default(0),
  estimatedCompletion: varchar("estimated_completion", { length: 20 }),
  planData: jsonb("plan_data"),
  optimizationMetrics: jsonb("optimization_metrics"),
  aiRecommendations: jsonb("ai_recommendations"),
  createdBy: varchar("created_by"),
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const aiPlanningDecisions = pgTable("ai_planning_decisions", {
  id: serial("id").primaryKey(),
  planId: varchar("plan_id").notNull().references(() => aiProductionPlans.id, { onDelete: "cascade" }),
  decisionType: varchar("decision_type", { length: 30 }).notNull(),
  description: text("description").notNull(),
  confidenceScore: numericMoney("confidence_score").default(0),
  impact: varchar("impact", { length: 10 }).notNull().default("medium"),
  status: varchar("status", { length: 20 }).notNull().default("proposed"),
  executedAt: timestamp("executed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAiProductionPlanSchema = createInsertSchema(aiProductionPlans).omit({ id: true, createdAt: true, updatedAt: true, approvedAt: true } as never);
export const insertAiPlanningDecisionSchema = createInsertSchema(aiPlanningDecisions).omit({ id: true, createdAt: true, executedAt: true } as never);

export type AiProductionPlan = typeof aiProductionPlans.$inferSelect;
export type InsertAiProductionPlan = z.infer<typeof insertAiProductionPlanSchema>;
export type AiPlanningDecision = typeof aiPlanningDecisions.$inferSelect;
export type InsertAiPlanningDecision = z.infer<typeof insertAiPlanningDecisionSchema>;

// Equipment Maintenance
export const equipmentMaintenance = pgTable("equipment_maintenance", {
  id: serial("id").primaryKey(),
  equipmentName: varchar("equipment_name", { length: 255 }).notNull(),
  equipmentCode: varchar("equipment_code", { length: 50 }),
  location: varchar("location", { length: 200 }),
  maintenanceType: varchar("maintenance_type", { length: 30 }).notNull(),
  scheduledDate: varchar("scheduled_date", { length: 20 }),
  completedDate: varchar("completed_date", { length: 20 }),
  frequency: varchar("frequency", { length: 30 }),
  lastMaintenanceDate: varchar("last_maintenance_date", { length: 20 }),
  nextMaintenanceDate: varchar("next_maintenance_date", { length: 20 }),
  assignedTo: varchar("assigned_to"),
  status: varchar("status", { length: 20 }).notNull().default("scheduled"),
  cost: numericMoney("cost").default(0),
  notes: text("notes"),
  // ── ADD-ONLY: live DB superset columns ──
  workCenterId: integer("work_center_id"),
  type: varchar("type", { length: 30 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("equip_maint_type_chk", sql`${t.maintenanceType} IN ('PREVENTIVE','CORRECTIVE','PREDICTIVE','EMERGENCY')`),
  check("equip_maint_freq_chk", sql`${t.frequency} IS NULL OR ${t.frequency} IN ('DAILY','WEEKLY','MONTHLY','QUARTERLY','SEMI_ANNUAL','ANNUAL')`),
  check("equip_maint_status_chk", sql`${t.status} IN ('scheduled','in_progress','completed','overdue','cancelled')`),
]);

export const insertEquipmentMaintenanceSchema = createInsertSchema(equipmentMaintenance, {
  maintenanceType: z.enum(["PREVENTIVE", "CORRECTIVE", "PREDICTIVE", "EMERGENCY"]),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "SEMI_ANNUAL", "ANNUAL"]).optional(),
  status: z.enum(["scheduled", "in_progress", "completed", "overdue", "cancelled"]).default("scheduled"),
}).omit({ id: true, createdAt: true } as never);

export type EquipmentMaintenance = typeof equipmentMaintenance.$inferSelect;
export type InsertEquipmentMaintenance = z.infer<typeof insertEquipmentMaintenanceSchema>;

// SOS Alerts
export const sosAlerts = pgTable("sos_alerts", {
  id: serial("id").primaryKey(),
  workerId: integer("worker_id").notNull(),
  workerName: varchar("worker_name", { length: 255 }).notNull(),
  sessionId: varchar("session_id"),
  equipmentId: varchar("equipment_id"),
  alertType: varchar("alert_type", { length: 50 }).notNull().default("other"),
  message: text("message").notNull().default(""),
  status: varchar("status", { length: 20 }).notNull().default("open"),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: integer("resolved_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSosAlertSchema = createInsertSchema(sosAlerts).omit({ id: true, createdAt: true } as never);
export type SosAlert = typeof sosAlerts.$inferSelect;
export type InsertSosAlert = z.infer<typeof insertSosAlertSchema>;

// ============================================================
// ASSET MAINTENANCE & DISPOSAL (Asset Management)
// ============================================================

export const assetMaintenanceRecords = pgTable("asset_maintenance_records", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id").notNull().references(() => assetInventory.id, { onDelete: "cascade" }),
  maintenanceType: varchar("maintenance_type", { length: 30 }).notNull().default("preventive"),
  scheduledDate: varchar("scheduled_date", { length: 10 }),
  completedDate: varchar("completed_date", { length: 10 }),
  technicianName: text("technician_name"),
  vendorId: integer("vendor_id"),
  cost: numericMoney("cost").default(0),
  description: text("description"),
  status: varchar("status", { length: 20 }).notNull().default("scheduled"),
  notes: text("notes"),
  nextMaintenanceDate: varchar("next_maintenance_date", { length: 10 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("asset_maint_type_chk", sql`${t.maintenanceType} IN ('preventive','corrective','predictive','emergency')`),
  check("asset_maint_status_chk", sql`${t.status} IN ('scheduled','in_progress','completed','cancelled')`),
]);

// assetDisposals — canonical definition lives in ../admin-assets
export { assetDisposals, insertAssetDisposalSchema } from "../admin-assets";
export type { AssetDisposal, InsertAssetDisposal } from "../admin-assets";

export const insertAssetMaintenanceSchema = createInsertSchema(assetMaintenanceRecords, {
  maintenanceType: z.enum(["preventive", "corrective", "predictive", "emergency"]).default("preventive"),
  cost: z.number().nonnegative().default(0),
  status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled"),
}).omit({ id: true, createdAt: true } as never);

export type AssetMaintenanceRecord = typeof assetMaintenanceRecords.$inferSelect;
export type InsertAssetMaintenance = z.infer<typeof insertAssetMaintenanceSchema>;

// ============================================================
// ASSET TRANSFERS — canonical definition lives in ../admin-assets
// ============================================================

export { assetTransfers, insertAssetTransferSchema } from "../admin-assets";
export type { AssetTransfer, InsertAssetTransfer } from "../admin-assets";

// ============================================================
// ASSET INSURANCE (Asosiy vosita sug'urtasi)
// ============================================================

export const assetInsurance = pgTable("asset_insurance", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id").notNull().references(() => assetInventory.id, { onDelete: "cascade" }),
  policyNumber: varchar("policy_number", { length: 100 }).notNull(),
  insurerName: text("insurer_name").notNull(),
  coverageType: varchar("coverage_type", { length: 50 }).notNull().default("comprehensive"),
  startDate: varchar("start_date", { length: 10 }).notNull(),
  endDate: varchar("end_date", { length: 10 }).notNull(),
  premiumAmount: numericMoney("premium_amount").default(0),
  coverageAmount: numericMoney("coverage_amount").default(0),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  contactInfo: text("contact_info"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("asset_insurance_coverage_chk", sql`${t.coverageType} IN ('comprehensive','partial','fire','theft','liability')`),
  check("asset_insurance_status_chk", sql`${t.status} IN ('active','expired','cancelled')`),
]);

export const insertAssetInsuranceSchema = createInsertSchema(assetInsurance, {
  policyNumber: z.string().min(1, "Polisi raqami kerak"),
  insurerName: z.string().min(1, "Sug'urta kompaniyasi nomi kerak"),
  coverageType: z.enum(["comprehensive", "partial", "fire", "theft", "liability"]).default("comprehensive"),
  startDate: z.string().min(8, "Boshlanish sanasi kerak"),
  endDate: z.string().min(8, "Tugash sanasi kerak"),
  premiumAmount: z.number().nonnegative().default(0),
  coverageAmount: z.number().nonnegative().default(0),
  status: z.enum(["active", "expired", "cancelled"]).default("active"),
}).omit({ id: true, createdAt: true } as never);

export type AssetInsurance = typeof assetInsurance.$inferSelect;
export type InsertAssetInsurance = z.infer<typeof insertAssetInsuranceSchema>;
