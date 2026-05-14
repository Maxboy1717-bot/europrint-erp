/**
 * @module erp-offline-db
 * @description Frontend utility / library module.
 */

import Dexie, { type Table } from "dexie";

/* ════════════════════════════════════════════════════════════════
   FLOW 1 — Order Draft (oflayn buyurtma qoralamasi)
   ════════════════════════════════════════════════════════════════ */
export interface OrderDraft {
  id?:             number;
  localId:         string;
  customerName:    string;
  customerId?:     number;
  items:           Array<{ productName: string; qty: number; unitPrice: number }>;
  totalAmount:     number;
  note?:           string;
  formStep:        number;
  lastSavedAt:     number;
  synced:          boolean;
  syncedOrderId?:  number;
  syncError?:      string;
}

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
   Dexie database
   ════════════════════════════════════════════════════════════════ */
export class ErpOfflineDatabase extends Dexie {
  orderDrafts!:      Table<OrderDraft,          number>;
  qcGoldenSamples!:  Table<QcGoldenSample,      string>;
  qcRecheckQueue!:   Table<QcDeferredRecheck,   number>;
  posMovements!:     Table<PosMovement,          number>;

  constructor() {
    super("erp_offline_v2");
    this.version(1).stores({
      orderDrafts:     "++id, localId, synced, lastSavedAt",
      qcGoldenSamples: "id, productCode, schemaVersion, cachedAt",
      qcRecheckQueue:  "++id, localId, workOrderId, synced, capturedAt",
      posMovements:    "++id, localId, deviceId, synced, conflicted, wallClock",
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
   Flow 1 helpers — Order Drafts
   ════════════════════════════════════════════════════════════════ */
export async function saveOrderDraft(draft: Omit<OrderDraft, "id" | "synced" | "lastSavedAt">): Promise<number> {
  const existing = await erpDb.orderDrafts.where("localId").equals(draft.localId).first();
  const data = { ...draft, synced: false, lastSavedAt: Date.now() };
  if (existing?.id) {
    await erpDb.orderDrafts.update(existing.id, data);
    return existing.id;
  }
  return erpDb.orderDrafts.add(data as OrderDraft);
}

export async function syncOrderDrafts(
  apiPost: (path: string, body: unknown) => Promise<{ id?: number }>,
): Promise<{ success: number; failed: number }> {
  const pending = await erpDb.orderDrafts.where("synced").equals(0).toArray();
  let success = 0; let failed = 0;
  for (const draft of pending) {
    try {
      const res = await apiPost("/order-workflow/orders", {
        customerId:   draft.customerId ?? null,
        totalAmount:  draft.totalAmount,
        currency:     "UZS",
      });
      await erpDb.orderDrafts.update(draft.id!, { synced: true, syncedOrderId: res?.id });
      success++;
    } catch (err) {
      await erpDb.orderDrafts.update(draft.id!, { syncError: err instanceof Error ? err.message : String(err) });
      failed++;
    }
  }
  return { success, failed };
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
   Summary counts
   ════════════════════════════════════════════════════════════════ */
export async function getPendingSyncCount(): Promise<{
  orderDrafts: number;
  qcRechecks:  number;
  posMovements: number;
  conflicts:   number;
}> {
  const [orderDrafts, qcRechecks, posMovements, conflicts] = await Promise.all([
    erpDb.orderDrafts.where("synced").equals(0).count(),
    erpDb.qcRecheckQueue.where("synced").equals(0).count(),
    erpDb.posMovements.where("synced").equals(0).count(),
    erpDb.posMovements.where("conflicted").equals(1).count(),
  ]);
  return { orderDrafts, qcRechecks, posMovements, conflicts };
}
