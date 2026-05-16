
import { tLabel } from '@/lib/i18n/tLabel';
/** @module PosMovementChiqimTypes @description TypeScript interfaces, types, constants, and pure utilities for PosMovementChiqim. No JSX. */

// ─── Movement type ────────────────────────────────────────────────────────────

export type MovementTypeCode =
  | "EXTERNAL_OUT"
  | "INTERNAL_ISSUE"
  | "INTERNAL_RETURN"
  | "INTERNAL_TRANSFER"
  | "DAMAGE";

// ─── Domain shapes ────────────────────────────────────────────────────────────

export interface ScannedLine {
  _key: string;
  barcode: string;
  materialCardId: number;
  materialName: string;
  materialCode: string;
  availableQty: number;
  materialType: "asset" | "consumable";
  quantity: number;
  unitPrice: number;
  batchId?: number;
  batchNumber?: string;
}

export interface BarcodeResult {
  id?: number;
  materialCardId?: number;
  name?: string;
  nameUz?: string;
  code?: string;
  sku?: string;
  unit?: string;
  currentQty?: number;
  availableQty?: number;
  materialType?: string;
  unitPrice?: number;
  lastPrice?: number;
  batchId?: number;
  batchNumber?: string;
}

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "warning";
}

export interface EmployeeSuggestion {
  id: number;
  name: string;
  position?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const MOVEMENT_TYPES: { code: MovementTypeCode; label: string; color: string }[] = [
  { code: "EXTERNAL_OUT",      label: "Tashqi chiqim",   color: "#EF4444" },
  { code: "INTERNAL_ISSUE",    label: "Ichki berish",     color: "#F59E0B" },
  { code: "INTERNAL_RETURN",   label: tLabel('common.PosMovementChiqim.ichkiQaytarish', "Ichki qaytarish"),  color: "#06B6D4" },
  { code: "INTERNAL_TRANSFER", label: tLabel('common.PosMovementChiqim.ichkiKochirish', "Ichki ko'chirish"), color: "#8B5CF6" },
  { code: "DAMAGE",            label: tLabel('common.PosMovementChiqim.zarar', "Zarar"),            color: "#DC2626" },
];

// ─── Pure utilities ───────────────────────────────────────────────────────────

let _keyCounter = 0;
export function mkKey(): string { return `cl-${++_keyCounter}`; }

export function playBeep(success: boolean): void {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = success ? 880 : 220;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + (success ? 0.25 : 0.4),
    );
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + (success ? 0.25 : 0.4));
  } catch { /* noop */ }
}
