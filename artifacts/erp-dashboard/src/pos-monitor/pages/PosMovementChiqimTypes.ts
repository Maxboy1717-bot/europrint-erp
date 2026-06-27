
import { tLabel } from '@/lib/i18n/tLabel';
/**
 * @module PosMovementChiqimTypes
 * @description TypeScript interfaces, types, constants, and pure utilities for the
 * scanner-only CHIQIM (outbound) terminal screen (egasi spec 2026-06-27). No JSX.
 *
 * Spec (FAQAT SKANER): skaner → material + jami qoldiq + bo'sh qoldiq (bron ayirilgan) →
 * miqdor (klaviatura/tarozi) → sabab/buyurtma → katta TASDIQ. Bron > 0 → QIZIL ogohlantirish
 * 'bron qilingan, faqat bo'sh qoldiq'; super_admin/direktor override qila oladi.
 */

// ─── Movement type ────────────────────────────────────────────────────────────
// CHIQIM ekrani EXTERNAL_OUT (tashqi chiqim) bilan ishlaydi — terminal bosh-ekran
// CHIQIM=qizil tugmasidan keladi. Boshqa chiqim-yo'nalish turlari (ichki berish/qaytarish/
// ko'chirish/zarar) o'z ekranlariga ega; bu ekran sof material-chiqimga qaratilgan.

export type MovementTypeCode =
  | "EXTERNAL_OUT"
  | "INTERNAL_ISSUE"
  | "INTERNAL_RETURN"
  | "INTERNAL_TRANSFER"
  | "DAMAGE"
  | "LAB_SAMPLE_OUT"
  | "CUSTOMER_MATERIAL";

// ─── Domain shapes ────────────────────────────────────────────────────────────

/**
 * Skanlangan qator — getIssuable javobidan to'ldiriladi. Har qator material + qoldiq
 * (onHand) + bron (reserved) + bo'sh qoldiq (freeStock) ni saqlaydi. Bron > 0 bo'lsa
 * blocked=true; faqat override (super_admin/direktor) bo'sh-qoldiqdan ortiq chiqarishi mumkin.
 */
export interface ScannedLine {
  _key: string;
  barcode: string;
  materialCardId: number;
  materialName: string;
  materialCode: string;
  unit: string;
  warehouseId?: number;
  warehouseCode?: string | null;
  /** Jami ombor qoldig'i. */
  onHand: number;
  /** AI-planning + qo'lda bron yig'indisi (stock_reservations). */
  reserved: number;
  /** Bo'sh (chiqarsa bo'ladigan) qoldiq = onHand − reserved. */
  freeStock: number;
  /** Bron > 0 → CHIQIM blok (faqat override buzadi). */
  blocked: boolean;
  /** Joriy user blokni buza oladimi (super_admin / direktor) — getIssuable.canOverride. */
  canOverride: boolean;
  /** Bron bor qatorda super_admin/direktor blokni buzdi (bo'sh-qoldiqdan ortiq ruxsat). */
  overridden: boolean;
  reservations: ReservationInfo[];
  quantity: number;
}

export interface ReservationInfo {
  reservationId: number;
  reservationNumber: string | null;
  reservedQuantity: number;
  reservedByAi: boolean;
  orderId: number | null;
  orderType: string | null;
}

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "warning";
}

// ─── Chiqim sabab katalogi (spec: chiqim sabab/buyurtmaga bog'lanadi) ──────────
// Sabab → BE notes/returnReason'ga yoziladi (real saqlash, Q-43). "BUYURTMA" tanlansa
// buyurtma raqami matn maydoniga kiritiladi.

export const CHIQIM_REASONS: { code: string; label: string }[] = [
  { code: "PRODUCTION",  label: tLabel('common.PosMovementChiqim.sababIshlabChiqarish', "Ishlab chiqarishga") },
  { code: "ORDER",       label: tLabel('common.PosMovementChiqim.sababBuyurtma', "Buyurtma bo'yicha") },
  { code: "DEPARTMENT",  label: tLabel('common.PosMovementChiqim.sababBolim', "Bo'limga berish") },
  { code: "SALE",        label: tLabel('common.PosMovementChiqim.sababSotuv', "Sotuv / tashqi chiqim") },
  { code: "OTHER",       label: tLabel('common.PosMovementChiqim.sababBoshqa', "Boshqa (izoh majburiy)") },
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

/**
 * Chiqarilmoqchi bo'lgan miqdor bron-blokga zid emasligini tekshiradi.
 * Override yo'q bo'lsa: miqdor ≤ bo'sh qoldiq. Override (super_admin/direktor) bo'lsa:
 * miqdor ≤ jami qoldiq (bronni buzib, lekin mavjuddan ortiq emas).
 */
export function exceedsAllowed(line: ScannedLine): boolean {
  const cap = line.overridden ? line.onHand : line.freeStock;
  return line.quantity > cap;
}
