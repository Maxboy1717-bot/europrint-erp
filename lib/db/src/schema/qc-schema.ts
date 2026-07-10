/**
 * @module qc-schema
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { numericMoney } from "./numeric-money";
import { sql } from "drizzle-orm";
import { serial, pgTable, text, varchar, integer, boolean, timestamp, jsonb, unique, uuid, check, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./core-schema";
import { Test } from "./lms-schema";
import { materialCards } from "./mm-schema";
import { papkaOrders } from "./pp-schema";


// ============================================
// QUALITY CONTROL (QC) MODULE - SIFAT NAZORATI
// ============================================

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
  // NOTE: FK to qcStandards removed (orphan pgTable deleted 2026-07-02) — plain column retained.
  standardId: integer("standard_id"), // Bog'langan standart
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
  // T11-06: rework holatida qaysi papka_orders qayta ishlanmoqda (parent link) + qayta ishlash narxi.
  // Faqat result='rework'/'rework_required' uchun to'ldiriladi (boshqa holatlarda NULL).
  parentOrderId: varchar("parent_order_id").references(() => papkaOrders.id, { onDelete: "set null" }),
  reworkCost: numericMoney("rework_cost"),  // Qayta ishlash narxi (so'm)
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
  // ── ADD-ONLY: live DB superset columns ──
  customerId: integer("customer_id"),
  customerName: text("customer_name"),
  orderId: varchar("order_id"),
  productionOrderId: varchar("production_order_id"),
  productName: text("product_name"),
  type: varchar("type", { length: 50 }),
  severity: varchar("severity", { length: 20 }),
  assignedTo: integer("assigned_to"),
  reportedAt: timestamp("reported_at"),
  reportedDate: varchar("reported_date", { length: 10 }),
  slaDueAt: timestamp("sla_due_at"),
  costImpact: numericMoney("cost_impact"),
  isResolved: boolean("is_resolved"),
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


// ========== Vision 09-qc #48: QC brak statistika Director paneli snapshot (durable outbox fallback) ==========
// Real-time oqim = KANONIK outbox (domain_events + OutboxRepository/OutboxPublisher).
// Bu jadval = faqat Director paneli QC momentan uzilganda ko'rsatadigan oxirgi SNAPSHOT
// (oee_snapshots / financial_ratios_snapshot naqshiga mos). Yangi qc_outbox YARATILMAYDI —
// u domain_events ni takrorlagan bo'lardi. Migration: qc-brak-snapshot-2026-07-11.sql.
export const qcBrakSnapshot = pgTable("qc_brak_snapshot", {
  id: serial("id").primaryKey(),
  scope: varchar("scope", { length: 64 }).notNull().default("global"),
  totalBraks: integer("total_braks").notNull().default(0),
  totalBrakQty: numericMoney("total_brak_qty").notNull().default(0),
  openDefects: integer("open_defects").notNull().default(0),
  scrap7daysQty: numericMoney("scrap_7days_qty").notNull().default(0),
  topReason: text("top_reason"),
  byStage: jsonb("by_stage").notNull().default(sql`'[]'::jsonb`),
  byReason: jsonb("by_reason").notNull().default(sql`'[]'::jsonb`),
  computedAt: timestamp("computed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique("uq_qc_brak_snapshot_scope").on(t.scope),
]);

export type QcBrakSnapshotRow = typeof qcBrakSnapshot.$inferSelect;


// ========== Vision 09-qc#11: per-roll tablet scan log (FIFO aybdor-lot) ==========
// Each roll a floor operator scans on the tablet writes ONE append-only row
// (order/lot/stanok=work_center/smena=shift/ts). Idempotency + indexes live in the
// migration apps/api/src/shared/db/migrations/qc-material-scan-log-2026-07-11.sql.
// Columns match that migration EXACTLY (all business columns nullable).
export const qcMaterialScanLog = pgTable("qc_material_scan_log", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id"),
  sessionId: integer("session_id"),
  lot: varchar("lot", { length: 100 }),
  materialId: integer("material_id"),
  workCenterId: integer("work_center_id"),
  shiftId: integer("shift_id"),
  scannedBy: integer("scanned_by"),
  scannedAt: timestamp("scanned_at").notNull().defaultNow(),
  tabletId: text("tablet_id"),
  localSeqNo: bigint("local_seq_no", { mode: "number" }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type QcMaterialScanLog = typeof qcMaterialScanLog.$inferSelect;
