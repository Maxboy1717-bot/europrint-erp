/**
 * @module schema-misc-iot
 * @description Source module. See exports for details.
 */

import {
  pgTable, boolean, timestamp, decimal, integer,
  serial, varchar, index, uniqueIndex, text, uuid,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

// APPROVED: egasi vizyon-qurish 2026-07-01, FAZA Q — jadval allaqachon DB'da mavjud
// (apps/api/src/shared/db/migrations/ai-p36-violation-block-schema.sql:67-78, CREATE
// TABLE IF NOT EXISTS). Bu yerda faqat Drizzle mapping qo'shilmoqda — YANGI CREATE
// TABLE migratsiyasi EMAS, faqat mavjud jadvalga typed ORM kirish (ustunlar live
// information_schema bilan tekshirildi: id/employee_id/shift_id/expected_location/
// detected_location/match_score/anomaly_detected/camera_source/checked_at/created_at).
export const ai_camera_cross_check = pgTable('ai_camera_cross_check', {
  id: serial('id').primaryKey(),
  employee_id: integer('employee_id').notNull(),
  shift_id: integer('shift_id'),
  expected_location: text('expected_location'),
  detected_location: text('detected_location'),
  match_score: decimal('match_score', { precision: 5, scale: 2 }),
  anomaly_detected: boolean('anomaly_detected').notNull().default(false),
  camera_source: text('camera_source'),
  checked_at: timestamp('checked_at', { withTimezone: true }).defaultNow().notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('ai_camera_cross_check_employee_id_idx').on(table.employee_id),
  index('ai_camera_cross_check_anomaly_idx').on(table.anomaly_detected),
]);

export const sensor_devices = pgTable('sensor_devices', {
  id: uuid('id').primaryKey().$defaultFn(() => createId()),
  device_code: text('device_code').notNull().unique(),
  name: text('name').notNull(),
  location: text('location'),
  type: text('type').notNull(),
  status: text('status').notNull().default('active'),
  last_reading_at: timestamp('last_reading_at', { withTimezone: true }),
  thresholds: text('thresholds').default('{}'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('sensor_devices_device_code_idx').on(table.device_code),
  index('sensor_devices_type_idx').on(table.type),
  index('sensor_devices_status_idx').on(table.status),
]);

export const sensor_readings = pgTable('sensor_readings', {
  id: uuid('id').primaryKey().$defaultFn(() => createId()),
  device_id: uuid('device_id').notNull().references(() => sensor_devices.id, { onDelete: 'cascade' }),
  value: decimal('value', { precision: 15, scale: 4 }).notNull(),
  unit: text('unit'),
  is_anomaly: boolean('is_anomaly').default(false),
  anomaly_reason: text('anomaly_reason'),
  recorded_at: timestamp('recorded_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('sensor_readings_device_id_idx').on(table.device_id),
  index('sensor_readings_recorded_at_idx').on(table.recorded_at),
  index('sensor_readings_is_anomaly_idx').on(table.is_anomaly),
]);

export const cameras = pgTable('cameras', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 100 }).notNull(),
  name: text('name').notNull(),
  name_ru: text('name_ru'),
  location: text('location'),
  ip_address: varchar('ip_address', { length: 50 }),
  port: integer('port'),
  rtsp_url: text('rtsp_url'),
  stream_url: text('stream_url'),
  work_center_id: varchar('work_center_id', { length: 50 }),
  is_active: boolean('is_active').notNull().default(true),
  ai_enabled: boolean('ai_enabled').default(true),
  ai_sensitivity: varchar('ai_sensitivity', { length: 20 }).default('medium'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  deleted_at: timestamp('deleted_at'),
}, (table) => [
  index('cameras_is_active_idx').on(table.is_active),
]);

export const camera_zones = pgTable('camera_zones', {
  id: serial('id').primaryKey(),
  camera_id: integer('camera_id'),
  zone_name: text('zone_name').notNull(),
  zone_type: varchar('zone_type', { length: 50 }).notNull(),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('camera_zones_camera_id_idx').on(table.camera_id),
]);

export const camera_events = pgTable('camera_events', {
  id: serial('id').primaryKey(),
  camera_id: varchar('camera_id', { length: 50 }),
  event_type: varchar('event_type', { length: 100 }).notNull(),
  description: text('description').default(''),
  severity: varchar('severity', { length: 20 }).default('medium'),
  status: varchar('status', { length: 20 }).default('new'),
  ai_confidence: decimal('ai_confidence', { precision: 5, scale: 4 }),
  screenshot_url: text('screenshot_url'),
  telegram_sent: boolean('telegram_sent').default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  resolved_at: timestamp('resolved_at'),
}, (table) => [
  index('camera_events_camera_id_idx').on(table.camera_id),
  index('camera_events_event_type_idx').on(table.event_type),
  index('camera_events_status_idx').on(table.status),
  index('camera_events_created_at_idx').on(table.created_at),
]);

export const camera_alerts = pgTable('camera_alerts', {
  id: serial('id').primaryKey(),
  camera_id: varchar('camera_id', { length: 50 }),
  camera_event_id: varchar('camera_event_id', { length: 50 }),
  alert_type: varchar('alert_type', { length: 50 }),
  severity: varchar('severity', { length: 20 }).default('medium'),
  title: text('title'),
  title_ru: text('title_ru'),
  message: text('message'),
  is_acknowledged: boolean('is_acknowledged').default(false),
  is_resolved: boolean('is_resolved').default(false),
  resolved_at: timestamp('resolved_at'),
  resolution_notes: text('resolution_notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('camera_alerts_is_resolved_idx').on(table.is_resolved),
  index('camera_alerts_severity_idx').on(table.severity),
  index('camera_alerts_created_at_idx').on(table.created_at),
]);

export const camera_safety_violations = pgTable('camera_safety_violations', {
  id: serial('id').primaryKey(),
  camera_id: varchar('camera_id', { length: 50 }),
  violation_type: varchar('violation_type', { length: 100 }).notNull(),
  severity: varchar('severity', { length: 20 }).default('medium'),
  status: varchar('status', { length: 20 }).default('open'),
  description: text('description'),
  employee_id: varchar('employee_id', { length: 100 }),
  detected_at: timestamp('detected_at').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('camera_safety_violations_status_idx').on(table.status),
  index('camera_safety_violations_detected_at_idx').on(table.detected_at),
]);

export const camera_quality_defects = pgTable('camera_quality_defects', {
  id: serial('id').primaryKey(),
  camera_id: varchar('camera_id', { length: 50 }),
  defect_type: varchar('defect_type', { length: 100 }).notNull(),
  severity: varchar('severity', { length: 20 }).default('medium'),
  status: varchar('status', { length: 20 }).default('open'),
  description: text('description'),
  detected_at: timestamp('detected_at').defaultNow().notNull(),
  resolved_at: timestamp('resolved_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('camera_quality_defects_status_idx').on(table.status),
  index('camera_quality_defects_detected_at_idx').on(table.detected_at),
]);

export const camera_ai_configs = pgTable('camera_ai_configs', {
  id: serial('id').primaryKey(),
  camera_id: varchar('camera_id', { length: 50 }).notNull(),
  camera_name: text('camera_name'),
  detection_types: text('detection_types'),
  zone: varchar('zone', { length: 100 }),
  alert_threshold: decimal('alert_threshold', { precision: 5, scale: 4 }).default('0.8'),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at'),
}, (table) => [
  uniqueIndex('camera_ai_configs_camera_id_uidx').on(table.camera_id),
]);
