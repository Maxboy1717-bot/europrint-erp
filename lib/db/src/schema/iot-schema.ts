/**
 * @module iot-schema
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { numericMoney } from "./numeric-money";
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, serial, unique, uuid, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./core-schema";
import { productionOrders, workCenters } from "./pp-schema";


// ========== 3. KAMERA AI INTEGRATSIYASI (CAMERA AI) ==========

// Cameras (kameralar)
export const cameras = pgTable("cameras", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  rtspUrl: text("rtsp_url"), // RTSP stream URL
  streamUrl: text("stream_url"), // HTTP/HLS/MJPEG stream URL yoki YouTube embed URL
  streamType: varchar("stream_type", { length: 20 }), // youtube, mjpeg, hls, image
  thumbnailUrl: text("thumbnail_url"), // Kamera thumbnail/screenshot
  ipAddress: varchar("ip_address", { length: 50 }),
  port: integer("port"),
  username: varchar("username", { length: 50 }),
  passwordHash: text("password_hash"),
  workCenterId: varchar("work_center_id").references(() => workCenters.id, { onDelete: "set null" }),
  location: text("location"),
  isActive: boolean("is_active").notNull().default(true),
  // TZ-15: Super admin tomonidan har kamera uchun alohida AI prompt
  aiPrompt: text("ai_prompt"), // Kamera uchun maxsus AI ko'rsatmasi
  aiCategories: jsonb("ai_categories"), // Aniqlanadigan kategoriyalar: ["safety","quality","productivity"]
  aiSensitivity: varchar("ai_sensitivity", { length: 20 }).default("medium"), // low, medium, high
  aiEnabled: boolean("ai_enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  check("cameras_stream_type_chk", sql`${t.streamType} IS NULL OR ${t.streamType} IN ('youtube','mjpeg','hls','image','rtsp')`),
  check("cameras_ai_sensitivity_chk", sql`${t.aiSensitivity} IS NULL OR ${t.aiSensitivity} IN ('low','medium','high')`),
]);


export const insertCameraSchema = createInsertSchema(cameras, {
  code: z.string().min(1, "Kod talab qilinadi"),
  name: z.string().min(2, "Nom kamida 2 ta belgidan iborat bo'lishi kerak"),
}).omit({ id: true, createdAt: true } as never);


export type Camera = typeof cameras.$inferSelect;

export type InsertCamera = z.infer<typeof insertCameraSchema>;


// Camera Zones (kuzatuv zonalari)
export const cameraZones = pgTable("camera_zones", {
  id: serial("id").primaryKey(),
  cameraId: varchar("camera_id").references(() => cameras.id, { onDelete: "set null" }),
  zoneName: text("zone_name").notNull(),
  zoneType: varchar("zone_type", { length: 50 }).notNull(), // safety, quality, packaging, production
  coordinates: jsonb("coordinates"), // {x1, y1, x2, y2} - zona koordinatalari
  aiModelType: varchar("ai_model_type", { length: 50 }), // yolov8, custom
  confidenceThreshold: numericMoney("confidence_threshold").notNull().default(0.7),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("camera_zones_type_chk", sql`${t.zoneType} IN ('safety','quality','packaging','production')`),
]);


export const insertCameraZoneSchema = createInsertSchema(cameraZones, {
  zoneName: z.string().min(2, "Zona nomi kamida 2 ta belgidan iborat bo'lishi kerak"),
  zoneType: z.enum(["safety", "quality", "packaging", "production"]),
}).omit({ id: true, createdAt: true } as never);


export type CameraZone = typeof cameraZones.$inferSelect;

export type InsertCameraZone = z.infer<typeof insertCameraZoneSchema>;


// NOTE: `cameraEvents` (camera_events) pgTable removed 2026-07-02 — orphan in lib/db
// (no consumer via @workspace/db or @europrint/schemas). Dependent tables below keep
// their camera_event_id column but no longer hold a Drizzle-level FK to it.

// Camera Detections (Kamera orqali aniqlangan xodimlar)
export const cameraDetections = pgTable("camera_detections", {
  id: serial("id").primaryKey(),
  cameraId: varchar("camera_id").references(() => cameras.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  detectionDate: varchar("detection_date", { length: 10 }).notNull(), // YYYY-MM-DD
  detectionTime: varchar("detection_time", { length: 8 }).notNull(), // HH:MM:SS
  zoneName: text("zone_name"), // Qaysi zonada (masalan: "Gofrokarton liniyasi")
  confidence: numericMoney("confidence"), // AI ishonch darajasi (0-1)
  snapshotUrl: text("snapshot_url"), // Screenshot URL
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const insertCameraDetectionSchema = createInsertSchema(cameraDetections, {
  detectionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  detectionTime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, "Vaqt HH:MM:SS formatida bo'lishi kerak"),
}).omit({ id: true, createdAt: true } as never);


export type CameraDetection = typeof cameraDetections.$inferSelect;

export type InsertCameraDetection = z.infer<typeof insertCameraDetectionSchema>;


// Employee Zone Tracking (Xodimlarning zonalarda vaqt o'tkazishi - heatmap uchun)
export const employeeZoneTracking = pgTable("employee_zone_tracking", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  cameraId: varchar("camera_id").references(() => cameras.id, { onDelete: "set null" }),
  zoneName: text("zone_name").notNull(),
  trackingDate: varchar("tracking_date", { length: 10 }).notNull(), // YYYY-MM-DD
  entryTime: varchar("entry_time", { length: 8 }), // HH:MM:SS - Kirish vaqti
  exitTime: varchar("exit_time", { length: 8 }), // HH:MM:SS - Chiqish vaqti
  durationMinutes: integer("duration_minutes").notNull().default(0), // Qancha vaqt (minutlarda)
  visitCount: integer("visit_count").notNull().default(1), // Necha marta kirdi
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const insertEmployeeZoneTrackingSchema = createInsertSchema(employeeZoneTracking, {
  zoneName: z.string().min(1, "Zona nomi talab qilinadi"),
  trackingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  durationMinutes: z.number().int().nonnegative(),
  visitCount: z.number().int().positive(),
}).omit({ id: true, createdAt: true } as never);


export type EmployeeZoneTracking = typeof employeeZoneTracking.$inferSelect;

export type InsertEmployeeZoneTracking = z.infer<typeof insertEmployeeZoneTrackingSchema>;


// ========================
// AI CAMERA CONTROL MODULE KENGAYTMALARI (NOYOB - DUNYODA YO'Q)
// ========================

// Safety Violations (Xavfsizlik buzilishlari - batafsil)
export const safetyViolations = pgTable("safety_violations", {
  id: serial("id").primaryKey(),
  cameraEventId: varchar("camera_event_id"),
  cameraId: varchar("camera_id").references(() => cameras.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }), // Buzilish qilgan xodim
  violationType: varchar("violation_type", { length: 50 }).notNull(), // no_helmet, no_gloves, no_glasses, danger_zone, unsafe_behavior
  location: text("location"),
  imageUrl: text("image_url"),
  videoClipUrl: text("video_clip_url"),
  aiConfidence: numericMoney("ai_confidence"),
  actionTaken: text("action_taken"), // Qilingan chora
  penaltyApplied: boolean("penalty_applied").notNull().default(false),
  penaltyAmount: numericMoney("penalty_amount"),
  acknowledgedById: varchar("acknowledged_by_id").references(() => users.id, { onDelete: "set null" }),
  acknowledgedAt: timestamp("acknowledged_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("safety_violations_type_chk", sql`${t.violationType} IN ('no_helmet','no_gloves','no_glasses','danger_zone','unsafe_behavior','other')`),
]);


export const insertSafetyViolationSchema = createInsertSchema(safetyViolations, {
  cameraId: z.string().min(1, "Kamera kerak"),
  violationType: z.enum(["no_helmet", "no_gloves", "no_glasses", "danger_zone", "unsafe_behavior", "other"]),
}).omit({ id: true, createdAt: true } as never);


export type SafetyViolation = typeof safetyViolations.$inferSelect;

export type InsertSafetyViolation = z.infer<typeof insertSafetyViolationSchema>;


// Quality Defects Camera (Kamera orqali aniqlangan sifat nuqsonlari)
export const qualityDefectsCamera = pgTable("quality_defects_camera", {
  id: serial("id").primaryKey(),
  cameraEventId: varchar("camera_event_id"),
  cameraId: varchar("camera_id").references(() => cameras.id, { onDelete: "cascade" }).notNull(),
  workCenterId: varchar("work_center_id").references(() => workCenters.id, { onDelete: "set null" }),
  productionOrderId: varchar("production_order_id").references(() => productionOrders.id, { onDelete: "set null" }),
  defectType: varchar("defect_type", { length: 50 }).notNull(), // tear, crush, misprint, misalignment, glue_issue, dimension_error
  defectLocation: text("defect_location"), // Qutining qaysi qismi
  imageUrl: text("image_url"),
  aiConfidence: numericMoney("ai_confidence"),
  defectCount: integer("defect_count").default(1),
  batchId: varchar("batch_id", { length: 100 }), // Partiya raqami
  actionTaken: varchar("action_taken", { length: 30 }), // rejected, rework, passed
  reviewedById: varchar("reviewed_by_id").references(() => users.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("quality_defects_cam_type_chk", sql`${t.defectType} IN ('tear','crush','misprint','misalignment','glue_issue','dimension_error','other')`),
  check("quality_defects_cam_action_chk", sql`${t.actionTaken} IS NULL OR ${t.actionTaken} IN ('rejected','rework','passed')`),
]);


export const insertQualityDefectCameraSchema = createInsertSchema(qualityDefectsCamera, {
  cameraId: z.string().min(1, "Kamera kerak"),
  defectType: z.enum(["tear", "crush", "misprint", "misalignment", "glue_issue", "dimension_error", "other"]),
}).omit({ id: true, createdAt: true } as never);


export type QualityDefectCamera = typeof qualityDefectsCamera.$inferSelect;

export type InsertQualityDefectCamera = z.infer<typeof insertQualityDefectCameraSchema>;


// Machine Status Logs (Mashina holati tarixi - kamera kuzatuvi)
export const machineStatusLogs = pgTable("machine_status_logs", {
  id: serial("id").primaryKey(),
  workCenterId: varchar("work_center_id").references(() => workCenters.id, { onDelete: "cascade" }).notNull(),
  cameraId: varchar("camera_id").references(() => cameras.id, { onDelete: "set null" }),
  status: varchar("status", { length: 30 }).notNull(), // running, idle, stopped, maintenance, breakdown
  previousStatus: varchar("previous_status", { length: 30 }),
  statusStartedAt: timestamp("status_started_at").notNull().defaultNow(),
  statusEndedAt: timestamp("status_ended_at"),
  durationMinutes: integer("duration_minutes"),
  // Sabab (agar to'xtagan bo'lsa)
  stopReason: varchar("stop_reason", { length: 50 }), // material_shortage, maintenance, breakdown, changeover, no_order
  stopReasonDetail: text("stop_reason_detail"),
  // Operator
  operatorId: varchar("operator_id").references(() => users.id, { onDelete: "set null" }),
  // AI aniqlash
  aiDetected: boolean("ai_detected").notNull().default(false),
  aiConfidence: numericMoney("ai_confidence"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("machine_status_logs_status_chk", sql`${t.status} IN ('running','idle','stopped','maintenance','breakdown')`),
  check("machine_status_logs_prev_status_chk", sql`${t.previousStatus} IS NULL OR ${t.previousStatus} IN ('running','idle','stopped','maintenance','breakdown')`),
  check("machine_status_logs_duration_chk", sql`${t.durationMinutes} IS NULL OR ${t.durationMinutes} >= 0`),
  check("machine_status_logs_stop_reason_chk", sql`${t.stopReason} IS NULL OR ${t.stopReason} IN ('material_shortage','maintenance','breakdown','changeover','no_order')`),
]);


export const insertMachineStatusLogSchema = createInsertSchema(machineStatusLogs, {
  workCenterId: z.string().min(1, "Work center kerak"),
  status: z.enum(["running", "idle", "stopped", "maintenance", "breakdown"]),
}).omit({ id: true, createdAt: true } as never);


export type MachineStatusLog = typeof machineStatusLogs.$inferSelect;

export type InsertMachineStatusLog = z.infer<typeof insertMachineStatusLogSchema>;


// NOTE: `cameraAlerts` (camera_alerts) pgTable removed 2026-07-02 — orphan in lib/db
// (no consumer via @workspace/db or @europrint/schemas).

// Camera Dashboard Stats (Real-time statistika uchun cache)
export const cameraDashboardStats = pgTable("camera_dashboard_stats", {
  id: serial("id").primaryKey(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  shift: varchar("shift", { length: 20 }),
  // Umumiy statistika
  totalCameras: integer("total_cameras").default(0),
  activeCameras: integer("active_cameras").default(0),
  // Hodisalar
  totalEvents: integer("total_events").default(0),
  safetyEvents: integer("safety_events").default(0),
  qualityEvents: integer("quality_events").default(0),
  productivityEvents: integer("productivity_events").default(0),
  machineEvents: integer("machine_events").default(0),
  // Xavfsizlik
  safetyViolationsCount: integer("safety_violations_count").default(0),
  helmetViolations: integer("helmet_violations").default(0),
  glovesViolations: integer("gloves_violations").default(0),
  dangerZoneViolations: integer("danger_zone_violations").default(0),
  // Sifat
  defectsDetected: integer("defects_detected").default(0),
  defectsRejected: integer("defects_rejected").default(0),
  defectsReworked: integer("defects_reworked").default(0),
  // Mashinalar
  totalMachines: integer("total_machines").default(0),
  runningMachines: integer("running_machines").default(0),
  idleMachines: integer("idle_machines").default(0),
  stoppedMachines: integer("stopped_machines").default(0),
  // Xodimlar
  totalEmployeesDetected: integer("total_employees_detected").default(0),
  avgProductivityScore: numericMoney("avg_productivity_score").default(0),
  // OEE
  oeeAvailability: numericMoney("oee_availability").default(0),
  oeePerformance: numericMoney("oee_performance").default(0),
  oeeQuality: numericMoney("oee_quality").default(0),
  oeeOverall: numericMoney("oee_overall").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});


export const insertCameraDashboardStatsSchema = createInsertSchema(cameraDashboardStats, {
  date: z.string().min(1, "Sana kerak"),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);


export type CameraDashboardStats = typeof cameraDashboardStats.$inferSelect;

export type InsertCameraDashboardStats = z.infer<typeof insertCameraDashboardStatsSchema>;


// ========== IOT SENSOR MONITORING ==========
// NOTE (Q-29 re-verify 2026-07-02): `iotSensors` kept — re-exported live via
// apps/api/src/shared/db/schema-ext-b-2.ts (`iotSensors as iot_sensors` from
// '@workspace/db'). NOT orphan.
export const iotSensors = pgTable("iot_sensors", {
  id: serial("id").primaryKey(),
  sensorCode: varchar("sensor_code", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  type: varchar("type", { length: 30 }).notNull(),
  machineId: varchar("machine_id"),
  location: text("location"),
  unit: varchar("unit", { length: 20 }),
  minThreshold: numericMoney("min_threshold"),
  maxThreshold: numericMoney("max_threshold"),
  isActive: boolean("is_active").notNull().default(true),
  lastReading: numericMoney("last_reading"),
  lastReadingAt: timestamp("last_reading_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // --- live-DB superset (A12 convergence) ---
  deviceCode: varchar("device_code", { length: 50 }),
  status: varchar("status", { length: 20 }),
  thresholds: jsonb("thresholds"),
});


export const iotSensorReadings = pgTable("iot_sensor_readings", {
  id: serial("id").primaryKey(),
  sensorId: varchar("sensor_id").notNull().references(() => iotSensors.id, { onDelete: "cascade" }),
  value: numericMoney("value").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("normal"),
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
}, (t) => [
  check("iot_sensor_readings_status_chk", sql`${t.status} IN ('normal','warning','critical','error')`),
]);


export const iotAlerts = pgTable("iot_alerts", {
  id: serial("id").primaryKey(),
  sensorId: varchar("sensor_id").notNull().references(() => iotSensors.id, { onDelete: "cascade" }),
  alertType: varchar("alert_type", { length: 20 }).notNull(),
  severity: varchar("severity", { length: 10 }).notNull(),
  message: text("message").notNull(),
  value: numericMoney("value"),
  threshold: numericMoney("threshold"),
  isResolved: boolean("is_resolved").notNull().default(false),
  resolvedBy: integer("resolved_by").references(() => users.id, { onDelete: "set null" }),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("iot_alerts_type_chk", sql`${t.alertType} IN ('above_max','below_min','offline','error')`),
  check("iot_alerts_severity_chk", sql`${t.severity} IN ('low','medium','high','critical')`),
]);


export const insertIotSensorSchema = createInsertSchema(iotSensors).omit({ id: true, createdAt: true, lastReading: true, lastReadingAt: true } as never);

export const insertIotSensorReadingSchema = createInsertSchema(iotSensorReadings).omit({ id: true, recordedAt: true } as never);

export const insertIotAlertSchema = createInsertSchema(iotAlerts).omit({ id: true, createdAt: true, isResolved: true, resolvedBy: true, resolvedAt: true } as never);


export type IotSensor = typeof iotSensors.$inferSelect;

export type InsertIotSensor = z.infer<typeof insertIotSensorSchema>;

export type IotSensorReading = typeof iotSensorReadings.$inferSelect;

export type InsertIotSensorReading = z.infer<typeof insertIotSensorReadingSchema>;

export type IotAlert = typeof iotAlerts.$inferSelect;

export type InsertIotAlert = z.infer<typeof insertIotAlertSchema>;

// NOTE: `cameraAiConfigs` (camera_ai_configs) pgTable removed 2026-07-02 — orphan in
// lib/db (no consumer via @workspace/db or @europrint/schemas).


// ======== TZ_10 (10-02): Operator smena natijasi — performance summary ========
export const operatorPerformanceSummary = pgTable("operator_performance_summary", {
  id: serial("id").primaryKey(),
  operatorId: varchar("operator_id").notNull(),
  shiftDate: varchar("shift_date", { length: 10 }).notNull(), // YYYY-MM-DD
  shiftType: varchar("shift_type", { length: 20 }).default("day"), // day | night
  papkaOrderId: varchar("papka_order_id"),
  totalTasksCompleted: integer("total_tasks_completed").default(0),
  totalQtyProduced: integer("total_qty_produced").default(0),
  totalDefects: integer("total_defects").default(0),
  totalProductionTimeMin: integer("total_production_time_min").default(0),
  efficiencyScore: numericMoney("efficiency_score").default(0), // 0-100
  qualityScore: numericMoney("quality_score").default(0),       // 0-100
  overtimeMin: integer("overtime_min").default(0),
  payrollBonus: numericMoney("payroll_bonus").default(0), // UZS — MES bonus
  payrollDeduction: numericMoney("payroll_deduction").default(0), // UZS — defect uchun
  payrollSynced: boolean("payroll_synced").default(false), // Moliya ga o'tkazildimi
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("operator_perf_shift_type_chk", sql`${t.shiftType} IS NULL OR ${t.shiftType} IN ('day','night')`),
]);

export const insertOperatorPerformanceSummarySchema = createInsertSchema(operatorPerformanceSummary).omit({ id: true, createdAt: true } as never);
export type OperatorPerformanceSummary = typeof operatorPerformanceSummary.$inferSelect;
export type InsertOperatorPerformanceSummary = z.infer<typeof insertOperatorPerformanceSummarySchema>;


// ========== PM SCHEDULES (Preventive Maintenance) ==========
export const pmSchedules = pgTable("pm_schedules", {
  id: serial("id").primaryKey(),
  equipmentId: varchar("equipment_id", { length: 100 }).notNull(),
  equipmentName: text("equipment_name"),
  equipmentCode: varchar("equipment_code", { length: 50 }),
  taskName: text("task_name").notNull(),
  taskDescription: text("task_description"),
  intervalDays: integer("interval_days").notNull(),
  lastDoneDate: varchar("last_done_date", { length: 10 }),
  nextDueDate: varchar("next_due_date", { length: 10 }),
  assignedTo: varchar("assigned_to", { length: 100 }),
  estimatedHours: numericMoney("estimated_hours"),
  priority: varchar("priority", { length: 20 }).notNull().default("medium"),
  requiredParts: jsonb("required_parts"),
  status: varchar("status", { length: 30 }).notNull().default("scheduled"),
  completedDates: jsonb("completed_dates").default([]),
  completedAt: varchar("completed_at", { length: 30 }),
  completedBy: varchar("completed_by", { length: 100 }),
  actualHours: numericMoney("actual_hours"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("pm_schedules_status_chk", sql`${t.status} IN ('scheduled','in_progress','completed','overdue','cancelled')`),
  check("pm_schedules_priority_chk", sql`${t.priority} IN ('low','medium','high','critical')`),
  check("pm_schedules_interval_chk", sql`${t.intervalDays} > 0`),
]);

export const insertPmScheduleSchema = createInsertSchema(pmSchedules).omit({ id: true, createdAt: true } as never);
export type PmSchedule = typeof pmSchedules.$inferSelect;
export type InsertPmSchedule = z.infer<typeof insertPmScheduleSchema>;
