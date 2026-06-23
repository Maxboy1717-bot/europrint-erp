/**
 * @module pp-production
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { numericMoney } from "../numeric-money";
import { sql } from "drizzle-orm";
import { serial, pgTable, text, varchar, integer, boolean, timestamp, jsonb, index, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { departments, users } from "../core-schema";
import { crmCompanies } from "../crm-schema";
// rawMaterials import removed: production_order_components.rawMaterialId FK
// now references material_cards via DB migration (avoiding circular import cycle)
import { salesOrders } from "../sd-schema";
import { warehouses } from "../wms-schema";

// Production Facts (SM72) - Consolidated version to fix duplication
export const productionFactsSM72 = pgTable("production_facts_sm72", {
  id: serial("id").primaryKey(),
  papkaNo: varchar("papka_no", { length: 50 }).notNull(),
  factDate: varchar("fact_date", { length: 10 }).notNull(),
  // FK fix: added references to users.id with SET NULL on delete
  operatorId: integer("operator_id").references(() => users.id, { onDelete: "set null" }),
  workCenterId: varchar("work_center_id").references(() => workCenters.id, { onDelete: 'set null' }),
  plannedQty: integer("planned_qty").notNull(),
  actualQty: integer("actual_qty").notNull(),
  variance: integer("variance").notNull(),
  defects: integer("defects").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_production_facts_sm72_operator_id").on(t.operatorId),
  index("idx_production_facts_sm72_work_center_id").on(t.workCenterId),
  index("idx_production_facts_sm72_fact_date").on(t.factDate),
  index("idx_production_facts_sm72_created_at").on(t.createdAt),
]);

export const insertProductionFactSM72Schema = createInsertSchema(productionFactsSM72).omit({
  id: true,
  createdAt: true
} as never);

export type ProductionFactSM72 = typeof productionFactsSM72.$inferSelect;
export type InsertProductionFactSM72 = z.infer<typeof insertProductionFactSM72Schema>;

// Work Centers (liniyalar, mashinalar, sexlar)
export const workCenters = pgTable("work_centers", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  type: varchar("type", { length: 20 }).notNull(),
  capacity: integer("capacity"),
  departmentId: integer("department_id").references(() => departments.id, { onDelete: "set null" }),
  isActive: boolean("is_active").notNull().default(true),
  /**
   * §8 LMS→MES HARD BLOCK: Ushbu ish markazida ishlash uchun
   * talab qilinadigan LMS kurs ID si. NULL = sertifikat talab yo'q.
   * Agar belgilansa: operator bu kursni tugatgan bo'lishi SHART,
   * aks holda assignOperator() BLOCKED.
   */
  certificationLmsCourseId: integer("certification_lms_course_id"),
  /**
   * Talab qilinadigan ko'nikma nomi (LMS skillMatrix tekshiruvi uchun)
   * Masalan: "Offset bosma", "Digital bosma", "Sifat nazorati"
   */
  requiredSkillName: varchar("required_skill_name", { length: 100 }),
  // Wave 1 (500K build): PP sex taxonomy — kanonik sex kodi + FLEKSO/OFSET bo'lim.
  // NULLABLE: qiymatlar egasi-DATA (22-sex ro'yxati), struktura hozir (Q-40).
  sexCode: varchar("sex_code", { length: 50 }),
  departmentKind: varchar("department_kind", { length: 10 }),
  // ── ADD-ONLY: live DB superset columns ──
  nameUz: text("name_uz"),
  hoursPerDay: numericMoney("hours_per_day"),
  department: varchar("department", { length: 100 }),
  orgDepartmentId: integer("org_department_id"),
  costPerHour: numericMoney("cost_per_hour"),
  capacityPerHour: numericMoney("capacity_per_hour"),
  // Per-work-center efficiency/OEE factor (0–1) used by CRP available-hours calc; defaults to 0.85.
  efficiencyRate: numericMoney("efficiency_rate"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("idx_work_centers_department_id").on(t.departmentId),
  index("idx_work_centers_is_active").on(t.isActive),
  index("idx_work_centers_created_at").on(t.createdAt),
  check("work_centers_type_chk", sql`${t.type} IN ('line','machine','workshop')`),
]);

export const insertWorkCenterSchema = createInsertSchema(workCenters, {
  code: z.string().min(1, "Kod talab qilinadi"),
  name: z.string().min(2, "Nom kamida 2 ta belgidan iborat bo'lishi kerak"),
  type: z.enum(["line", "machine", "workshop"]),
}).omit({ id: true, createdAt: true } as never);

export type WorkCenter = typeof workCenters.$inferSelect;
export type InsertWorkCenter = z.infer<typeof insertWorkCenterSchema>;

// Products (mahsulotlar)
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  category: varchar("category", { length: 50 }),
  unit: varchar("unit", { length: 20 }).notNull().default("dona"),
  standardCost: numericMoney("standard_cost"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("idx_products_category").on(t.category),
  index("idx_products_is_active").on(t.isActive),
  index("idx_products_created_at").on(t.createdAt),
]);

export const insertProductSchema = createInsertSchema(products, {
  code: z.string().min(1, "Kod talab qilinadi"),
  name: z.string().min(2, "Nom kamida 2 ta belgidan iborat bo'lishi kerak"),
  unit: z.string(),
}).omit({ id: true, createdAt: true } as never);

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

// Orders (buyurtmalar)
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
  productId: varchar("product_id").references(() => products.id, { onDelete: 'set null' }),
  quantity: integer("quantity").notNull(),
  customerName: text("customer_name"),
  customerId: integer("customer_id").references(() => crmCompanies.id, { onDelete: 'set null' }),
  dueDate: varchar("due_date", { length: 10 }),
  priority: varchar("priority", { length: 20 }).notNull().default("normal"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("idx_orders_product_id").on(t.productId),
  index("idx_orders_customer_id").on(t.customerId),
  index("idx_orders_status").on(t.status),
  index("idx_orders_priority").on(t.priority),
  index("idx_orders_created_at").on(t.createdAt),
  index("idx_orders_updated_at").on(t.updatedAt),
  check("orders_priority_chk", sql`${t.priority} IN ('low','normal','high','urgent')`),
  check("orders_status_chk", sql`${t.status} IN ('pending','in_production','completed','cancelled')`),
]);

export const insertOrderSchema = createInsertSchema(orders, {
  orderNumber: z.string().min(1, "Buyurtma raqami talab qilinadi"),
  quantity: z.number().int().positive("Miqdor musbat son bo'lishi kerak"),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  status: z.enum(["pending", "in_production", "completed", "cancelled"]),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

// Production Plan Header (reja bosh)
export const productionPlanHeader = pgTable("production_plan_header", {
  id: serial("id").primaryKey(),
  planNumber: varchar("plan_number", { length: 50 }).notNull().unique(),
  planDate: varchar("plan_date", { length: 10 }).notNull(),
  planType: varchar("plan_type", { length: 20 }).notNull().default("daily"),
  workCenterId: integer("work_center_id"),
  shift: varchar("shift", { length: 20 }),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  approvedBy: integer("approved_by"),
  approvedAt: timestamp("approved_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("idx_production_plan_header_work_center_id").on(t.workCenterId),
  index("idx_production_plan_header_status").on(t.status),
  index("idx_production_plan_header_plan_date").on(t.planDate),
  index("idx_production_plan_header_created_at").on(t.createdAt),
  check("prod_plan_header_plan_type_chk", sql`${t.planType} IN ('daily','weekly','monthly')`),
  check("prod_plan_header_status_chk", sql`${t.status} IN ('draft','approved','in_progress','completed')`),
]);

export const insertProductionPlanHeaderSchema = createInsertSchema(productionPlanHeader, {
  planNumber: z.string().min(1, "Reja raqami talab qilinadi"),
  planDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  planType: z.enum(["daily", "weekly", "monthly"]),
  status: z.enum(["draft", "approved", "in_progress", "completed"]),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type ProductionPlanHeader = typeof productionPlanHeader.$inferSelect;
export type InsertProductionPlanHeader = z.infer<typeof insertProductionPlanHeaderSchema>;

// Production Plan Lines (buyurtmalar qatorlari)
export const productionPlanLines = pgTable("production_plan_lines", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id"),
  orderId: varchar("order_id"),
  productId: integer("product_id"),
  plannedQuantity: integer("planned_quantity").notNull(),
  plannedStartTime: varchar("planned_start_time", { length: 5 }),
  plannedEndTime: varchar("planned_end_time", { length: 5 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_production_plan_lines_plan_id").on(t.planId),
  index("idx_production_plan_lines_order_id").on(t.orderId),
  index("idx_production_plan_lines_product_id").on(t.productId),
  index("idx_production_plan_lines_created_at").on(t.createdAt),
]);

export const insertProductionPlanLineSchema = createInsertSchema(productionPlanLines, {
  plannedQuantity: z.number().int().positive("Reja miqdori musbat bo'lishi kerak"),
}).omit({ id: true, createdAt: true } as never);

export type ProductionPlanLine = typeof productionPlanLines.$inferSelect;
export type InsertProductionPlanLine = z.infer<typeof insertProductionPlanLineSchema>;

// Production Fact (fakt natijalar)
export const productionFact = pgTable("production_fact", {
  id: serial("id").primaryKey(),
  planLineId: integer("plan_line_id"),
  productId: integer("product_id"),
  workCenterId: integer("work_center_id"),
  factDate: varchar("fact_date", { length: 10 }).notNull(),
  shift: varchar("shift", { length: 20 }),
  factQuantity: integer("fact_quantity").notNull(),
  goodQuantity: integer("good_quantity").notNull(),
  scrapQuantity: integer("scrap_quantity").notNull().default(0),
  reworkQuantity: integer("rework_quantity").notNull().default(0),
  startTime: varchar("start_time", { length: 5 }),
  endTime: varchar("end_time", { length: 5 }),
  operatorId: integer("operator_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_production_fact_plan_line_id").on(t.planLineId),
  index("idx_production_fact_product_id").on(t.productId),
  index("idx_production_fact_work_center_id").on(t.workCenterId),
  index("idx_production_fact_operator_id").on(t.operatorId),
  index("idx_production_fact_fact_date").on(t.factDate),
  index("idx_production_fact_created_at").on(t.createdAt),
]);

export const insertProductionFactSchema = createInsertSchema(productionFact, {
  factDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  factQuantity: z.number().int().nonnegative("Fakt miqdori 0 yoki katta bo'lishi kerak"),
  goodQuantity: z.number().int().nonnegative("Yaxshi mahsulotlar 0 yoki katta bo'lishi kerak"),
  scrapQuantity: z.number().int().nonnegative("Brak 0 yoki katta bo'lishi kerak"),
  reworkQuantity: z.number().int().nonnegative("Qayta ishlash 0 yoki katta bo'lishi kerak"),
}).omit({ id: true, createdAt: true } as never);

export type ProductionFact = typeof productionFact.$inferSelect;
export type InsertProductionFact = z.infer<typeof insertProductionFactSchema>;

// Downtime Logs (to'xtashlar)
export const downtimeLogs = pgTable("downtime_logs", {
  id: serial("id").primaryKey(),
  workCenterId: varchar("work_center_id").references(() => workCenters.id, { onDelete: "set null" }),
  downtimeDate: varchar("downtime_date", { length: 10 }).notNull(),
  shift: varchar("shift", { length: 20 }),
  startTime: varchar("start_time", { length: 5 }).notNull(),
  endTime: varchar("end_time", { length: 5 }),
  durationMinutes: integer("duration_minutes"),
  reason: text("reason").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  reportedBy: integer("reported_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_downtime_logs_work_center_id").on(t.workCenterId),
  index("idx_downtime_logs_downtime_date").on(t.downtimeDate),
  index("idx_downtime_logs_category").on(t.category),
  index("idx_downtime_logs_created_at").on(t.createdAt),
  check("downtime_logs_category_chk", sql`${t.category} IN ('breakdown','maintenance','changeover','material_shortage','other')`),
]);

export const insertDowntimeLogSchema = createInsertSchema(downtimeLogs, {
  downtimeDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  reason: z.string().min(3, "To'xtash sababi kamida 3 ta belgidan iborat bo'lishi kerak"),
  category: z.enum(["breakdown", "maintenance", "changeover", "material_shortage", "other"]),
}).omit({ id: true, createdAt: true } as never);

export type DowntimeLog = typeof downtimeLogs.$inferSelect;
export type InsertDowntimeLog = z.infer<typeof insertDowntimeLogSchema>;

// BOM Headers (BOM bosh)
export const bomHeaders = pgTable("bom_headers", {
  id: serial("id").primaryKey(),
  bomNumber: varchar("bom_number", { length: 50 }).notNull().unique(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  version: varchar("version", { length: 20 }).notNull().default("1.0"),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  baseQuantity: numericMoney("base_quantity").notNull().default(1),
  baseUnit: varchar("base_unit", { length: 20 }).notNull().default("dona"),
  validFrom: varchar("valid_from", { length: 10 }),
  validTo: varchar("valid_to", { length: 10 }),
  description: text("description"),
  // ── ADD-ONLY: live DB superset columns ──
  isActive: boolean("is_active").notNull().default(true),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
  deletedBy: varchar("deleted_by"),
}, (t) => [
  index("idx_bom_headers_product_id").on(t.productId),
  index("idx_bom_headers_status").on(t.status),
  index("idx_bom_headers_created_at").on(t.createdAt),
  check("bom_headers_status_chk", sql`${t.status} IN ('draft','active','inactive','archived')`),
]);

export const insertBomHeaderSchema = createInsertSchema(bomHeaders, {
  bomNumber: z.string().min(1, "BOM raqami talab qilinadi"),
  productId: z.string().min(1, "Mahsulot tanlash kerak"),
  version: z.string().min(1, "Versiya talab qilinadi"),
  status: z.enum(["draft", "active", "inactive", "archived"]),
  baseQuantity: z.number().positive("Asosiy miqdor musbat bo'lishi kerak"),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type BomHeader = typeof bomHeaders.$inferSelect;
export type InsertBomHeader = z.infer<typeof insertBomHeaderSchema>;

// BOM Items (BOM komponentlari)
export const bomItems = pgTable("bom_items", {
  id: serial("id").primaryKey(),
  bomId: varchar("bom_id").notNull().references(() => bomHeaders.id, { onDelete: "cascade" }),
  itemNumber: varchar("item_number", { length: 10 }).notNull(),
  componentType: varchar("component_type", { length: 20 }).notNull().default("material"),
  // FK type fix: should reference material_cards.id (integer), not products.id.
  // Cannot use .references() here without creating a circular import
  // (pp-production → mm-material-cards → pp-schema → pp-production).
  // DB-level FK is applied via migrations-drift.ts entry below.
  componentId: integer("component_id").notNull(),
  quantity: numericMoney("quantity").notNull(),
  unit: varchar("unit", { length: 20 }).notNull().default("dona"),
  scrapPercentage: numericMoney("scrap_percentage").notNull().default(0),
  position: integer("position").notNull().default(0),
  notes: text("notes"),
  // ── ADD-ONLY: live DB superset columns ──
  materialId: integer("material_id"),
  scrapPercent: numericMoney("scrap_percent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
  deletedAt: timestamp("deleted_at"),
  deletedBy: varchar("deleted_by"),
}, (t) => [
  index("idx_bom_items_bom_id").on(t.bomId),
  index("idx_bom_items_component_id").on(t.componentId),
  index("idx_bom_items_created_at").on(t.createdAt),
  check("bom_items_component_type_chk", sql`${t.componentType} IN ('material','sub_assembly')`),
]);

export const insertBomItemSchema = createInsertSchema(bomItems, {
  bomId: z.string().min(1, "BOM ID talab qilinadi"),
  itemNumber: z.string().min(1, "Item raqami talab qilinadi"),
  componentType: z.enum(["material", "sub_assembly"]),
  componentId: z.string().min(1, "Komponent tanlash kerak"),
  quantity: z.number().positive("Miqdor musbat bo'lishi kerak"),
  scrapPercentage: z.number().min(0).max(100, "Brak foizi 0-100 oralig'ida bo'lishi kerak"),
}).omit({ id: true, createdAt: true } as never);

export type BomItem = typeof bomItems.$inferSelect;
export type InsertBomItem = z.infer<typeof insertBomItemSchema>;

// Routings (Texnologik jarayon bosh)
export const routings = pgTable("routings", {
  id: serial("id").primaryKey(),
  routingNumber: varchar("routing_number", { length: 50 }).notNull().unique(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  version: integer("version").notNull().default(1),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  validFrom: varchar("valid_from", { length: 10 }),
  validTo: varchar("valid_to", { length: 10 }),
  description: text("description"),
  // ── ADD-ONLY: live DB superset columns ──
  name: text("name"),
  isActive: boolean("is_active").notNull().default(true),
  steps: jsonb("steps"),
  workCenters: jsonb("work_centers"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
  deletedBy: varchar("deleted_by"),
}, (t) => [
  index("idx_routings_product_id").on(t.productId),
  index("idx_routings_status").on(t.status),
  index("idx_routings_created_at").on(t.createdAt),
  check("routings_status_chk", sql`${t.status} IN ('draft','active','inactive')`),
]);

export const insertRoutingSchema = createInsertSchema(routings, {
  routingNumber: z.string().min(1, "Routing raqami talab qilinadi"),
  productId: z.number().int().positive("Mahsulot tanlash kerak"),
  version: z.number().int().positive("Versiya talab qilinadi"),
  status: z.enum(["draft", "active", "inactive"]),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type Routing = typeof routings.$inferSelect;
export type InsertRouting = z.infer<typeof insertRoutingSchema>;

// Routing Operations (Operatsiyalar)
export const routingOperations = pgTable("routing_operations", {
  id: serial("id").primaryKey(),
  routingId: integer("routing_id").notNull().references(() => routings.id, { onDelete: "cascade" }),
  operationNumber: integer("operation_number").notNull(),
  operationDescription: text("operation_description"),
  workCenterId: integer("work_center_id").notNull().references(() => workCenters.id, { onDelete: "restrict" }),
  setupTime: numericMoney("setup_time").notNull().default(0),
  machineTime: numericMoney("machine_time").notNull().default(0),
  laborTime: numericMoney("labor_time").notNull().default(0),
  baseQuantity: numericMoney("base_quantity").notNull().default(1),
  sequence: integer("sequence").notNull(),
  isParallel: boolean("is_parallel").notNull().default(false),
  notes: text("notes"),
  // ── ADD-ONLY: live DB superset columns ──
  name: text("name"),
  productId: integer("product_id"),
  setupTimeMin: numericMoney("setup_time_min"),
  runTimePerUnitMin: numericMoney("run_time_per_unit_min"),
  runTimeMin: numericMoney("run_time_min"),
  isActive: boolean("is_active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
  // Wave 2: non-linear routing graph (live DB cols) — predecessor/successor/return-edge.
  predecessorOperationId: integer("predecessor_operation_id"),
  successorOperationIds: jsonb("successor_operation_ids"),
  returnToOperationId: integer("return_to_operation_id"),
  routingCondition: varchar("routing_condition", { length: 50 }),
}, (t) => [
  index("idx_routing_operations_routing_id").on(t.routingId),
  index("idx_routing_operations_work_center_id").on(t.workCenterId),
  index("idx_routing_operations_created_at").on(t.createdAt),
]);

export const insertRoutingOperationSchema = createInsertSchema(routingOperations, {
  routingId: z.number().int().positive("Routing ID talab qilinadi"),
  operationNumber: z.number().int().positive("Operatsiya raqami talab qilinadi"),
  operationDescription: z.string().optional(),
  workCenterId: z.number().int().positive("Work center tanlash kerak"),
  setupTime: z.number().nonnegative("Setup vaqti 0 yoki katta bo'lishi kerak"),
  machineTime: z.number().nonnegative("Mashina vaqti 0 yoki katta bo'lishi kerak"),
  laborTime: z.number().nonnegative("Ish vaqti 0 yoki katta bo'lishi kerak"),
  baseQuantity: z.number().positive("Asosiy miqdor musbat bo'lishi kerak"),
  sequence: z.number().int().positive("Ketma-ketlik musbat butun son bo'lishi kerak"),
}).omit({ id: true, createdAt: true } as never);

export type RoutingOperation = typeof routingOperations.$inferSelect;
export type InsertRoutingOperation = z.infer<typeof insertRoutingOperationSchema>;

// Production Orders (Ishlab chiqarish buyurtmalari)
export const productionOrders = pgTable("production_orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  bomId: varchar("bom_id").references(() => bomHeaders.id, { onDelete: "set null" }),
  routingId: varchar("routing_id").references(() => routings.id, { onDelete: "set null" }),
  // Golden-thread SD->PP link (A1). NULLABLE BY DESIGN — internal/sample production
  // runs legitimately have no originating sales order. The two canonical create paths
  // (POST /pp/orders CQRS requires soId; SD->PP ready-for-planning listener) always set
  // it; manual/generic writers carry it through when supplied (never silently dropped).
  salesOrderId: varchar("sales_order_id").references(() => salesOrders.id, { onDelete: "set null" }),
  plannedQuantity: numericMoney("planned_quantity").notNull(),
  confirmedQuantity: numericMoney("confirmed_quantity").notNull().default(0),
  scrapQuantity: numericMoney("scrap_quantity").notNull().default(0),
  orderType: varchar("order_type", { length: 20 }).notNull().default("standard"),
  status: varchar("status", { length: 20 }).notNull().default("created"),
  plannedStartDate: varchar("planned_start_date", { length: 10 }),
  plannedEndDate: varchar("planned_end_date", { length: 10 }),
  actualStartDate: varchar("actual_start_date", { length: 10 }),
  actualEndDate: varchar("actual_end_date", { length: 10 }),
  priority: integer("priority").notNull().default(3),
  // EP-PP-097 ZARUR (urgent) flag — floats the order above every non-urgent one
  // in the production queue. Orthogonal to the numeric priority band.
  isUrgent: boolean("is_urgent").notNull().default(false),
  // EP-PP-025 / EP-PP-061 frozen-zone (no-preempt): once committed to the
  // near-term window the order cannot be displaced by a new higher-priority order.
  // Cleared only by owner/director authority.
  isFrozen: boolean("is_frozen").notNull().default(false),
  frozenUntil: timestamp("frozen_until"),
  workCenterId: varchar("work_center_id").references(() => workCenters.id, { onDelete: "set null" }),
  productionType: varchar("production_type", { length: 30 }).default("other"),
  defectiveQty: numericMoney("defective_qty").notNull().default(0),
  plannedCost: numericMoney("planned_cost"),
  actualCost: numericMoney("actual_cost"),
  responsibleManagerId: varchar("responsible_manager_id", { length: 50 }),
  shiftSupervisorId: varchar("shift_supervisor_id", { length: 50 }),
  qcInspectorId: varchar("qc_inspector_id", { length: 50 }),
  notes: text("notes"),
  // ── ADD-ONLY: live DB superset columns ──
  scheduledStart: timestamp("scheduled_start"),
  scheduledEnd: timestamp("scheduled_end"),
  actualStart: timestamp("actual_start"),
  actualEnd: timestamp("actual_end"),
  productName: text("product_name"),
  quantity: numericMoney("quantity"),
  unit: varchar("unit", { length: 20 }),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("idx_production_orders_product_id").on(t.productId),
  index("idx_production_orders_work_center_id").on(t.workCenterId),
  index("idx_production_orders_status").on(t.status),
  index("idx_production_orders_priority").on(t.priority),
  index("idx_production_orders_urgent").on(t.isUrgent),
  index("idx_production_orders_frozen").on(t.isFrozen),
  index("idx_production_orders_created_at").on(t.createdAt),
  index("idx_production_orders_updated_at").on(t.updatedAt),
  check("production_orders_order_type_chk", sql`${t.orderType} IN ('standard','rework','sample')`),
  // EP-PP-082 (7-status owner override) + legacy strings kept as a SUPERSET so
  // nothing that already persisted ('created'/'pending'/'released'/'qc_hold') breaks (Q-46).
  check("production_orders_status_chk", sql`${t.status} IN ('created','pending','planned','confirmed','released','released_to_production','in_progress','in_qc','qc_hold','completed','closed','cancelled','paused')`),
]);

export const insertProductionOrderSchema = createInsertSchema(productionOrders, {
  orderNumber: z.string().min(1, "Buyurtma raqami talab qilinadi"),
  productId: z.string().min(1, "Mahsulot tanlash kerak"),
  plannedQuantity: z.number().positive("Rejalashtirilgan miqdor musbat bo'lishi kerak"),
  confirmedQuantity: z.number().nonnegative("Tasdiqlangan miqdor 0 yoki katta bo'lishi kerak"),
  scrapQuantity: z.number().nonnegative("Chiqindi miqdori 0 yoki katta bo'lishi kerak"),
  orderType: z.enum(["standard", "rework", "sample"]),
  status: z.enum(["created", "released", "in_progress", "completed", "closed", "qc_hold"]),
  priority: z.number().int().min(1).max(5, "Ustuvorlik 1-5 oralig'ida bo'lishi kerak"),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type ProductionOrder = typeof productionOrders.$inferSelect;
export type InsertProductionOrder = z.infer<typeof insertProductionOrderSchema>;

// Production Order Operations
export const productionOrderOperations = pgTable("production_order_operations", {
  id: serial("id").primaryKey(),
  productionOrderId: varchar("production_order_id").notNull().references(() => productionOrders.id, { onDelete: "cascade" }),
  routingOperationId: varchar("routing_operation_id").references(() => routingOperations.id, { onDelete: "set null" }),
  operationNumber: varchar("operation_number", { length: 10 }).notNull(),
  workCenterId: varchar("work_center_id").references(() => workCenters.id, { onDelete: "set null" }),
  plannedDuration: numericMoney("planned_duration").notNull().default(0),
  actualDuration: numericMoney("actual_duration").notNull().default(0),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  operatorId: integer("operator_id"),
  // Wave 2: rework history (non-linear routing returns — tisneniya->karton tigel qaytishi).
  returnedFromOperationId: integer("returned_from_operation_id"),
  reworkReason: text("rework_reason"),
  reworkCount: integer("rework_count").notNull().default(0),
}, (t) => [
  index("idx_production_order_operations_production_order_id").on(t.productionOrderId),
  index("idx_production_order_operations_work_center_id").on(t.workCenterId),
  index("idx_production_order_operations_status").on(t.status),
  check("prod_order_ops_status_chk", sql`${t.status} IN ('pending','in_progress','completed')`),
]);

// Wave 2 (500K): sex kirish/chiqish routing qoidalari (nochiziqli graf — tigel->faqat packing;
// tisneniya->karton tigel/rezka/skleyka return). Qiymatlar egasi 22-sex routing royxatidan (Q-40).
export const workCenterIoRules = pgTable("work_center_io_rules", {
  id: serial("id").primaryKey(),
  workCenterId: integer("work_center_id").notNull().references(() => workCenters.id, { onDelete: "cascade" }),
  allowedPredecessors: jsonb("allowed_predecessors").notNull().default(sql`'[]'::jsonb`),
  allowedSuccessors: jsonb("allowed_successors").notNull().default(sql`'[]'::jsonb`),
  reworkAllowedTo: jsonb("rework_allowed_to").notNull().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("idx_work_center_io_rules_wc").on(t.workCenterId),
]);

export const insertProductionOrderOperationSchema = createInsertSchema(productionOrderOperations, {
  productionOrderId: z.string().min(1, "Ishlab chiqarish buyurtmasi kerak"),
  operationNumber: z.string().min(1, "Operatsiya raqami talab qilinadi"),
  plannedDuration: z.number().nonnegative("Rejalashtirilgan vaqt 0 yoki katta bo'lishi kerak"),
  actualDuration: z.number().nonnegative("Haqiqiy vaqt 0 yoki katta bo'lishi kerak"),
  status: z.enum(["pending", "in_progress", "completed"]),
}).omit({ id: true } as never);

export type ProductionOrderOperation = typeof productionOrderOperations.$inferSelect;
export type InsertProductionOrderOperation = z.infer<typeof insertProductionOrderOperationSchema>;

// Production Order Components
export const productionOrderComponents = pgTable("production_order_components", {
  id: serial("id").primaryKey(),
  productionOrderId: varchar("production_order_id").notNull().references(() => productionOrders.id, { onDelete: "cascade" }),
  // FK type fix: was varchar referencing raw_materials; changed to integer to reference
  // material_cards.id (serial/integer). DB-level FK applied via migrations-drift.ts.
  rawMaterialId: integer("raw_material_id").notNull(),
  requiredQuantity: numericMoney("required_quantity").notNull(),
  issuedQuantity: numericMoney("issued_quantity").notNull().default(0),
  unit: varchar("unit", { length: 20 }).notNull(),
  warehouseId: varchar("warehouse_id").references(() => warehouses.id, { onDelete: "set null" }),
}, (t) => [
  index("idx_production_order_components_production_order_id").on(t.productionOrderId),
  index("idx_production_order_components_raw_material_id").on(t.rawMaterialId),
  index("idx_production_order_components_warehouse_id").on(t.warehouseId),
]);

export const insertProductionOrderComponentSchema = createInsertSchema(productionOrderComponents, {
  productionOrderId: z.string().min(1, "Ishlab chiqarish buyurtmasi kerak"),
  rawMaterialId: z.string().min(1, "Xom ashyo kerak"),
  requiredQuantity: z.number().positive("Talab qilingan miqdor musbat bo'lishi kerak"),
  issuedQuantity: z.number().nonnegative("Chiqarilgan miqdor 0 yoki katta bo'lishi kerak"),
  unit: z.string().min(1, "O'lchov birligi kerak"),
}).omit({ id: true } as never);

export type ProductionOrderComponent = typeof productionOrderComponents.$inferSelect;
export type InsertProductionOrderComponent = z.infer<typeof insertProductionOrderComponentSchema>;

// Work Center Capacity
export const workCenterCapacity = pgTable("work_center_capacity", {
  id: serial("id").primaryKey(),
  workCenterId: integer("work_center_id").notNull().references(() => workCenters.id, { onDelete: "cascade" }),
  validFrom: varchar("valid_from", { length: 10 }).notNull(),
  validTo: varchar("valid_to", { length: 10 }),
  numberOfMachines: integer("number_of_machines").notNull().default(1),
  utilizationPercentage: numericMoney("utilization_percentage").notNull().default(85),
  shiftsPerDay: integer("shifts_per_day").notNull().default(1),
  hoursPerShift: numericMoney("hours_per_shift").notNull().default(8),
  workingDaysPerWeek: integer("working_days_per_week").notNull().default(5),
  totalCapacityHours: numericMoney("total_capacity_hours"),
  availableCapacityHours: numericMoney("available_capacity_hours"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("idx_work_center_capacity_work_center_id").on(t.workCenterId),
  index("idx_work_center_capacity_created_at").on(t.createdAt),
]);

export const insertWorkCenterCapacitySchema = createInsertSchema(workCenterCapacity, {
  workCenterId: z.number().int().positive("Work center tanlash kerak"),
  validFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  numberOfMachines: z.number().int().positive("Mashinalar soni musbat bo'lishi kerak"),
  utilizationPercentage: z.number().min(0).max(100, "Foydalanish foizi 0-100 oralig'ida bo'lishi kerak"),
  shiftsPerDay: z.number().int().positive("Smena soni musbat bo'lishi kerak"),
  hoursPerShift: z.number().positive("Smena vaqti musbat bo'lishi kerak"),
  workingDaysPerWeek: z.number().int().min(1).max(7, "Ish kunlari 1-7 oralig'ida bo'lishi kerak"),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type WorkCenterCapacity = typeof workCenterCapacity.$inferSelect;
export type InsertWorkCenterCapacity = z.infer<typeof insertWorkCenterCapacitySchema>;

// Shift Calendars
export const shiftCalendars = pgTable("shift_calendars", {
  id: serial("id").primaryKey(),
  calendarName: varchar("calendar_name", { length: 100 }).notNull(),
  workCenterId: integer("work_center_id").references(() => workCenters.id, { onDelete: "set null" }),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  day: integer("day").notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
  isWorkingDay: boolean("is_working_day").notNull().default(true),
  shiftNumber: integer("shift_number").notNull().default(1),
  startTime: varchar("start_time", { length: 5 }).notNull(),
  endTime: varchar("end_time", { length: 5 }).notNull(),
  breakMinutes: integer("break_minutes").notNull().default(60),
  netWorkingHours: numericMoney("net_working_hours").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_shift_calendars_work_center_id").on(t.workCenterId),
  index("idx_shift_calendars_year_month_day").on(t.year, t.month, t.day),
  index("idx_shift_calendars_created_at").on(t.createdAt),
]);

export const insertShiftCalendarSchema = createInsertSchema(shiftCalendars, {
  calendarName: z.string().min(1, "Kalendar nomi talab qilinadi"),
  year: z.number().int().min(2020).max(2100, "Yil 2020-2100 oralig'ida bo'lishi kerak"),
  month: z.number().int().min(1).max(12, "Oy 1-12 oralig'ida bo'lishi kerak"),
  day: z.number().int().min(1).max(31, "Kun 1-31 oralig'ida bo'lishi kerak"),
  dayOfWeek: z.number().int().min(0).max(6, "Hafta kuni 0-6 oralig'ida bo'lishi kerak"),
  shiftNumber: z.number().int().min(1).max(3, "Smena raqami 1-3 oralig'ida bo'lishi kerak"),
  breakMinutes: z.number().int().nonnegative("Tanaffus 0 yoki katta bo'lishi kerak"),
  netWorkingHours: z.number().positive("Sof ish vaqti musbat bo'lishi kerak"),
}).omit({ id: true, createdAt: true } as never);

export type ShiftCalendar = typeof shiftCalendars.$inferSelect;
export type InsertShiftCalendar = z.infer<typeof insertShiftCalendarSchema>;

// Shift Assignments — canonical definition lives in ../shifts
export { shiftAssignments, insertShiftAssignmentSchema } from "../shifts";
export type { ShiftAssignment, InsertShiftAssignment } from "../shifts";

// MRP Runs
export const mrpRuns = pgTable("mrp_runs", {
  id: serial("id").primaryKey(),
  runNumber: varchar("run_number", { length: 50 }).notNull().unique(),
  runDate: varchar("run_date", { length: 10 }).notNull(),
  planningHorizonDays: integer("planning_horizon_days").notNull().default(90),
  status: varchar("status", { length: 20 }).notNull().default("running"),
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
  totalProducts: integer("total_products").notNull().default(0),
  totalRequirements: integer("total_requirements").notNull().default(0),
  totalShortages: integer("total_shortages").notNull().default(0),
  runBy: integer("run_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_mrp_runs_status").on(t.status),
  index("idx_mrp_runs_run_date").on(t.runDate),
  index("idx_mrp_runs_created_at").on(t.createdAt),
  check("mrp_runs_status_chk", sql`${t.status} IN ('running','completed','failed')`),
]);

export const insertMrpRunSchema = createInsertSchema(mrpRuns, {
  runNumber: z.string().min(1, "MRP run raqami talab qilinadi"),
  runDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  planningHorizonDays: z.number().int().positive("Planning horizon musbat bo'lishi kerak"),
  status: z.enum(["running", "completed", "failed"]),
}).omit({ id: true, createdAt: true } as never);

export type MrpRun = typeof mrpRuns.$inferSelect;
export type InsertMrpRun = z.infer<typeof insertMrpRunSchema>;

// MRP Results
export const mrpResults = pgTable("mrp_results", {
  id: serial("id").primaryKey(),
  mrpRunId: varchar("mrp_run_id").notNull().references(() => mrpRuns.id, { onDelete: "cascade" }),
  materialId: varchar("material_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  requiredDate: varchar("required_date", { length: 10 }).notNull(),
  grossRequirement: numericMoney("gross_requirement").notNull(),
  scheduledReceipts: numericMoney("scheduled_receipts").notNull().default(0),
  onHandStock: numericMoney("on_hand_stock").notNull().default(0),
  netRequirement: numericMoney("net_requirement").notNull(),
  plannedOrder: numericMoney("planned_order").notNull().default(0),
  orderDate: varchar("order_date", { length: 10 }),
  leadTimeDays: integer("lead_time_days").notNull().default(0),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("idx_mrp_results_mrp_run_id").on(t.mrpRunId),
  index("idx_mrp_results_material_id").on(t.materialId),
  index("idx_mrp_results_status").on(t.status),
  index("idx_mrp_results_required_date").on(t.requiredDate),
  index("idx_mrp_results_created_at").on(t.createdAt),
  check("mrp_results_status_chk", sql`${t.status} IN ('pending','ordered','received')`),
]);

export const insertMrpResultSchema = createInsertSchema(mrpResults, {
  mrpRunId: z.string().min(1, "MRP run ID talab qilinadi"),
  materialId: z.string().min(1, "Material tanlash kerak"),
  requiredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  grossRequirement: z.number().nonnegative("Umumiy talab 0 yoki katta bo'lishi kerak"),
  scheduledReceipts: z.number().nonnegative("Rejalashtirilgan qabul 0 yoki katta bo'lishi kerak"),
  onHandStock: z.number().nonnegative("Qo'lda bor 0 yoki katta bo'lishi kerak"),
  netRequirement: z.number().nonnegative("Sof talab 0 yoki katta bo'lishi kerak"),
  plannedOrder: z.number().nonnegative("Rejalashtirilgan buyurtma 0 yoki katta bo'lishi kerak"),
  leadTimeDays: z.number().int().nonnegative("Lead time 0 yoki katta bo'lishi kerak"),
  status: z.enum(["pending", "ordered", "received"]),
}).omit({ id: true, createdAt: true } as never);

export type MrpResult = typeof mrpResults.$inferSelect;
export type InsertMrpResult = z.infer<typeof insertMrpResultSchema>;

// Equipment (Uskunalar) — moved here from design section for clean dependency order
export const equipment = pgTable("equipment", {
  id: serial("id").primaryKey(),
  equipmentNumber: varchar("equipment_number", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(),
  manufacturer: varchar("manufacturer", { length: 100 }),
  model: varchar("model", { length: 100 }),
  serialNumber: varchar("serial_number", { length: 100 }),
  workCenterId: varchar("work_center_id").references(() => workCenters.id, { onDelete: "set null" }),
  location: text("location"),
  installationDate: varchar("installation_date", { length: 10 }),
  warrantyEndDate: varchar("warranty_end_date", { length: 10 }),
  purchaseValue: numericMoney("purchase_value"),
  currentValue: numericMoney("current_value"),
  currency: varchar("currency", { length: 10 }).default("UZS"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  lastMaintenanceDate: varchar("last_maintenance_date", { length: 10 }),
  nextMaintenanceDate: varchar("next_maintenance_date", { length: 10 }),
  maintenanceInterval: integer("maintenance_interval"),
  operatingHours: numericMoney("operating_hours").default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("idx_equipment_work_center_id").on(t.workCenterId),
  index("idx_equipment_category").on(t.category),
  index("idx_equipment_status").on(t.status),
  index("idx_equipment_is_active").on(t.isActive),
  index("idx_equipment_created_at").on(t.createdAt),
  check("equipment_category_chk", sql`${t.category} IN ('machine','conveyor','vehicle','tool','other')`),
  check("equipment_status_chk", sql`${t.status} IN ('active','inactive','maintenance','scrapped')`),
]);

export const insertEquipmentSchema = createInsertSchema(equipment, {
  equipmentNumber: z.string().min(1, "Uskuna raqami kerak"),
  name: z.string().min(2, "Nom kerak"),
  category: z.enum(["machine", "conveyor", "vehicle", "tool", "other"]),
  status: z.enum(["active", "inactive", "maintenance", "scrapped"]),
}).omit({ id: true, createdAt: true } as never);

export type Equipment = typeof equipment.$inferSelect;
export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;

// ── T008: Smena yopilish baholash jadvali ──
export const shiftEvaluations = pgTable("shift_evaluations", {
  id: serial("id").primaryKey(),
  evalId: varchar("eval_id", { length: 30 }).notNull().unique(),
  shiftName: varchar("shift_name", { length: 50 }).notNull(),
  operatorId: integer("operator_id"),
  safetyScore: integer("safety_score"),
  qualityScore: integer("quality_score"),
  productivityScore: integer("productivity_score"),
  teamworkScore: integer("teamwork_score"),
  overallScore: integer("overall_score").notNull().default(0),
  issuesReported: text("issues_reported"),
  suggestions: text("suggestions"),
  skipped: boolean("skipped").notNull().default(false),
  skipReason: text("skip_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_shift_evaluations_operator_id").on(t.operatorId),
  index("idx_shift_evaluations_created_at").on(t.createdAt),
]);

export const insertShiftEvaluationSchema = createInsertSchema(shiftEvaluations).omit({
  id: true,
  createdAt: true,
} as never);

export type ShiftEvaluation = typeof shiftEvaluations.$inferSelect;
export type InsertShiftEvaluation = z.infer<typeof insertShiftEvaluationSchema>;

// ─── PRODUCTION QC CHECKS ─────────────────────────────────────────────────────

export const productionQcChecks = pgTable("production_qc_checks", {
  id: serial("id").primaryKey(),
  productionOrderId: varchar("production_order_id").notNull().references(() => productionOrders.id, { onDelete: "cascade" }),
  checkStage: varchar("check_stage", { length: 20 }).notNull(),
  checkedQty: integer("checked_qty").notNull().default(0),
  passedQty: integer("passed_qty").notNull().default(0),
  failedQty: integer("failed_qty").notNull().default(0),
  defectTypes: jsonb("defect_types").default([]),
  checkedBy: integer("checked_by"),
  checkedAt: timestamp("checked_at").defaultNow(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_production_qc_checks_production_order_id").on(t.productionOrderId),
  index("idx_production_qc_checks_check_stage").on(t.checkStage),
  index("idx_production_qc_checks_created_at").on(t.createdAt),
]);

export const insertProductionQcCheckSchema = createInsertSchema(productionQcChecks).omit({
  id: true,
  createdAt: true,
} as never);

export type ProductionQcCheck = typeof productionQcChecks.$inferSelect;
export type InsertProductionQcCheck = z.infer<typeof insertProductionQcCheckSchema>;

// ─── PRODUCTION STATUS HISTORY ────────────────────────────────────────────────

export const productionStatusHistory = pgTable("production_status_history", {
  id: serial("id").primaryKey(),
  productionOrderId: varchar("production_order_id").notNull().references(() => productionOrders.id, { onDelete: "cascade" }),
  oldStatus: varchar("old_status", { length: 30 }),
  newStatus: varchar("new_status", { length: 30 }).notNull(),
  reason: text("reason"),
  changedBy: integer("changed_by"),
  changedAt: timestamp("changed_at").notNull().defaultNow(),
}, (t) => [
  index("idx_production_status_history_production_order_id").on(t.productionOrderId),
  index("idx_production_status_history_new_status").on(t.newStatus),
  index("idx_production_status_history_changed_at").on(t.changedAt),
]);

export const insertProductionStatusHistorySchema = createInsertSchema(productionStatusHistory).omit({
  id: true,
} as never);

export type ProductionStatusHistory = typeof productionStatusHistory.$inferSelect;
export type InsertProductionStatusHistory = z.infer<typeof insertProductionStatusHistorySchema>;
