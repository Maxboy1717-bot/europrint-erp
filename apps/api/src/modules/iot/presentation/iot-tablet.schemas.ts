/**
 * @module iot-tablet.schemas
 * @description Zod schemas + role constants for IotTabletController. Extracted
 *   to keep the controller file under the 300-line cap (Rule 16).
 */

import { z } from 'zod';

export const IotPassthroughSchema = z.record(z.unknown());

// VISION-3340 #38 (IoT-tablet idempotency): an offline tablet re-submitting a
// defect / inline-QC / material-return after a network retry must not double-apply
// the mutation. When the tablet supplies BOTH a stable tablet_id and a monotonic
// per-tablet local_seq_no, the endpoint probes for an already-persisted row with
// that pair and returns an idempotent success instead of re-inserting. Both fields
// are OPTIONAL — omitting either preserves the exact pre-existing behaviour.
export const TabletIdempotencyFields = {
  tabletId:   z.string().max(120).optional(),
  localSeqNo: z.coerce.number().int().nonnegative().optional(),
};

export const StopSessionSchema = z.object({
  runningTimeSeconds: z.coerce.number().int().min(0).optional(),
  actualQuantity:     z.coerce.number().int().min(0).optional(),
}).passthrough();

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
  // The live tablet FE (useIoTTablet.createSession) sends these canonical names, but the
  // schema declared only orderId/machineId, so productionOrderId/equipmentId/targetQuantity
  // were dropped and the INSERT hardcoded 0/0 + derived the order from the absent orderId.
  // That fed MesCompletedEvent(ppId=0) (orphan QC), a 0 target (broken OEE/completion), and
  // no machine attribution. Accept them + keep orderId/machineId as back-compat aliases.
  productionOrderId: z.union([z.string(), z.number()]).optional(),
  equipmentId:       z.union([z.string(), z.number()]).optional(),
  targetQuantity:    z.union([z.string(), z.number()]).optional(),
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
  // The live tablet FE (useIoTTablet.reportDefect) sends `quantity` + `reason`, but the schema
  // only read defectCount (with .default(1)) + reasonDescription — so the operator's real count
  // was dropped and EVERY defect was recorded as 1 (and propagated to qc_defects as 1). Accept
  // the FE aliases; drop the default so the controller can resolve defectCount ?? quantity ?? 1.
  defectCount: z.coerce.number().int().min(0).optional(),
  quantity: z.coerce.number().int().min(0).optional(),
  eventType: z.string().max(50).default('defect'),
  reasonCode: z.string().max(100).optional(),
  reasonDescription: z.string().max(1000).optional(),
  reason: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional(),
  ...TabletIdempotencyFields,
}).passthrough();

export const InlineQcSchema = z.object({
  sampleSize: z.coerce.number().int().min(1).default(1),
  defectCount: z.coerce.number().int().min(0).default(0),
  passRate: z.coerce.number().int().min(0).max(100).optional(),
  notes: z.string().max(2000).optional(),
  ...TabletIdempotencyFields,
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
  // SB0304/SB0324: outgoing operator's digital signature — FE (useIoTTablet.ts
  // submitHandover) has always sent this field; the BE previously dropped it
  // (Zod stripped it via `.passthrough()` not covering INSERT, and the INSERT
  // itself omitted the column) so shift_handovers.signature_data stayed NULL
  // even though the tablet UI required signing before submit. Required here
  // because the FE already treats an empty signature as a client error.
  signatureData: z.string().min(1).max(2000),
  status: z.string().max(50).default('pending'),
}).passthrough();

// VISION-3340 #16: optional LOT/batch link — when the tablet scan resolves a
// material_batches.id (e.g. from a batch barcode), the scan endpoint persists it
// onto material_kit_items.batch_id and decrements that batch's remaining_quantity
// (IotTabletController.scanMaterialKitItem/patchScanMaterialKitItem). Omitted =
// scan behaves exactly as before (no batch link, no stock decrement).
export const MaterialKitScanSchema = z.object({
  scannedBy: z.coerce.number().int().optional(),
  batchId: z.coerce.number().int().positive().optional(),
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
  ...TabletIdempotencyFields,
}).passthrough();

// FE: useIoTTablet.ts reportDowntime mutationFn — POST /api/iot/downtime-events
export const DowntimeEventSchema = z.object({
  sessionId:       z.coerce.number().int().min(1),
  eventType:       z.string().max(100).default('manual_entry'),
  durationMinutes: z.coerce.number().int().min(1).max(480),
  reasonCode:      z.string().max(100),
  // VISION-3340 #44 (08-mes#10): optional link to the LIVE mes_downtime_reasons
  // catalog. When the operator picks a reason from the live list (not a hardcoded
  // dictionary) the tablet resolves its mes_downtime_reasons.id and sends it here;
  // the endpoint then persists downtime_events.reason_code_id so root-cause stats
  // can group by reason_code_id. Omitted => free-text reason_code only,
  // reason_code_id NULL — exact pre-existing behaviour.
  reasonId:        z.coerce.number().int().positive().optional(),
  notes:           z.string().max(2000).optional(),
});

// SB0304/SB0324/SB0349: receiving operator's 2nd signature that flips a
// shift_handovers row from 'pending' to 'completed' (see
// IotTabletController.acceptTabletHandover).
export const AcceptHandoverSchema = z.object({
  receivedBy: z.coerce.number().int().min(1),
  signatureData: z.string().min(1).max(2000),
});

export const CrewSchema = z.object({
  masterId:    z.coerce.number().int().nullable().optional(),
  polmasterId: z.coerce.number().int().nullable().optional(),
  shogirdId:   z.coerce.number().int().nullable().optional(),
  roklerId:    z.coerce.number().int().nullable().optional(),
}).passthrough();

// VISION-3340 #45 (08-mes#8): the tablet marks one setup-checklist item done.
// `completedBy` is the operator id (optional — the tablet may omit it and let the
// server store NULL; it is not required to satisfy the gate, only to record who ticked).
export const ChecklistItemCompleteSchema = z.object({
  completedBy: z.coerce.number().int().positive().optional(),
}).passthrough();

// VISION-3340 #45 (08-mes#8): fixed TB-safety / smena-readiness item set seeded for a
// production session so the (already fail-closed) start gate — checklist_items JOIN
// setup_checklists — becomes satisfiable. These are STRUCTURAL safety-readiness labels
// (not owner business master-data), so a fixed default set is correct; they are stored
// in Uzbek and the tablet FE localises them via t() when rendering. Every item is
// REQUIRED — the gate blocks session start until each one is completed.
export const SETUP_CHECKLIST_DEFAULT_ITEMS: ReadonlyArray<{
  category: string;
  itemType: string;
  title: string;
}> = [
  { category: 'safety',   itemType: 'machine_clean',  title: 'Mashina tozaligi tekshirildi' },
  { category: 'safety',   itemType: 'ppe',            title: 'Himoya vositalari (PPE) kiyilgan' },
  { category: 'material', itemType: 'material_ready', title: 'Material tayyor va joyida' },
  { category: 'setup',    itemType: 'die_mounted',    title: "Qolip / shtamp o'rnatilgan" },
];

export const IOT_READ = ['super_admin', 'director', 'production_manager', 'technologist'];

/**
 * Helper: coerce the optional workerId field (string|number|undefined) to a
 * numeric workerId, returning 0 for "anonymous panic press".
 */
export function coerceWorkerId(input: unknown): number {
  if (typeof input === 'number') return input;
  if (typeof input === 'string' && /^\d+$/.test(input)) return Number(input);
  return 0;
}
