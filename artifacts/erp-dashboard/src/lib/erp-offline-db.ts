/**
 * @module erp-offline-db
 * @description Frontend utility / library module.
 */

import Dexie, { type Table } from "dexie";

/* ════════════════════════════════════════════════════════════════
   FLOW 2 — QC Golden-Sample Cache + Deferred Vision Recheck
   ════════════════════════════════════════════════════════════════ */
export interface QcGoldenSample {
  id:              string;
  productCode:     string;
  imageUrl:        string;
  labL:            number;
  labA:            number;
  labB:            number;
  toleranceDeltaE: number;
  schemaVersion:   number;
  cachedAt:        number;
}

export interface QcDeferredRecheck {
  id?:            number;
  localId:        string;
  workOrderId:    string;
  imageUrl:       string;
  goldenSampleId: string;
  offlineVerdict: "PASS" | "REWORK" | "SCRAP";
  offlineDeltaE:  number;
  capturedAt:     number;
  synced:         boolean;
  serverVerdict?: "PASS" | "REWORK" | "SCRAP";
  syncError?:     string;
}

/* ════════════════════════════════════════════════════════════════
   FLOW 3 — POS Movement Sync with Vector Clocks
   ════════════════════════════════════════════════════════════════
   Vector clock: { deviceId: string, counter: number }[]
   Last-write-wins with vector clock comparison for conflict detection.
   ════════════════════════════════════════════════════════════════ */
export interface VectorClock {
  deviceId: string;
  counter:  number;
}

export interface PosMovement {
  id?:          number;
  localId:      string;
  deviceId:     string;
  productId:    number;
  type:         "SALE" | "RETURN" | "ADJUSTMENT" | "TRANSFER";
  qty:          number;
  unitPrice:    number;
  totalAmount:  number;
  clockVector:  VectorClock[];
  wallClock:    number;
  synced:       boolean;
  conflicted:   boolean;
  serverSyncId?: number;
  syncError?:   string;
}

/* ════════════════════════════════════════════════════════════════
   FLOW 4 — CRM offline capture (lead + activity)  [vision 13-crm#50]
   ════════════════════════════════════════════════════════════════
   Offline-first for lead + activity CREATE only. KP (kommercheskoye
   predlozheniye / quotation) is intentionally NOT queued here → it stays
   online-only by construction. Conflict policy = server-wins: on reconnect
   each queued create is replayed to its live endpoint and the SERVER's
   canonical record (server-assigned id) is adopted; the local draft is
   marked synced and never overwrites server state.
   `synced` is stored as a NUMBER (0=pending, 1=synced) — IndexedDB cannot
   index booleans, so a numeric flag guarantees the `.where("synced")`
   index query (and the compound `[kind+synced]` index) return pending rows.
   ════════════════════════════════════════════════════════════════ */
export type CrmDraftKind = "lead" | "activity";

export interface CrmOfflineDraft {
  id?:        number;
  localId:    string;
  kind:       CrmDraftKind;
  payload:    Record<string, unknown>;
  capturedAt: number;
  synced:     number;   // 0 = pending, 1 = synced
  serverId?:  number;
  syncError?: string;
}

/* ════════════════════════════════════════════════════════════════
   Dexie database
   ════════════════════════════════════════════════════════════════ */
export class ErpOfflineDatabase extends Dexie {
  qcGoldenSamples!:  Table<QcGoldenSample,      string>;
  qcRecheckQueue!:   Table<QcDeferredRecheck,   number>;
  posMovements!:     Table<PosMovement,          number>;
  crmQueue!:         Table<CrmOfflineDraft,      number>;

  constructor() {
    super("erp_offline_v2");
    this.version(1).stores({
      qcGoldenSamples: "id, productCode, schemaVersion, cachedAt",
      qcRecheckQueue:  "++id, localId, workOrderId, synced, capturedAt",
      posMovements:    "++id, localId, deviceId, synced, conflicted, wallClock",
    });
    // v2: CRM offline capture queue (lead + activity). Dexie carries the v1
    // stores forward automatically; only the new store is declared here.
    this.version(2).stores({
      crmQueue: "++id, localId, kind, synced, capturedAt, [kind+synced]",
    });
  }
}

export const erpDb = new ErpOfflineDatabase();

/* ════════════════════════════════════════════════════════════════
   Vector clock helpers
   ════════════════════════════════════════════════════════════════ */
export function incrementClock(clock: VectorClock[], deviceId: string): VectorClock[] {
  const existing = clock.find((c) => c.deviceId === deviceId);
  if (existing) {
    return clock.map((c) => c.deviceId === deviceId ? { ...c, counter: c.counter + 1 } : c);
  }
  return [...clock, { deviceId, counter: 1 }];
}

export function mergeClock(a: VectorClock[], b: VectorClock[]): VectorClock[] {
  const result = new Map<string, number>();
  for (const { deviceId, counter } of a) result.set(deviceId, counter);
  for (const { deviceId, counter } of b) {
    result.set(deviceId, Math.max(result.get(deviceId) ?? 0, counter));
  }
  return Array.from(result.entries()).map(([deviceId, counter]) => ({ deviceId, counter }));
}

export function happensBefore(a: VectorClock[], b: VectorClock[]): boolean {
  const bMap = new Map(b.map((c) => [c.deviceId, c.counter]));
  let strictlyLess = false;
  for (const { deviceId, counter } of a) {
    const bCounter = bMap.get(deviceId) ?? 0;
    if (counter > bCounter) return false;
    if (counter < bCounter) strictlyLess = true;
  }
  return strictlyLess;
}

export function detectConflict(a: PosMovement, b: PosMovement): boolean {
  return !happensBefore(a.clockVector, b.clockVector) &&
         !happensBefore(b.clockVector, a.clockVector);
}

/* ════════════════════════════════════════════════════════════════
   Flow 2 helpers — QC Golden-Sample Cache
   ════════════════════════════════════════════════════════════════ */
export async function cacheGoldenSample(sample: QcGoldenSample): Promise<void> {
  await erpDb.qcGoldenSamples.put(sample);
}

export async function getGoldenSample(productCode: string): Promise<QcGoldenSample | undefined> {
  const results = await erpDb.qcGoldenSamples.where("productCode").equals(productCode).sortBy("schemaVersion");
  return results[results.length - 1];
}

export function calcDeltaEOffline(
  sample: QcGoldenSample,
  measured: { L: number; a: number; b: number },
): number {
  const dL = sample.labL - measured.L;
  const dA = sample.labA - measured.a;
  const dB = sample.labB - measured.b;
  return Math.sqrt(dL * dL + dA * dA + dB * dB);
}

export async function queueVisionRecheck(
  recheck: Omit<QcDeferredRecheck, "id" | "synced" | "capturedAt">,
): Promise<void> {
  await erpDb.qcRecheckQueue.add({ ...recheck, synced: false, capturedAt: Date.now() });
}

export async function syncQcRecheckQueue(
  apiPost: (path: string, body: unknown) => Promise<{ verdict?: string }>,
): Promise<{ success: number; failed: number }> {
  const pending = await erpDb.qcRecheckQueue.where("synced").equals(0).toArray();
  let success = 0; let failed = 0;
  for (const item of pending) {
    try {
      const golden = await erpDb.qcGoldenSamples.get(item.goldenSampleId);
      const colorTargets = golden
        ? [{ L: golden.labL, a: golden.labA, b: golden.labB }]
        : [];
      const res = await apiPost("/ai-agents/qc/vision-analyze", {
        workOrderId:  item.workOrderId,
        imageUrl:     item.imageUrl,
        colorTargets,
      });
      await erpDb.qcRecheckQueue.update(item.id!, {
        synced:        true,
        serverVerdict: res?.verdict as QcDeferredRecheck["serverVerdict"],
      });
      success++;
    } catch (err) {
      await erpDb.qcRecheckQueue.update(item.id!, { syncError: err instanceof Error ? err.message : String(err) });
      failed++;
    }
  }
  return { success, failed };
}

/* ════════════════════════════════════════════════════════════════
   Flow 3 helpers — POS Movement sync with vector clocks
   ════════════════════════════════════════════════════════════════ */
export async function recordMovement(
  movement: Omit<PosMovement, "id" | "synced" | "conflicted" | "clockVector" | "wallClock">,
  deviceId: string,
): Promise<void> {
  const recent = await erpDb.posMovements
    .where("productId").equals(movement.productId)
    .and((m) => !m.synced)
    .reverse()
    .first();

  const baseClock = recent?.clockVector ?? [];
  const clock     = incrementClock(baseClock, deviceId);

  await erpDb.posMovements.add({
    ...movement,
    clockVector: clock,
    wallClock:   Date.now(),
    synced:      false,
    conflicted:  false,
  });
}

const POS_SYNC_MAX_RETRIES = 5;

export async function syncPosMovements(
  apiPost: (path: string, body: unknown) => Promise<{ accepted?: number; conflicts?: string[] }>,
): Promise<{ success: number; failed: number; conflicts: number }> {
  const pending = await erpDb.posMovements
    .where("synced").equals(0)
    .sortBy("wallClock");

  if (pending.length === 0) return { success: 0, failed: 0, conflicts: 0 };

  const movements = pending.map((mv) => ({
    localId:     mv.localId,
    deviceId:    mv.deviceId,
    productId:   mv.productId,
    type:        mv.type,
    qty:         mv.qty,
    unitPrice:   mv.unitPrice,
    totalAmount: mv.totalAmount,
    clockVector: mv.clockVector,
    wallClock:   mv.wallClock,
  }));

  let lastErr: unknown;
  for (let attempt = 0; attempt < POS_SYNC_MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise<void>((res) => setTimeout(res, Math.min(1000 * 2 ** (attempt - 1), 16000)));
    }
    try {
      const res = await apiPost("/pos/sync/push", {
        clientUuid:       crypto.randomUUID(),
        terminalId:       pending[0]?.deviceId ?? "offline",
        offlineCreatedAt: new Date(pending[0]?.wallClock ?? Date.now()).toISOString(),
        movements,
      });
      const conflictSet = new Set((Array.isArray(res?.conflicts) ? res?.conflicts : []).map(String));
      let success = 0; let conflicts = 0;
      for (const mv of pending) {
        if (conflictSet.has(String(mv.localId))) {
          await erpDb.posMovements.update(mv.id!, { conflicted: true });
          conflicts++;
        } else {
          await erpDb.posMovements.update(mv.id!, { synced: true });
          success++;
        }
      }
      return { success, failed: 0, conflicts };
    } catch (err) {
      lastErr = err;
    }
  }

  const errMsg = lastErr instanceof Error ? lastErr.message : String(lastErr);
  for (const mv of pending) {
    await erpDb.posMovements.update(mv.id!, { syncError: errMsg });
  }
  return { success: 0, failed: pending.length, conflicts: 0 };
}

/* ════════════════════════════════════════════════════════════════
   Flow 4 helpers — CRM offline capture (lead + activity)  [13-crm#50]
   ════════════════════════════════════════════════════════════════ */
const CRM_ENDPOINT_BY_KIND: Record<CrmDraftKind, string> = {
  lead:     "/crm/leads",
  activity: "/crm/activities",
};

/** Enqueue an offline CRM create. `payload` is the exact request body that will
 *  be replayed to the live create endpoint on reconnect. Returns the localId. */
export async function queueCrmDraft(
  kind: CrmDraftKind,
  payload: Record<string, unknown>,
): Promise<string> {
  const localId = crypto.randomUUID();
  await erpDb.crmQueue.add({ localId, kind, payload, capturedAt: Date.now(), synced: 0 });
  return localId;
}

export function queueCrmLead(payload: Record<string, unknown>): Promise<string> {
  return queueCrmDraft("lead", payload);
}

export function queueCrmActivity(payload: Record<string, unknown>): Promise<string> {
  return queueCrmDraft("activity", payload);
}

/** Replay every pending CRM draft to its live endpoint (oldest first).
 *  Server-wins (vision 13-crm#50): the server's returned id is adopted as
 *  canonical and the draft is marked synced; a failed replay keeps the draft
 *  (with syncError) for the next attempt and is never force-pushed over the
 *  server. */
export async function syncCrmQueue(
  apiPost: (path: string, body: unknown) => Promise<unknown>,
): Promise<{ success: number; failed: number }> {
  const pending = await erpDb.crmQueue.where("synced").equals(0).sortBy("capturedAt");
  let success = 0; let failed = 0;
  for (const item of pending) {
    try {
      const res = await apiPost(CRM_ENDPOINT_BY_KIND[item.kind], item.payload);
      const serverId = (res as { id?: unknown })?.id;
      await erpDb.crmQueue.update(item.id!, {
        synced:    1,
        serverId:  typeof serverId === "number" ? serverId : undefined,
        syncError: undefined,
      });
      success++;
    } catch (err) {
      await erpDb.crmQueue.update(item.id!, { syncError: err instanceof Error ? err.message : String(err) });
      failed++;
    }
  }
  return { success, failed };
}

/* ════════════════════════════════════════════════════════════════
   Summary counts
   ════════════════════════════════════════════════════════════════ */
export async function getPendingSyncCount(): Promise<{
  qcRechecks:    number;
  posMovements:  number;
  conflicts:     number;
  crmLeads:      number;
  crmActivities: number;
}> {
  const [qcRechecks, posMovements, conflicts, crmLeads, crmActivities] = await Promise.all([
    erpDb.qcRecheckQueue.where("synced").equals(0).count(),
    erpDb.posMovements.where("synced").equals(0).count(),
    erpDb.posMovements.where("conflicted").equals(1).count(),
    erpDb.crmQueue.where("[kind+synced]").equals(["lead", 0]).count(),
    erpDb.crmQueue.where("[kind+synced]").equals(["activity", 0]).count(),
  ]);
  return { qcRechecks, posMovements, conflicts, crmLeads, crmActivities };
}
