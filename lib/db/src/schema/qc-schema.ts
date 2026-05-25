/**
 * @module qc-schema
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { numericMoney } from "./numeric-money";
import { sql } from "drizzle-orm";
import { serial, pgTable, text, varchar, integer, boolean, timestamp, jsonb, unique, uuid, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./core-schema";
import { Test } from "./lms-schema";
import { materialCards } from "./mm-schema";
import { papkaOrders } from "./pp-schema";


// ============================================
// QUALITY CONTROL (QC) MODULE - SIFAT NAZORATI
// ============================================

// QC Standards (Normalar bazasi - ISO, GOST, O'zDSt, ichki normalar)
export const qcStandards = pgTable("qc_standards", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(), // ISO 3037, GOST 7376, UzDSt 1234
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  type: varchar("type", { length: 30 }).notNull(), // iso, gost, uzst, internal
  category: varchar("category", { length: 50 }).notNull(), // physical, mechanical, printability, chemical, environmental, logistics, visual
  description: text("description"),
  descriptionRu: text("description_ru"),
  validFrom: varchar("valid_from", { length: 10 }), // YYYY-MM-DD
  validTo: varchar("valid_to", { length: 10 }), // YYYY-MM-DD (null = hozirgi)
  isActive: boolean("is_active").notNull().default(true),
  documentUrl: text("document_url"), // Litsenziya hujjati
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
}, (t) => [
  check("qc_standards_type_chk", sql`${t.type} IN ('iso','gost','uzst','internal')`),
  check("qc_standards_category_chk", sql`${t.category} IN ('physical','mechanical','printability','chemical','environmental','logistics','visual','documentation','ai_analysis')`),
]);


// QC Parameter Definitions (Parametr ta'riflari)
export const qcParameterDefinitions = pgTable("qc_parameter_definitions", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(), // grammatura, qalinlik, tensile_strength
  name: text("name").notNull(), // Grammatura
  nameRu: text("name_ru"), // Граммаж
  category: varchar("category", { length: 50 }).notNull(), // 1-physical, 2-mechanical, 3-printability, 4-chemical, 5-environmental, 6-logistics, 7-visual, 8-documentation, 9-ai_analysis
  unit: varchar("unit", { length: 30 }), // g/m², mm, kN/m, kg, %, °C
  dataType: varchar("data_type", { length: 20 }).notNull().default("number"), // number, boolean, text, range
  minValue: numericMoney("min_value"), // Minimal qiymat (norma) - fail if below
  maxValue: numericMoney("max_value"), // Maksimal qiymat (norma) - fail if above
  warningMinValue: numericMoney("warning_min_value"), // Warning threshold (lower)
  warningMaxValue: numericMoney("warning_max_value"), // Warning threshold (upper)
  defaultValue: numericMoney("default_value"), // Standart qiymat
  standardId: integer("standard_id").references(() => qcStandards.id, { onDelete: "set null" }), // Bog'langan standart
  testMethod: text("test_method"), // Test usuli tavsifi
  testMethodRu: text("test_method_ru"),
  equipmentRequired: text("equipment_required"), // Kerakli uskuna
  isRequired: boolean("is_required").notNull().default(false), // Majburiy parametr
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("qc_param_defs_category_chk", sql`${t.category} IN ('physical','mechanical','printability','chemical','environmental','logistics','visual','documentation','ai_analysis')`),
  check("qc_param_defs_data_type_chk", sql`${t.dataType} IN ('number','boolean','text','range')`),
]);


// QC Material Tests (Material test natijalari)
export const qcMaterialTests = pgTable("qc_material_tests", {
  id: serial("id").primaryKey(),
  orderId: varchar("order_id").references(() => papkaOrders.id, { onDelete: "set null" }), // Buyurtma
  materialCardId: varchar("material_id").references(() => materialCards.id, { onDelete: "set null" }), // Material
  batchNumber: varchar("batch_number", { length: 50 }), // Partiya raqami
  testCategory: varchar("test_category", { length: 50 }).notNull().default("physical"), // Category being tested
  testDate: varchar("test_date", { length: 10 }).notNull(), // YYYY-MM-DD
  testedBy: varchar("tested_by").references(() => users.id, { onDelete: "set null" }), // Operator
  equipmentUsed: text("equipment_used"), // Ishlatilgan uskuna
  
  // Natijalar JSONB formatida - har bir parametr uchun
  testResults: jsonb("test_results").notNull(), // [{parameterId, value, status, deviation}]
  
  overallStatus: varchar("overall_status", { length: 20 }).notNull().default("pending"), // pending, passed, failed, conditional
  passedCount: integer("passed_count").default(0),
  failedCount: integer("failed_count").default(0),
  warningCount: integer("warning_count").default(0),
  
  // AI tahlili
  aiAnalysis: jsonb("ai_analysis"), // {riskLevel, recommendations, predictedIssues}
  aiConfidenceScore: numericMoney("ai_confidence_score"), // 0-100
  
  notes: text("notes"),
  certificateNumber: varchar("certificate_number", { length: 50 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
}, (t) => [
  check("qc_material_tests_status_chk", sql`${t.overallStatus} IN ('pending','passed','failed','conditional')`),
  check("qc_material_tests_test_category_chk", sql`${t.testCategory} IN ('physical','mechanical','printability','chemical','environmental','logistics','visual','documentation','ai_analysis')`),
  check("qc_material_tests_passed_count_chk", sql`${t.passedCount} IS NULL OR ${t.passedCount} >= 0`),
  check("qc_material_tests_failed_count_chk", sql`${t.failedCount} IS NULL OR ${t.failedCount} >= 0`),
]);


// Insert schemas for QC module
export const insertQcStandardSchema = createInsertSchema(qcStandards, {
  code: z.string().min(1, "Kod kerak"),
  name: z.string().min(1, "Nom kerak"),
  type: z.enum(["iso", "gost", "uzst", "internal"]),
  category: z.enum(["physical", "mechanical", "printability", "chemical", "environmental", "logistics", "visual", "documentation", "ai_analysis"]),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);


export type QcStandard = typeof qcStandards.$inferSelect;

export type InsertQcStandard = z.infer<typeof insertQcStandardSchema>;


export const insertQcParameterDefinitionSchema = createInsertSchema(qcParameterDefinitions, {
  code: z.string().min(1, "Kod kerak"),
  name: z.string().min(1, "Nom kerak"),
  category: z.enum(["physical", "mechanical", "printability", "chemical", "environmental", "logistics", "visual", "documentation", "ai_analysis"]),
  dataType: z.enum(["number", "boolean", "text", "range"]),
}).omit({ id: true, createdAt: true } as never);


export type QcParameterDefinition = typeof qcParameterDefinitions.$inferSelect;

export type InsertQcParameterDefinition = z.infer<typeof insertQcParameterDefinitionSchema>;


export const insertQcMaterialTestSchema = createInsertSchema(qcMaterialTests, {
  orderId: z.string().optional().nullable(),
  testCategory: z.enum(["physical", "mechanical", "printability", "chemical", "environmental", "logistics", "visual", "documentation", "ai_analysis"]),
  testDate: z.string().min(10, "Sana kerak"),
  testResults: z.array(z.object({
    parameterId: z.string(),
    value: z.union([z.number(), z.boolean(), z.string()]),
    status: z.enum(["passed", "failed", "warning"]),
    deviation: z.number().optional()
  })),
  overallStatus: z.enum(["pending", "passed", "failed", "conditional"]),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);


export type QcMaterialTest = typeof qcMaterialTests.$inferSelect;

export type InsertQcMaterialTest = z.infer<typeof insertQcMaterialTestSchema>;



// ========== TZ_04 (04-05): QC Yakuniy Tekshiruv ==========
export const qcFinalInspections = pgTable("qc_final_inspections", {
  id: serial("id").primaryKey(),
  papkaOrderId: varchar("papka_order_id").notNull().references(() => papkaOrders.id),
  inspectedBy: varchar("inspected_by").references(() => users.id, { onDelete: "set null" }),
  inspectedAt: timestamp("inspected_at").notNull().defaultNow(),
  // Namunaviy nazorat (TZ_04 spec bo'yicha)
  sampleSize: integer("sample_size").notNull().default(10),   // Namuna soni
  passedCount: integer("passed_count").notNull().default(0),  // O'tgan namunalar
  defectCount: integer("defect_count").notNull().default(0),  // Nuqsonli soni
  defectRate: numericMoney("defect_rate"),                  // Nuqson foizi
  // O'lchovlar va parametrlar
  parameters: jsonb("parameters"),  // { moisture, thickness, printColor, ... }
  // Natija: passed | failed | rework
  result: varchar("result", { length: 20 }).notNull().default("pending"), // pending, passed, failed, rework
  notes: text("notes"),
  photos: jsonb("photos"),  // URL massivi
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("qc_final_inspections_result_chk", sql`${t.result} IN ('pending','passed','failed','rework','conditional_pass','rework_required')`),
  check("qc_final_inspections_sample_size_chk", sql`${t.sampleSize} > 0`),
  check("qc_final_inspections_passed_count_chk", sql`${t.passedCount} >= 0`),
  check("qc_final_inspections_defect_count_chk", sql`${t.defectCount} >= 0`),
  check("qc_final_inspections_defect_rate_chk", sql`${t.defectRate} IS NULL OR (${t.defectRate} >= 0 AND ${t.defectRate} <= 100)`),
]);

// TZ-07: To'liq QC final natija holatlari (hujjat bilan mos)
export const QC_FINAL_RESULTS = ["pending", "passed", "conditional_pass", "failed", "rework_required"] as const;
export type QcFinalResult = typeof QC_FINAL_RESULTS[number];

export const QC_FINAL_RESULT_LABELS: Record<QcFinalResult, string> = {
  pending:          "Kutilmoqda",
  passed:           "O'tdi",
  conditional_pass: "Shartli o'tdi",
  failed:           "Muvaffaqiyatsiz (brak)",
  rework_required:  "Qayta ishlash kerak",
};

export const insertQcFinalInspectionSchema = createInsertSchema(qcFinalInspections, {
  papkaOrderId: z.string().min(1, "Buyurtma ID kerak"),
  sampleSize: z.number().int().min(1).default(10),
  passedCount: z.number().int().min(0).default(0),
  defectCount: z.number().int().min(0).default(0),
  parameters: z.record(z.unknown()).optional(),
  result: z.enum(QC_FINAL_RESULTS).default("pending"),
  notes: z.string().optional(),
}).omit({ id: true, createdAt: true, inspectedAt: true } as never);

export type QcFinalInspection = typeof qcFinalInspections.$inferSelect;
export type InsertQcFinalInspection = z.infer<typeof insertQcFinalInspectionSchema>;


// ========== TZ_04: Reklamatsiya boshqaruvi ==========
export const qcReclamations = pgTable("qc_reclamations", {
  id: serial("id").primaryKey(),
  reclamationNumber: varchar("reclamation_number", { length: 30 }).notNull().unique(),
  papkaOrderId: varchar("papka_order_id").references(() => papkaOrders.id, { onDelete: "set null" }),
  clientId: varchar("client_id"),
  clientName: text("client_name").notNull(),
  claimDate: varchar("claim_date", { length: 10 }).notNull(),
  issueType: varchar("issue_type", { length: 50 }).notNull(), // print_quality, size_mismatch, moisture, damage, other
  description: text("description").notNull(),
  defectQuantity: integer("defect_quantity").default(0),
  defectUnit: varchar("defect_unit", { length: 20 }).default("dona"),
  photos: jsonb("photos"), // URL array
  status: varchar("status", { length: 30 }).notNull().default("new"), // new, investigating, resolved, rejected
  responsibleUserId: integer("responsible_user_id").references(() => users.id, { onDelete: "set null" }),
  resolution: text("resolution"),
  resolvedAt: timestamp("resolved_at"),
  deadlineDays: integer("deadline_days").default(5),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  check("qc_reclamations_issue_type_chk", sql`${t.issueType} IN ('print_quality','size_mismatch','moisture','damage','other')`),
  check("qc_reclamations_status_chk", sql`${t.status} IN ('new','investigating','resolved','rejected')`),
]);

export const insertQcReclamationSchema = createInsertSchema(qcReclamations, {
  clientName: z.string().min(1, "Mijoz nomi kerak"),
  claimDate: z.string().min(10, "Sana kerak"),
  issueType: z.enum(["print_quality", "size_mismatch", "moisture", "damage", "other"]),
  description: z.string().min(1, "Tavsif kerak"),
  status: z.enum(["new", "investigating", "resolved", "rejected"]).default("new"),
}).omit({ id: true, createdAt: true, updatedAt: true, resolvedAt: true } as never);

export type QcReclamation = typeof qcReclamations.$inferSelect;
export type InsertQcReclamation = z.infer<typeof insertQcReclamationSchema>;


// ========== TZ_04: Brak boshqaruvi ==========
export const qcBraks = pgTable("qc_braks", {
  id: serial("id").primaryKey(),
  papkaOrderId: varchar("papka_order_id").references(() => papkaOrders.id, { onDelete: "set null" }),
  brakDate: varchar("brak_date", { length: 10 }).notNull(),
  stage: varchar("stage", { length: 50 }).notNull(), // incoming, production, final, warehouse
  quantity: integer("quantity").notNull().default(0),
  unit: varchar("unit", { length: 20 }).default("dona"),
  reason: varchar("reason", { length: 100 }).notNull(), // misprint, size, damage, moisture, equipment, operator_error, material
  description: text("description"),
  equipmentId: varchar("equipment_id"),
  operatorId: varchar("operator_id").references(() => users.id, { onDelete: "set null" }),
  costImpact: numericMoney("cost_impact").default(0),
  isReworkable: boolean("is_reworkable").default(false),
  reworked: boolean("reworked").default(false),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("qc_braks_stage_chk", sql`${t.stage} IN ('incoming','production','final','warehouse')`),
]);

export const insertQcBrakSchema = createInsertSchema(qcBraks, {
  brakDate: z.string().min(10, "Sana kerak"),
  stage: z.enum(["incoming", "production", "final", "warehouse"]),
  quantity: z.number().int().min(1, "Miqdor kerak"),
  reason: z.string().min(1, "Sabab kerak"),
}).omit({ id: true, createdAt: true } as never);

export type QcBrak = typeof qcBraks.$inferSelect;
export type InsertQcBrak = z.infer<typeof insertQcBrakSchema>;


// ========== TZ_04: Supplier Quality reytingi ==========
export const qcSupplierQuality = pgTable("qc_supplier_quality", {
  id: serial("id").primaryKey(),
  supplierId: varchar("supplier_id"),
  supplierName: text("supplier_name").notNull(),
  materialCardId: varchar("material_id").references(() => materialCards.id, { onDelete: "set null" }),
  deliveryDate: varchar("delivery_date", { length: 10 }).notNull(),
  totalQuantity: integer("total_quantity").notNull().default(0),
  rejectedQuantity: integer("rejected_quantity").default(0),
  passRate: numericMoney("pass_rate").default(100),
  qualityScore: integer("quality_score").default(100), // 0-100
  testId: varchar("test_id").references(() => qcMaterialTests.id, { onDelete: "set null" }),
  issues: jsonb("issues"), // [{parameter, value, expected}]
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertQcSupplierQualitySchema = createInsertSchema(qcSupplierQuality, {
  supplierName: z.string().min(1, "Yetkazuvchi nomi kerak"),
  deliveryDate: z.string().min(10, "Sana kerak"),
  totalQuantity: z.number().int().min(0),
}).omit({ id: true, createdAt: true } as never);

export type QcSupplierQuality = typeof qcSupplierQuality.$inferSelect;
export type InsertQcSupplierQuality = z.infer<typeof insertQcSupplierQualitySchema>;

// Inline QC checks — recorded by tablet operators during production
export const inlineQcChecks = pgTable("inline_qc_checks", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id").notNull(),
  sampleSize: integer("sample_size").notNull().default(10),
  defectCount: integer("defect_count").notNull().default(0),
  passRate: integer("pass_rate").notNull().default(100),
  notes: text("notes"),
  checkedAt: timestamp("checked_at").notNull().defaultNow(),
});

export type InlineQcCheck = typeof inlineQcChecks.$inferSelect;


// ========== TZ-07: Root Cause Analysis (RCA) — ildiz sabab tahlili ==========
export const qcRootCauses = pgTable("qc_root_causes", {
  id: serial("id").primaryKey(),
  // Bog'liq ob'ekt
  entityType: varchar("entity_type", { length: 30 }).notNull(), // final_inspection, brak, reclamation, material_test
  entityId: varchar("entity_id").notNull(),
  papkaOrderId: varchar("papka_order_id").references(() => papkaOrders.id, { onDelete: "set null" }),
  // RCA ma'lumotlari (5-Why usuli)
  why1: text("why1"),
  why2: text("why2"),
  why3: text("why3"),
  why4: text("why4"),
  why5: text("why5"),
  rootCause: text("root_cause"),          // Asosiy topilgan sabab
  category: varchar("category", { length: 50 }), // equipment, operator, material, process, environment
  // Korrupsiya chorasi
  correctiveAction: text("corrective_action"),
  preventiveAction: text("preventive_action"),
  responsibleUserId: integer("responsible_user_id").references(() => users.id, { onDelete: "set null" }),
  dueDate: varchar("due_date", { length: 10 }),
  status: varchar("status", { length: 20 }).notNull().default("open"), // open, in_progress, closed
  closedAt: timestamp("closed_at"),
  closedBy: varchar("closed_by").references(() => users.id, { onDelete: "set null" }),
  // Metadata
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  check("qc_root_causes_entity_type_chk", sql`${t.entityType} IN ('final_inspection','brak','reclamation','material_test')`),
  check("qc_root_causes_category_chk", sql`${t.category} IS NULL OR ${t.category} IN ('equipment','operator','material','process','environment')`),
  check("qc_root_causes_status_chk", sql`${t.status} IN ('open','in_progress','closed')`),
]);

export const insertQcRootCauseSchema = createInsertSchema(qcRootCauses, {
  entityType: z.enum(["final_inspection", "brak", "reclamation", "material_test"]),
  entityId: z.string().min(1),
  category: z.enum(["equipment", "operator", "material", "process", "environment"]).optional(),
  status: z.enum(["open", "in_progress", "closed"]).default("open"),
}).omit({ id: true, createdAt: true, updatedAt: true, closedAt: true } as never);

export type QcRootCause = typeof qcRootCauses.$inferSelect;
export type InsertQcRootCause = z.infer<typeof insertQcRootCauseSchema>;
