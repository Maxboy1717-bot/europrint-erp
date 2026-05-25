/**
 * @module PosMovementChiqimModal.types
 * @description Types, constants and pure helpers for PosMovementChiqimModal.
 * Split out of PosMovementChiqimModal.tsx to respect the 300-line file budget.
 */

export type MovementTypeCode =
  | "EXTERNAL_OUT"
  | "INTERNAL_ISSUE"
  | "INTERNAL_RETURN"
  | "INTERNAL_TRANSFER"
  | "DAMAGE";

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
  currentQty?: number;
  availableQty?: number;
  materialType?: string;
  unitPrice?: number;
  lastPrice?: number;
  batchId?: number;
  batchNumber?: string;
}

export interface ModalProps {
  movementType: MovementTypeCode;
  fromWarehouseId?: string;
  onClose: () => void;
  onSuccess: (movementId: number) => void;
}

export const TYPE_LABELS: Record<MovementTypeCode, string> = {
  EXTERNAL_OUT:      "Tashqi chiqim",
  INTERNAL_ISSUE:    "Ichki berish",
  INTERNAL_RETURN:   "Ichki qaytarish",
  INTERNAL_TRANSFER: "Ichki ko'chirish",
  DAMAGE:            "Zarar",
};

export const TYPE_COLORS: Record<MovementTypeCode, string> = {
  EXTERNAL_OUT:      "#EF4444",
  INTERNAL_ISSUE:    "#F59E0B",
  INTERNAL_RETURN:   "#06B6D4",
  INTERNAL_TRANSFER: "#8B5CF6",
  DAMAGE:            "#DC2626",
};

let _keyCounter = 0;
export function mkKey(): string { return `cm-${++_keyCounter}`; }

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
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    /* noop */
  }
}
