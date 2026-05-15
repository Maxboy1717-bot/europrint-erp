/**
 * @module PosMovementChiqimModal.sections
 * @description Inline section components for PosMovementChiqimModal:
 *   ScanZone, NoStockAlert, SuccessPanel, Footer, Header.
 *   LinesList moved to `.lines.tsx`, ContextFields to `.fields.tsx`.
 *   Split out of PosMovementChiqimModal.tsx to respect the 300-line budget.
 */

import type { MovementTypeCode } from "./PosMovementChiqimModal.types";
import { TYPE_LABELS } from "./PosMovementChiqimModal.types";

export function NoStockAlert({
  matName,
  t,
  onClose,
}: {
  matName: string;
  t: (k: string) => string;
  onClose: () => void;
}) {
  return (
    <div className="pos-modal-overlay" style={{ zIndex: 9998 }} onClick={onClose}>
      <div
        className="pos-modal"
        style={{ maxWidth: 340, textAlign: "center" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 44, marginBottom: 10 }}>🚫</div>
        <div style={{ fontWeight: 700, color: "var(--pos-danger)", fontSize: 16, marginBottom: 8 }}>
          {t("qoldiqYoq")}
        </div>
        <div style={{ color: "var(--pos-text-muted)", fontSize: 13, marginBottom: 16 }}>
          <strong>{matName}</strong> {t("ombordaQoldiqYoq")}
        </div>
        <button className="pos-btn pos-btn-danger" onClick={onClose}>OK</button>
      </div>
    </div>
  );
}

export function ModalHeader({
  movementType,
  color,
  t,
  onClose,
}: {
  movementType: MovementTypeCode;
  color: string;
  t: (k: string) => string;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        padding: "16px 20px",
        borderBottom: "1px solid var(--pos-border)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 20 }}>📤</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{t("tezkorChiqim")}</div>
        <div style={{ fontSize: 11, color: "var(--pos-text-muted)" }}>
          {t("barcodeSkanerOrqali")}
        </div>
      </div>
      <span
        className="pos-badge"
        style={{ background: `${color}18`, color, fontSize: 11, marginLeft: 8 }}
      >
        {TYPE_LABELS[movementType]}
      </span>
      <button
        className="pos-btn pos-btn-ghost"
        style={{ marginLeft: "auto", padding: "4px 8px" }}
        onClick={onClose}
      >
        ✕
      </button>
    </div>
  );
}

export function ScanZone({
  scanning,
  scanFlash,
  fromWarehouseId,
  onOpenCamera,
  t,
}: {
  scanning: boolean;
  scanFlash: "success" | "error" | null;
  fromWarehouseId: string;
  onOpenCamera: () => void;
  t: (k: string) => string;
}) {
  return (
    <div
      style={{
        background: "var(--ep-primary)",
        borderRadius: 12,
        minHeight: 120,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        border: `2px solid ${
          scanFlash === "success"
            ? "var(--pos-success)"
            : scanFlash === "error"
              ? "var(--pos-danger)"
              : "rgba(59,130,246,0.3)"
        }`,
        transition: "border-color 0.15s",
        boxShadow:
          scanFlash === "success"
            ? "0 0 20px rgba(16,185,129,0.20)"
            : scanFlash === "error"
              ? "0 0 20px rgba(239,68,68,0.20)"
              : undefined,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 30,
          right: 30,
          height: 2,
          background:
            "linear-gradient(90deg, transparent, rgba(59,130,246,0.8), rgba(59,130,246,1), rgba(59,130,246,0.8), transparent)",
          boxShadow: "0 0 6px rgba(59,130,246,0.5)",
          animation: "chiqim-modal-beam 2s ease-in-out infinite",
        }}
      />
      <div style={{ textAlign: "center", color: "rgba(255,255,255,0.8)", zIndex: 1, padding: "20px 0" }}>
        <div style={{ fontSize: 32, marginBottom: 6 }}>{scanning ? "⏳" : "📷"}</div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>
          {scanning ? "Skanerlanyapti..." : "Barcode skanerlang yoki kamerani oching"}
        </div>
        {!fromWarehouseId && (
          <div style={{ fontSize: 11, color: "rgba(255,200,0,0.8)", marginTop: 4 }}>
            {t("manbaOmboriniKiriting")}
          </div>
        )}
      </div>
      <button
        className="pos-btn pos-btn-primary"
        style={{ position: "absolute", right: 12, bottom: 12, fontSize: 12 }}
        disabled={!fromWarehouseId}
        onClick={onOpenCamera}
      >
        {t("kamera")}
      </button>
    </div>
  );
}

export function SuccessPanel({
  done,
  onClose,
  t,
}: {
  done: { id: number; documentNumber?: string };
  onClose: () => void;
  t: (k: string) => string;
}) {
  return (
    <div
      style={{
        background: "rgba(16,185,129,0.08)",
        border: "1px solid rgba(16,185,129,0.3)",
        borderRadius: 10,
        padding: "16px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
      <div style={{ fontWeight: 700, color: "var(--pos-success)", fontSize: 15, marginBottom: 4 }}>
        {t("chiqimYaratildi")}
      </div>
      {done.documentNumber && (
        <div className="pos-mono" style={{ fontSize: 13, color: "var(--pos-text-muted)", marginBottom: 12 }}>
          {done.documentNumber}
        </div>
      )}
      <button className="pos-btn pos-btn-success" onClick={onClose}>
        {t("close2")}
      </button>
    </div>
  );
}

export function ModalFooter({
  submitting,
  linesEmpty,
  onCancel,
  onDraft,
  onSubmit,
  t,
}: {
  submitting: boolean;
  linesEmpty: boolean;
  onCancel: () => void;
  onDraft: () => void;
  onSubmit: () => void;
  t: (k: string) => string;
}) {
  return (
    <div
      style={{
        padding: "12px 20px",
        borderTop: "1px solid var(--pos-border)",
        display: "flex",
        gap: 10,
        justifyContent: "flex-end",
        flexShrink: 0,
        background: "var(--pos-card)",
      }}
    >
      <button className="pos-btn pos-btn-ghost" onClick={onCancel} disabled={submitting}>
        {t("cancel")}
      </button>
      <button
        className="pos-btn pos-btn-ghost"
        style={{ minWidth: 130, justifyContent: "center" }}
        disabled={submitting || linesEmpty}
        onClick={onDraft}
      >
        {submitting ? "⏳..." : "💾 Qoralama"}
      </button>
      <button
        className="pos-btn pos-btn-danger"
        style={{ minWidth: 130, justifyContent: "center" }}
        disabled={submitting || linesEmpty}
        onClick={onSubmit}
      >
        {submitting ? "⏳ Yuborilmoqda..." : "🚀 Yuborish"}
      </button>
    </div>
  );
}
