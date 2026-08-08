/**
 * @module PosMovementChiqimHelpers
 * @description Small reusable UI for scanner-only CHIQIM: ToastContainer, ScanNotFoundModal,
 * NumericKeypad (ekran-klaviatura — tarozi ulanmaganda miqdor kiritish, spec 2026-06-27).
 */

import type { Toast } from "./PosMovementChiqimTypes";
import { useTranslation } from '@/lib/i18n';

// ─── Toast container ──────────────────────────────────────────────────────────

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (!toasts.length) return null;
  return (
    <div style={{
      position: "fixed", top: 72, right: 20, zIndex: 9999,
      display: "flex", flexDirection: "column", gap: 8, maxWidth: 380,
    }}>
      {toasts.map(t => (
        <div
          key={t.id}
          className="pos-slide-in"
          style={{
            background: t.type === "success"
              ? "rgba(16,185,129,0.95)"
              : t.type === "warning"
                ? "rgba(245,158,11,0.95)"
                : "rgba(239,68,68,0.95)",
            color: "#fff", borderRadius: 10, padding: "10px 14px",
            fontSize: 13, fontWeight: 600,
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 10, cursor: "pointer",
          }}
          onClick={() => onDismiss(t.id)}
        >
          <span>{t.message}</span>
          <span style={{ opacity: 0.7, fontSize: 11 }}>✕</span>
        </div>
      ))}
    </div>
  );
}

// ─── Scan-not-found modal ─────────────────────────────────────────────────────

interface ScanNotFoundModalProps {
  barcode: string;
  onClose: () => void;
}

export function ScanNotFoundModal({ barcode, onClose }: ScanNotFoundModalProps) {
  const { t } = useTranslation("common");
  return (
    <div className="pos-modal-overlay" onClick={onClose}>
      <div className="pos-modal" style={{ maxWidth: 380, textAlign: "center", minWidth: 320 }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>🚫</div>
        <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "var(--pos-action-chiqim)" }}>
          {t("barcodeTopilmadiSarlavha", "Barkod topilmadi")}
        </h3>
        <p style={{ color: "var(--pos-text-muted)", fontSize: 13, marginBottom: 20 }}>
          <span className="pos-mono" style={{ color: "var(--pos-text)" }}>{barcode}</span><br />
          {t("buBarcodeTizimdaYoq", "Bu barkod tizimda topilmadi yoki bu omborga tegishli emas.")}
        </p>
        <button
          className="pos-btn"
          style={{ minWidth: 120, justifyContent: "center", background: "var(--pos-action-chiqim)", color: "#fff" }}
          onClick={onClose}
        >
          {t("close2", "Yopish")}
        </button>
      </div>
    </div>
  );
}

// ─── Numeric keypad (ekran-klaviatura) ────────────────────────────────────────
// Spec: tarozi ulangan → avto-og'irlik; ulanmagan → ekran-klaviatura. Bu komponent
// tarozi yo'q holatda katta sensorli tugmalar bilan miqdor kiritadi.

interface NumericKeypadProps {
  value: string;
  onChange: (v: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  unit: string;
  /** Ruxsat etilgan maksimum (bo'sh qoldiq yoki override holatida jami qoldiq). */
  maxAllowed: number;
}

export function NumericKeypad({ value, onChange, onConfirm, onClose, unit, maxAllowed }: NumericKeypadProps) {
  const { t } = useTranslation("common");
  const keys = ["7", "8", "9", "4", "5", "6", "1", "2", "3", ".", "0", "⌫"];

  function press(k: string) {
    if (k === "⌫") { onChange(value.slice(0, -1)); return; }
    if (k === "." && value.includes(".")) return;
    if (k === "." && value === "") { onChange("0."); return; }
    onChange(value + k);
  }

  const num = parseFloat(value || "0");
  const exceeds = num > maxAllowed;

  return (
    <div className="pos-modal-overlay" onClick={onClose}>
      <div className="pos-modal" style={{ maxWidth: 360, minWidth: 320 }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 12, color: "var(--pos-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 }}>
          {t("miqdorKiriting", "Miqdor kiriting")} ({unit})
        </div>
        <div
          className="pos-mono"
          style={{
            fontSize: 34, fontWeight: 700, textAlign: "right", padding: "12px 16px",
            borderRadius: 12, marginBottom: 6,
            background: "rgba(148,163,184,0.10)",
            color: exceeds ? "var(--pos-action-chiqim)" : "var(--pos-text)",
            minHeight: 56,
          }}
        >
          {value || "0"}
        </div>
        <div style={{ fontSize: 11, marginBottom: 12, color: exceeds ? "var(--pos-action-chiqim)" : "var(--pos-text-muted)", fontWeight: 600 }}>
          {t("ruxsatEtilganMax", "Ruxsat etilgan maksimum")}: <span className="pos-mono">{maxAllowed}</span> {unit}
          {exceeds && ` — ${t("chegaradanOshdi", "chegaradan oshdi")}`}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {keys.map(k => (
            <button
              key={k}
              onClick={() => press(k)}
              className="pos-btn"
              style={{
                fontSize: 22, fontWeight: 700, padding: "16px 0", justifyContent: "center",
                background: "rgba(148,163,184,0.12)", color: "var(--pos-text)",
              }}
            >{k}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button className="pos-btn pos-btn-ghost" style={{ flex: 1, justifyContent: "center", padding: "12px 0" }} onClick={onClose}>
            {t("bekorQilish", "Bekor qilish")}
          </button>
          <button
            className="pos-btn"
            style={{ flex: 1, justifyContent: "center", padding: "12px 0", fontSize: 15, background: "var(--pos-action-chiqim)", color: "#fff", opacity: exceeds || num <= 0 ? 0.5 : 1 }}
            disabled={exceeds || num <= 0}
            onClick={onConfirm}
          >
            {t("tasdiqlash", "Tasdiqlash")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reason / order picker ────────────────────────────────────────────────────
// Spec: skan → miqdor → sabab/buyurtma → tasdiq. Sabab katalogdan tanlanadi; ORDER
// tanlansa buyurtma raqami, OTHER tanlansa izoh majburiy.

interface ReasonState {
  reasonCode: string;
  orderRef: string;
  note: string;
}

interface ReasonPickerProps {
  reasons: { code: string; label: string }[];
  value: ReasonState;
  onChange: (v: ReasonState) => void;
}

export function ReasonPicker({ reasons, value, onChange }: ReasonPickerProps) {
  const { t } = useTranslation("common");
  const needsOrder = value.reasonCode === "ORDER";
  const needsNote = value.reasonCode === "OTHER";

  return (
    <div>
      <label style={{ fontSize: 11, color: "var(--pos-text-muted)", fontWeight: 600, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.3 }}>
        {t("chiqimSababi", "Chiqim sababi / buyurtma")}
      </label>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: needsOrder || needsNote ? 10 : 0 }}>
        {reasons.map(r => (
          <button
            key={r.code}
            onClick={() => onChange({ ...value, reasonCode: r.code })}
            style={{
              padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              cursor: "pointer", border: "none", transition: "all 0.15s",
              background: value.reasonCode === r.code ? "var(--pos-action-chiqim)" : "rgba(148,163,184,0.12)",
              color: value.reasonCode === r.code ? "#fff" : "var(--pos-text-muted)",
            }}
          >{r.label}</button>
        ))}
      </div>
      {needsOrder && (
        <input
          className="pos-input"
          value={value.orderRef}
          onChange={e => onChange({ ...value, orderRef: e.target.value })}
          placeholder={t("buyurtmaRaqamiKiriting", "Buyurtma raqamini kiriting")}
        />
      )}
      {needsNote && (
        <textarea
          className="pos-input"
          rows={2}
          value={value.note}
          onChange={e => onChange({ ...value, note: e.target.value })}
          placeholder={t("sababniIzohlang", "Sababni izohlang (majburiy)")}
          style={{ resize: "vertical" }}
        />
      )}
    </div>
  );
}

export type { ReasonState };

// Sahifa uchun barqaror boshlang'ich sabab holati.
export function initialReason(): ReasonState {
  return { reasonCode: "PRODUCTION", orderRef: "", note: "" };
}
