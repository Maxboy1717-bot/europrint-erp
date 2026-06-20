/**
 * @module iot-tablet.schemas
 * @description Zod schemas + role constants for IotTabletController. Extracted
 *   to keep the controller file under the 300-line cap (Rule 16).
 */

import { z } from 'zod';

export const IotPassthroughSchema = z.record(z.unknown());

// Wave 11 P1: tabel-number + password login. The proper QR-token flow is
// deferred to P3-31 (no `tablet_logins` / `iot_qr_tokens` table exists yet).
export const TabletLoginSchema = z.object({
  tabelNumber: z.string().min(1).max(50),
  password: z.string().min(1).max(500),
}).passthrough();

export const TabletSessionSchema = z.object({
  workerId:  z.union([z.string(), z.number()]).optional(),
  startedAt: z.string().optional(),
}).passthrough();

export const ProductionSessionSchema = z.object({
  orderId:   z.union([z.string(), z.number()]).optional(),
  machineId: z.union([z.string(), z.number()]).optional(),
  shiftId:   z.union([z.string(), z.number()]).optional(),
}).passthrough();

// Wave 11 P1: SOS alert payload mirrors the existing PWA call site
// (useIoTTabletAlerts.ts:188). `workerId` is added (optional in body - falls
// back to the JWT subject) so the safety button can fire without a tablet
// session lookup. TODO P3-31: derive workerId from a verified tablet token.
export const TabletSosAlertSchema = z.object({
  workerId:    z.union([z.string(), z.number()]).optional(),
  workerName:  z.string().max(255).optional(),
  sessionId:   z.union([z.string(), z.number()]).nullable().optional(),
  equipmentId: z.union([z.string(), z.number()]).nullable().optional(),
  alertType:   z.string().max(50).optional(),
  message:     z.string().max(2000).optional(),
  lat:         z.number().optional(),
  lng:         z.number().optional(),
}).passthrough();

export const TabletEquipmentQuerySchema = z.object({
  workerId: z.coerce.number().int().positive().optional(),
  shopFloor: z.string().max(200).optional(),
}).passthrough();

export const TabletOrdersQuerySchema = z.object({
  workerId: z.coerce.number().int().positive().optional(),
  equipmentId: z.coerce.number().int().positive().optional(),
  status: z.string().max(50).optional(),
}).passthrough();

export const WorkerScheduleQuerySchema = z.object({
  workerId: z.coerce.number().int().positive(),
  from: z.string().max(30).optional(),
  to: z.string().max(30).optional(),
}).passthrough();

export const DefectReportSchema = z.object({
  defectCount: z.coerce.number().int().min(0).default(1),
  eventType: z.string().max(50).default('defect'),
  reasonCode: z.string().max(100).optional(),
  reasonDescription: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional(),
}).passthrough();

export const InlineQcSchema = z.object({
  sampleSize: z.coerce.number().int().min(1).default(1),
  defectCount: z.coerce.number().int().min(0).default(0),
  passRate: z.coerce.number().int().min(0).max(100).optional(),
  notes: z.string().max(2000).optional(),
}).passthrough();

export const HandoverSchema = z.object({
  department: z.string().max(200).default('unknown'),
  handoverDate: z.string().max(50).optional(),
  machineStatus: z.string().max(1000).optional(),
  pendingTasks: z.string().max(2000).optional(),
  qualityIssues: z.string().max(2000).optional(),
  safetyNotes: z.string().max(2000).optional(),
  materialStatus: z.string().max(1000).optional(),
  handedOverBy: z.coerce.number().int().min(0).default(0),
  receivedBy: z.coerce.number().int().optional(),
  status: z.string().max(50).default('pending'),
}).passthrough();

export const MaterialKitScanSchema = z.object({
  scannedBy: z.coerce.number().int().optional(),
}).passthrough();

export const EvaluationSchema = z.object({
  operatorId: z.coerce.number().int().optional(),
  shiftName: z.string().max(200).optional(),
  safetyScore: z.coerce.number().int().min(0).max(100).optional(),
  qualityScore: z.coerce.number().int().min(0).max(100).optional(),
  productivityScore: z.coerce.number().int().min(0).max(100).optional(),
  teamworkScore: z.coerce.number().int().min(0).max(100).optional(),
  overallScore: z.coerce.number().int().min(0).max(100).default(0),
  issuesReported: z.string().max(2000).optional(),
  suggestions: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
}).passthrough();

export const MaterialReturnSchema = z.object({
  materialId: z.coerce.number().int().optional(),
  materialName: z.string().max(500).default('Unknown'),
  quantity: z.coerce.number().default(1),
  unit: z.string().max(50).default('pcs'),
  performedBy: z.coerce.number().int().default(0),
  reason: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional(),
}).passthrough();

// FE: useIoTTablet.ts reportDowntime mutationFn — POST /api/iot/downtime-events
export const DowntimeEventSchema = z.object({
  sessionId:       z.coerce.number().int().min(1),
  eventType:       z.string().max(100).default('manual_entry'),
  durationMinutes: z.coerce.number().int().min(1).max(480),
  reasonCode:      z.string().max(100),
  notes:           z.string().max(2000).optional(),
});

export const IOT_READ = ['super_admin', 'director', 'production_manager', 'ERP_MANAGER', 'admin', 'technologist'];

/**
 * Helper: coerce the optional workerId field (string|number|undefined) to a
 * numeric workerId, returning 0 for "anonymous panic press".
 */
export function coerceWorkerId(input: unknown): number {
  if (typeof input === 'number') return input;
  if (typeof input === 'string' && /^\d+$/.test(input)) return Number(input);
  return 0;
}
