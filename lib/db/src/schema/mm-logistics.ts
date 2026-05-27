/**
 * @module mm-logistics
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { numericMoney } from "./numeric-money";
import { sql } from "drizzle-orm";
import { serial, pgTable, text, varchar, integer, boolean, timestamp, jsonb, unique, uuid, pgSequence, index, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./core-schema";
import { glDocuments } from "./fi-schema";
import { Order, equipment, formulaDefinitions, machineTasks, mrpResults, mrpRuns, papkaOrders, productionOrders, productionSessions, products } from "./pp-schema";
import { warehouseBins, warehouseTransactions, warehouses } from "./wms-schema";
import { rawMaterials, vendors, purchaseOrders, goodsReceipts } from "./mm-procurement";
import { materialCards, materialBatches, batches } from "./mm-materials";
import { mroBudgets } from "./mm-mro";

export const insertMroBudgetSchema = createInsertSchema(mroBudgets, {
  status: z.enum(["active", "exceeded", "closed"]),
}).omit({ id: true, createdAt: true } as never);

export type MroBudget = typeof mroBudgets.$inferSelect;

export type InsertMroBudget = z.infer<typeof insertMroBudgetSchema>;


// ============================================================================
// FAZA 2C: VENDOR PERFORMANCE & SPEND ANALYSIS
// ============================================================================

export const vendorPerformanceMetrics = pgTable("vendor_performance_metrics", {
  id: serial("id").primaryKey(),
  vendorId: varchar("vendor_id").references(() => vendors.id, { onDelete: "cascade" }).notNull(),
  periodYear: integer("period_year").notNull(),
  periodMonth: integer("period_month").notNull(),
  totalOrders: integer("total_orders").notNull().default(0),
  onTimeDeliveries: integer("on_time_deliveries").notNull().default(0),
  lateDeliveries: integer("late_deliveries").notNull().default(0),
  qualityScore: numericMoney("quality_score").default(0),
  priceCompetitiveness: numericMoney("price_competitiveness").default(0),
  returnRate: numericMoney("return_rate").default(0),
  overallRating: numericMoney("overall_rating").default(0),
  totalSpend: numericMoney("total_spend").default(0),
  currency: varchar("currency", { length: 5 }).notNull().default("UZS"),
  notes: text("notes"),
  calculatedAt: timestamp("calculated_at").defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const insertVendorPerformanceMetricSchema = createInsertSchema(vendorPerformanceMetrics).omit({ id: true, createdAt: true } as never);

export type VendorPerformanceMetric = typeof vendorPerformanceMetrics.$inferSelect;

export type InsertVendorPerformanceMetric = z.infer<typeof insertVendorPerformanceMetricSchema>;

// ======== TZ_09 (09-04): GPS monitoring — vehicle_locations ========
export const vehicleLocations = pgTable("vehicle_locations", {
  id: serial("id").primaryKey(),
  vehicleId: varchar("vehicle_id", { length: 50 }).notNull(),
  driverId: varchar("driver_id").references(() => users.id, { onDelete: "set null" }),
  driverName: varchar("driver_name", { length: 100 }),
  plateNumber: varchar("plate_number", { length: 20 }),
  latitude: numericMoney("latitude").notNull(),
  longitude: numericMoney("longitude").notNull(),
  speed: numericMoney("speed").default(0),
  status: varchar("status", { length: 20 }).notNull().default("idle"), // idle | moving | parked | off
  orderId: varchar("order_id"),
  notes: text("notes"),
  recordedAt: timestamp("recorded_at").defaultNow(),
}, (t) => [
  check("vehicle_locations_status_chk", sql`${t.status} IN ('idle','moving','parked','off')`),
]);

export const insertVehicleLocationSchema = createInsertSchema(vehicleLocations).omit({ id: true, recordedAt: true } as never);
export type VehicleLocation = typeof vehicleLocations.$inferSelect;
export type InsertVehicleLocation = z.infer<typeof insertVehicleLocationSchema>;

// ======== TZ_09 (09-01): Haydovchi yoqilg'i/to'lov xarajatlari ========
export const driverExpenses = pgTable("driver_expenses", {
  id: serial("id").primaryKey(),
  driverId: varchar("driver_id").references(() => users.id, { onDelete: "set null" }),
  vehicleId: varchar("vehicle_id", { length: 50 }),
  orderId: varchar("order_id"),
  expenseType: varchar("expense_type", { length: 50 }).notNull(), // fuel | toll | parking | repair | other
  amount: numericMoney("amount").notNull(),
  currency: varchar("currency", { length: 5 }).notNull().default("UZS"),
  receiptImageUrl: text("receipt_image_url"),
  ocrExtractedData: jsonb("ocr_extracted_data"),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending | approved | rejected
  approvedBy: varchar("approved_by"),
  notes: text("notes"),
  expenseDate: varchar("expense_date", { length: 10 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("driver_expenses_type_chk", sql`${t.expenseType} IN ('fuel','toll','parking','repair','other')`),
  check("driver_expenses_status_chk", sql`${t.status} IN ('pending','approved','rejected')`),
]);

export const insertDriverExpenseSchema = createInsertSchema(driverExpenses).omit({ id: true, createdAt: true } as never);
export type DriverExpense = typeof driverExpenses.$inferSelect;
export type InsertDriverExpense = z.infer<typeof insertDriverExpenseSchema>;


// ======== TZ_09 (09-02): Kreditor qarzlar jadvali ========
export const creditorDebts = pgTable("creditor_debts", {
  id: serial("id").primaryKey(),
  vendorId: varchar("vendor_id").references(() => vendors.id, { onDelete: "set null" }),
  amount: numericMoney("amount").notNull(),
  currency: varchar("currency", { length: 5 }).notNull().default("UZS"),
  dueDate: varchar("due_date", { length: 10 }), // YYYY-MM-DD
  description: text("description"),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending | paid | overdue | partial
  paidAmount: numericMoney("paid_amount").default(0),
  registeredBy: varchar("registered_by"),
  paidAt: timestamp("paid_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  check("creditor_debts_status_chk", sql`${t.status} IN ('pending','paid','overdue','partial')`),
]);

export const insertCreditorDebtSchema = createInsertSchema(creditorDebts).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type CreditorDebt = typeof creditorDebts.$inferSelect;
export type InsertCreditorDebt = z.infer<typeof insertCreditorDebtSchema>;

// ======== TZ_09 (09-03): Transport parki (Fleet Management) ========
export const vehicles = pgTable("mm_vehicles", {
  id: serial("id").primaryKey(),
  plateNumber: varchar("plate_number", { length: 30 }).notNull().unique(),
  model: varchar("model", { length: 100 }).notNull(),
  type: varchar("type", { length: 20 }).notNull().default("own"), // own | rental | external
  status: varchar("status", { length: 20 }).notNull().default("idle"), // active | on_route | maintenance | idle | retired
  driverId: varchar("driver_id").references(() => users.id, { onDelete: "set null" }),
  driverName: varchar("driver_name", { length: 100 }),
  driverPhone: varchar("driver_phone", { length: 20 }),
  fuelLevel: integer("fuel_level").default(0), // 0-100%
  mileage: integer("mileage").default(0),
  lastServiceDate: varchar("last_service_date", { length: 10 }),
  nextServiceDate: varchar("next_service_date", { length: 10 }),
  insuranceExpiry: varchar("insurance_expiry", { length: 10 }),
  technicalInspectionExpiry: varchar("technical_inspection_expiry", { length: 10 }),
  year: integer("year"),
  vin: varchar("vin", { length: 50 }),
  loadCapacity: numericMoney("load_capacity"), // kg
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  check("mm_vehicles_type_chk", sql`${t.type} IN ('own','rental','external')`),
  check("mm_vehicles_status_chk", sql`${t.status} IN ('active','on_route','maintenance','idle','retired')`),
]);

export const insertVehicleSchema = createInsertSchema(vehicles).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

// ======== Yoqilg'i sarfi ========
export const vehicleFuelLogs = pgTable("mm_vehicle_fuel_logs", {
  id: serial("id").primaryKey(),
  vehicleId: varchar("vehicle_id").notNull().references(() => vehicles.id, { onDelete: "cascade" }),
  plateNumber: varchar("plate_number", { length: 30 }),
  date: varchar("date", { length: 10 }).notNull(),
  liters: numericMoney("liters").notNull(),
  costPerLiter: numericMoney("cost_per_liter").notNull(),
  totalCost: numericMoney("total_cost").notNull(),
  station: varchar("station", { length: 100 }),
  mileage: integer("mileage"),
  driverId: varchar("driver_id").references(() => users.id, { onDelete: "set null" }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertVehicleFuelLogSchema = createInsertSchema(vehicleFuelLogs).omit({ id: true, createdAt: true } as never);
export type VehicleFuelLog = typeof vehicleFuelLogs.$inferSelect;
export type InsertVehicleFuelLog = z.infer<typeof insertVehicleFuelLogSchema>;

// ======== Ta'mirlash tarixi ========
export const vehicleMaintenanceRecords = pgTable("mm_vehicle_maintenance", {
  id: serial("id").primaryKey(),
  vehicleId: varchar("vehicle_id").notNull().references(() => vehicles.id, { onDelete: "cascade" }),
  plateNumber: varchar("plate_number", { length: 30 }),
  type: varchar("type", { length: 100 }).notNull(), // Moy almashtirish, Tormoz almashish, Dvigatel ta'miri, etc.
  date: varchar("date", { length: 10 }).notNull(),
  cost: numericMoney("cost").notNull().default(0),
  mileage: integer("mileage"),
  nextDueDate: varchar("next_due_date", { length: 10 }),
  workshop: varchar("workshop", { length: 100 }),
  description: text("description"),
  status: varchar("status", { length: 20 }).notNull().default("completed"), // planned | in_progress | completed
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("mm_vehicle_maint_status_chk", sql`${t.status} IN ('planned','in_progress','completed')`),
]);

export const insertVehicleMaintenanceSchema = createInsertSchema(vehicleMaintenanceRecords).omit({ id: true, createdAt: true } as never);
export type VehicleMaintenance = typeof vehicleMaintenanceRecords.$inferSelect;
export type InsertVehicleMaintenance = z.infer<typeof insertVehicleMaintenanceSchema>;

// ======== Yetkazib berish (deliveries) ========
export const mmDeliveries = pgTable("mm_deliveries", {
  id: serial("id").primaryKey(),
  orderNo: varchar("order_no", { length: 50 }),
  orderId: varchar("order_id"),
  customerId: varchar("customer_id"),
  customerName: varchar("customer_name", { length: 200 }),
  address: text("address"),
  vehicleId: varchar("vehicle_id").references(() => vehicles.id, { onDelete: "set null" }),
  plateNumber: varchar("plate_number", { length: 30 }),
  driverId: varchar("driver_id").references(() => users.id, { onDelete: "set null" }),
  driverName: varchar("driver_name", { length: 100 }),
  status: varchar("status", { length: 20 }).notNull().default("planned"), // planned | in_transit | delivered | failed | cancelled
  estimatedArrival: timestamp("estimated_arrival"),
  actualArrival: timestamp("actual_arrival"),
  weight: numericMoney("weight"),
  cost: numericMoney("cost").default(0),
  distance: numericMoney("distance"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // --- live-DB superset columns (schema-convergence A5; ADD-ONLY) ---
  deliveryNumber: varchar("delivery_number", { length: 50 }),
  deliveryType: varchar("delivery_type", { length: 30 }), // outbound, inbound, transfer, etc.
  shippingPoint: varchar("shipping_point", { length: 100 }),
  loadingPoint: varchar("loading_point", { length: 100 }),
  salesOrderId: varchar("sales_order_id"),
  plannedGoodsMovementDate: timestamp("planned_goods_movement_date"),
  actualGoodsMovementDate: timestamp("actual_goods_movement_date"),
  deliveryStatus: varchar("delivery_status", { length: 30 }), // SD-style status (alongside `status`)
  totalWeight: numericMoney("total_weight"),
  totalVolume: numericMoney("total_volume"),
  numberOfPackages: integer("number_of_packages"),
  vehicleNumber: varchar("vehicle_number", { length: 30 }),
  createdBy: integer("created_by"),
  deletedAt: timestamp("deleted_at"),
  deliveryAddress: text("delivery_address"),
  dispatchedAt: timestamp("dispatched_at"),
  deliveredAt: timestamp("delivered_at"),
}, (t) => [
  check("mm_deliveries_status_chk", sql`${t.status} IN ('planned','in_transit','delivered','failed','cancelled')`),
]);

export const insertMmDeliverySchema = createInsertSchema(mmDeliveries).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type MmDelivery = typeof mmDeliveries.$inferSelect;

// ======== MRO Tozalash jadvali ========
export const mroCleaningSchedules = pgTable("mro_cleaning_schedules", {
  id: serial("id").primaryKey(),
  area: varchar("area", { length: 200 }).notNull(),
  frequency: varchar("frequency", { length: 30 }).notNull().default("daily"), // daily | twice_daily | 3_times_daily | weekly
  lastCleaned: timestamp("last_cleaned"),
  nextCleaning: timestamp("next_cleaning"),
  responsible: varchar("responsible", { length: 200 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // done | pending | overdue
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  check("mro_cleaning_freq_chk", sql`${t.frequency} IN ('daily','twice_daily','3_times_daily','weekly')`),
  check("mro_cleaning_status_chk", sql`${t.status} IN ('done','pending','overdue')`),
]);

export const insertMroCleaningScheduleSchema = createInsertSchema(mroCleaningSchedules).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type MroCleaningSchedule = typeof mroCleaningSchedules.$inferSelect;
export type InsertMroCleaningSchedule = z.infer<typeof insertMroCleaningScheduleSchema>;
export type InsertMmDelivery = z.infer<typeof insertMmDeliverySchema>;

// ======== MRO Kommunal xizmatlar (Utility monitoring) ========
export const mroUtilityReadings = pgTable("mro_utility_readings", {
  id: serial("id").primaryKey(),
  utilityType: varchar("utility_type", { length: 20 }).notNull(), // electricity | gas | water | compressed_air
  unit: varchar("unit", { length: 20 }).notNull().default("kWt"), // kWt | m3 | dona
  readingDate: varchar("reading_date", { length: 10 }).notNull(), // YYYY-MM-DD
  todayValue: numericMoney("today_value").notNull().default(0),
  yesterdayValue: numericMoney("yesterday_value").notNull().default(0),
  monthTotal: numericMoney("month_total").notNull().default(0),
  monthBudget: numericMoney("month_budget").notNull().default(0),
  trendPercent: numericMoney("trend_percent").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("mro_utility_type_chk", sql`${t.utilityType} IN ('electricity','gas','water','compressed_air')`),
]);

export const insertMroUtilityReadingSchema = createInsertSchema(mroUtilityReadings).omit({ id: true, createdAt: true } as never);
export type MroUtilityReading = typeof mroUtilityReadings.$inferSelect;
export type InsertMroUtilityReading = z.infer<typeof insertMroUtilityReadingSchema>;

// ======== MRO Binolar va xonalar (Facilities) ========
export const mroFacilities = pgTable("mro_facilities", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  facilityType: varchar("facility_type", { length: 30 }).notNull().default("room"), // room | building | outdoor
  areaM2: numericMoney("area_m2").notNull().default(0),
  capacity: integer("capacity").notNull().default(0),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active | inactive | under_repair
  lastInspection: varchar("last_inspection", { length: 10 }),
  nextInspection: varchar("next_inspection", { length: 10 }),
  responsible: varchar("responsible", { length: 200 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  check("mro_facilities_type_chk", sql`${t.facilityType} IN ('room','building','outdoor')`),
  check("mro_facilities_status_chk", sql`${t.status} IN ('active','inactive','under_repair')`),
]);

export const insertMroFacilitySchema = createInsertSchema(mroFacilities).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type MroFacility = typeof mroFacilities.$inferSelect;
export type InsertMroFacility = z.infer<typeof insertMroFacilitySchema>;
