/**
 * @module useIoTTabletTypes
 * @description Shared constants, literal types, and the OfflineAction type used
 * across all IoT-tablet sub-hooks. No React imports — pure TypeScript.
 */

import { AlertTriangle, Package, Wrench, Coffee, Settings, Clock, Zap } from "lucide-react";

// ---------------------------------------------------------------------------
// Icon map for downtime reason codes
// ---------------------------------------------------------------------------

export const REASON_ICONS: Record<string, typeof AlertTriangle> = {
  material_shortage: Package,
  machine_breakdown: Wrench,
  break: Coffee,
  setup: Settings,
  quality_issue: AlertTriangle,
  shift_change: Clock,
  power_outage: Zap,
};

// ---------------------------------------------------------------------------
// Offline queue
// ---------------------------------------------------------------------------

export const OFFLINE_QUEUE_KEY = "iot_offline_queue";

export type OfflineAction = {
  id: string;
  method: string;
  path: string;
  body?: unknown;
  ts: number;
};

// ---------------------------------------------------------------------------
// QC reminder trigger interval (pieces produced between reminders)
// ---------------------------------------------------------------------------

export const QC_TRIGGER_INTERVAL = 500;

// ---------------------------------------------------------------------------
// Session expiry constant (12 hours in milliseconds)
// ---------------------------------------------------------------------------

export const SESSION_12H_MS = 12 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// SOS alert types
// ---------------------------------------------------------------------------

export type SosType = "equipment" | "health" | "material" | "other";
