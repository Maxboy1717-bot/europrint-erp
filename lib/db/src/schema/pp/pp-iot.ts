/**
 * @module pp-iot
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { numericMoney } from "../numeric-money";
import { sql } from "drizzle-orm";
import { serial, pgTable, text, varchar, integer, boolean, timestamp, jsonb, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "../core-schema";
import { equipment, productionOrders, workCenters } from "./pp-production";

// Sensor Devices (Sanoq datchiklari)
export const sensorDevices = pgTable("sensor_devices", {
  id: serial("id").primaryKey(),
  deviceCode: varchar("device_code", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  deviceType: varchar("device_type", { length: 30 }).notNull(),
  equipmentId: varchar("equipment_id").references(() => equipment.id, { onDelete: "set null" }),
  workCenterId: varchar("work_center_id").references(() => workCenters.id, { onDelete: "set null" }),
  connectionType: varchar("connection_type", { length: 20 }).notNull().default("http"),
  ipAddress: varchar("ip_address", { length: 50 }),
  port: integer("port"),
  authToken: text("auth_token"),
  signalThresholdSeconds: integer("signal_threshold_seconds").notNull().default(10),
  pulsePerUnit: integer("pulse_per_unit").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  lastHeartbeat: timestamp("last_heartbeat"),
  status: varchar("status", { length: 20 }).notNull().default("offline"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("sensor_devices_device_type_chk", sql`${t.deviceType} IN ('inductive','optical','encoder','plc_digital')`),
  check("sensor_devices_connection_type_chk", sql`${t.connectionType} IN ('http','mqtt','websocket')`),
]);

export const insertSensorDeviceSchema = createInsertSchema(sensorDevices, {
  deviceCode: z.string().min(1, "Qurilma kodi kerak"),
  name: z.string().min(2, "Qurilma nomi kerak"),
  deviceType: z.enum(["inductive", "optical", "encoder", "plc_digital"]),
  connectionType: z.enum(["http", "mqtt", "websocket"]),
  signalThresholdSeconds: z.number().min(1).max(300),
  pulsePerUnit: z.number().min(1).max(100),
}).omit({ id: true, createdAt: true } as never);

export type SensorDevice = typeof sensorDevices.$inferSelect;
export type InsertSensorDevice = z.infer<typeof insertSensorDeviceSchema>;

// Production Sessions (Ishlab chiqarish sessiyalari)
export const productionSessions = pgTable("production_sessions", {
  id: serial("id").primaryKey(),
  sessionNumber: varchar("session_number", { length: 50 }).notNull().unique(),
  productionOrderId: integer("production_order_id").references(() => productionOrders.id, { onDelete: "cascade" }).notNull(),
  equipmentId: integer("equipment_id").references(() => equipment.id, { onDelete: "cascade" }).notNull(),
  deviceId: integer("device_id").references(() => sensorDevices.id, { onDelete: "set null" }),
  workerId: integer("worker_id").references(() => users.id, { onDelete: "restrict" }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  targetQuantity: integer("target_quantity").notNull(),
  actualQuantity: integer("actual_quantity").notNull().default(0),
  defectQuantity: integer("defect_quantity").notNull().default(0),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  lastSignalAt: timestamp("last_signal_at"),
  runningTimeSeconds: integer("running_time_seconds").notNull().default(0),
  stoppedTimeSeconds: integer("stopped_time_seconds").notNull().default(0),
  workerNotes: text("worker_notes"),
  availability: numericMoney("availability"),
  performance: numericMoney("performance"),
  quality: numericMoney("quality"),
  oee: numericMoney("oee"),
  // ── ADD-ONLY: live DB superset columns ──
  orderId: varchar("order_id"),
  sessionId: varchar("session_id"),
  operatorId: integer("operator_id"),
  machineId: varchar("machine_id"),
  shiftId: varchar("shift_id"),
  workCenterId: integer("work_center_id"),
  sessionDate: varchar("session_date", { length: 10 }),
  producedQty: integer("produced_qty"),
  defectQty: integer("defect_qty"),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  check("production_sessions_status_chk", sql`${t.status} IN ('pending','running','paused','stopped','completed')`),
]);

export const insertProductionSessionSchema = createInsertSchema(productionSessions, {
  sessionNumber: z.string().min(1, "Sessiya raqami kerak"),
  targetQuantity: z.number().min(1, "Reja miqdori kerak"),
  status: z.enum(["pending", "running", "paused", "stopped", "completed"]),
}).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true } as never);

export type ProductionSession = typeof productionSessions.$inferSelect;
export type InsertProductionSession = z.infer<typeof insertProductionSessionSchema>;

// Sensor Readings (Xom signal ma'lumotlari)
export const sensorReadings = pgTable("sensor_readings", {
  id: serial("id").primaryKey(),
  deviceId: varchar("device_id").references(() => sensorDevices.id, { onDelete: "cascade" }).notNull(),
  pulseCount: integer("pulse_count").notNull().default(1),
  readingTime: timestamp("reading_time").notNull().defaultNow(),
  sessionId: varchar("session_id").references(() => productionSessions.id, { onDelete: "set null" }),
  isProcessed: boolean("is_processed").notNull().default(false),
});

export type SensorReading = typeof sensorReadings.$inferSelect;

// Downtime Events (To'xtash hodisalari)
export const downtimeEvents = pgTable("downtime_events", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id").references(() => productionSessions.id, { onDelete: "cascade" }).notNull(),
  eventType: varchar("event_type", { length: 20 }).notNull(),
  startedAt: timestamp("started_at").notNull(),
  endedAt: timestamp("ended_at"),
  durationSeconds: integer("duration_seconds"),
  reasonCode: varchar("reason_code", { length: 20 }).notNull().default("unknown"),
  reasonDescription: text("reason_description"),
  reasonDescriptionRu: text("reason_description_ru"),
  reportedBy: varchar("reported_by").references(() => users.id, { onDelete: "set null" }),
  isPlanned: boolean("is_planned").notNull().default(false),
  notes: text("notes"),
  // ── ADD-ONLY: live DB superset columns ──
  workCenterId: integer("work_center_id"),
  reasonCodeId: integer("reason_code_id"),
  durationMinutes: integer("duration_minutes"),
  durationMin: integer("duration_min"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("downtime_events_event_type_chk", sql`${t.eventType} IN ('auto_detected','manual_entry')`),
  check("downtime_events_reason_code_chk", sql`${t.reasonCode} IN ('unknown','material_shortage','tool_change','machine_breakdown','quality_issue','shift_change','break','setup','maintenance','no_order','other')`),
]);

export const insertDowntimeEventSchema = createInsertSchema(downtimeEvents, {
  eventType: z.enum(["auto_detected", "manual_entry"]),
  reasonCode: z.enum([
    "unknown", "material_shortage", "tool_change", "machine_breakdown",
    "quality_issue", "shift_change", "break", "setup", "maintenance", "no_order", "other"
  ]),
}).omit({ id: true, createdAt: true } as never);

export type DowntimeEvent = typeof downtimeEvents.$inferSelect;
export type InsertDowntimeEvent = z.infer<typeof insertDowntimeEventSchema>;

// Worker Session Events
export const workerSessionEvents = pgTable("worker_session_events", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id").references(() => productionSessions.id, { onDelete: "cascade" }).notNull(),
  workerId: varchar("worker_id").references(() => users.id, { onDelete: "restrict" }).notNull(),
  eventType: varchar("event_type", { length: 30 }).notNull(),
  defectQuantity: integer("defect_quantity"),
  defectReason: text("defect_reason"),
  description: text("description"),
  descriptionRu: text("description_ru"),
  attachmentUrl: text("attachment_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("worker_session_events_type_chk", sql`${t.eventType} IN ('defect_report','quality_check','material_request','maintenance_request','note','status_change')`),
]);

export const insertWorkerSessionEventSchema = createInsertSchema(workerSessionEvents, {
  eventType: z.enum([
    "defect_report", "quality_check", "material_request",
    "maintenance_request", "note", "status_change"
  ]),
}).omit({ id: true, createdAt: true } as never);

export type WorkerSessionEvent = typeof workerSessionEvents.$inferSelect;
export type InsertWorkerSessionEvent = z.infer<typeof insertWorkerSessionEventSchema>;

// OEE Snapshots
export const oeeSnapshots = pgTable("oee_snapshots", {
  id: serial("id").primaryKey(),
  equipmentId: varchar("equipment_id").references(() => equipment.id, { onDelete: "cascade" }).notNull(),
  snapshotDate: varchar("snapshot_date", { length: 10 }).notNull(),
  snapshotHour: integer("snapshot_hour"),
  plannedProductionTime: integer("planned_production_time"),
  actualRunningTime: integer("actual_running_time"),
  totalStoppedTime: integer("total_stopped_time"),
  plannedDowntime: integer("planned_downtime"),
  unplannedDowntime: integer("unplanned_downtime"),
  targetQuantity: integer("target_quantity"),
  actualQuantity: integer("actual_quantity"),
  defectQuantity: integer("defect_quantity"),
  availability: numericMoney("availability"),
  performance: numericMoney("performance"),
  quality: numericMoney("quality"),
  oee: numericMoney("oee"),
  topDowntimeReasons: jsonb("top_downtime_reasons"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type OeeSnapshot = typeof oeeSnapshots.$inferSelect;
export const insertOeeSnapshotSchema = createInsertSchema(oeeSnapshots).omit({ id: true, createdAt: true } as never);
export type InsertOeeSnapshot = z.infer<typeof insertOeeSnapshotSchema>;

// Downtime Reason Codes (To'xtash sabablari lug'ati)
export const downtimeReasonCodes = pgTable("downtime_reason_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 30 }).notNull().unique(),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  category: varchar("category", { length: 30 }).notNull(),
  color: varchar("color", { length: 10 }).default("#808080"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("downtime_reason_codes_category_chk", sql`${t.category} IN ('planned','unplanned','external')`),
]);

export const insertDowntimeReasonCodeSchema = createInsertSchema(downtimeReasonCodes, {
  code: z.string().min(1, "Kod kerak"),
  name: z.string().min(2, "Nom kerak"),
  category: z.enum(["planned", "unplanned", "external"]),
}).omit({ id: true, createdAt: true } as never);

export type DowntimeReasonCode = typeof downtimeReasonCodes.$inferSelect;
export type InsertDowntimeReasonCode = z.infer<typeof insertDowntimeReasonCodeSchema>;
