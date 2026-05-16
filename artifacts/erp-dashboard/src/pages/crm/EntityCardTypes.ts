
import { tLabel } from '@/lib/i18n/tLabel';
/**
 * @module EntityCardTypes
 * @description Type definitions, constants, and helpers for EntityCard.
 */

// ── Manba teglari ─────────────────────────────────────────────────────────────
export const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  WEBFORM:  { label: "Web",        color: "#6366f1" },
  TELEGRAM: { label: "TG",         color: "#2EA6FF" },
  CALL:     { label: tLabel('crm.EntityCard.qongiroq', "Qo'ng'iroq"), color: "#10b981" },
  EMAIL:    { label: "Email",      color: "#f59e0b" },
  WEB:      { label: "Sayt",       color: "#8b5cf6" },
  INBOUND:  { label: "Kiruvchi",   color: "#ec4899" },
};

// ── Ustuvorlik konfiguratsiyasi ───────────────────────────────────────────────
export const PRIORITY_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  urgent: { label: "↑ Shoshilinch", bg: "rgba(240,128,128,0.14)", color: "#C05050" },
  high:   { label: "↑ Yuqori",      bg: "rgba(240,128,128,0.12)", color: "#C05050" },
  normal: { label: tLabel('crm.EntityCard.orta', "→ O'rta"),       bg: "rgba(245,201,106,0.14)", color: "#A07020" },
  medium: { label: tLabel('crm.EntityCard.orta', "→ O'rta"),       bg: "rgba(245,201,106,0.14)", color: "#A07020" },
  low:    { label: "↓ Oddiy",       bg: "rgba(109,197,160,0.14)", color: "#2D8060" },
};

// ── Neumorphic soyalar ────────────────────────────────────────────────────────
export const SHADOW_IDLE     = "4px 4px 12px rgba(163,177,198,0.48), -2px -2px 8px rgba(255,255,255,0.80)";
export const SHADOW_HOVER    = "8px 8px 20px rgba(163,177,198,0.60), -4px -4px 12px rgba(255,255,255,0.90)";
export const SHADOW_DRAGGING = "12px 16px 40px rgba(163,177,198,0.55), -4px -4px 16px rgba(255,255,255,0.60)";

// ── Yordamchi funksiyalar ─────────────────────────────────────────────────────
export function hexToRgba(hex: string, alpha: number): string {
  try {
    if (!hex?.startsWith("#") || hex.length < 7) return `rgba(107,114,128,${alpha})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  } catch {
    return `rgba(107,114,128,${alpha})`;
  }
}

export const scoreColor = (s: number) =>
  s >= 70 ? "#6DC5A0" : s >= 40 ? "#F5C96A" : "#F08080";

// ── Re-exported types from crm-types ─────────────────────────────────────────
export type { EntityCardProps, QuickScore, Lead, Deal, Contact, Company, Proposal, Invoice, EntityData } from "./crm-types";
