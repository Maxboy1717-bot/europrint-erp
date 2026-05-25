/**
 * @module PosMyInventoryReturnModal
 * @description Return-item modal dialog for PosMyInventory.
 * Split from PosMyInventory.tsx (Rule 16).
 */

import { useState } from "react";
import { ledgerApi } from "../api/pos-monitor.api";
import type { ReturnModalProps } from "./PosMyInventory.types";

export function ReturnModal({ item, onClose, onDone, t }: ReturnModalProps) {
  const [qty, setQty]       = useState<string>(String(item.balance));
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  async function submit() {
    const q = parseFloat(qty);
    if (!q || q <= 0 || q > item.balance) {
      setError(`Miqdor 0 dan katta va ${item.balance} dan kichik bo'lishi kerak`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await ledgerApi.returnItem({
        movementTypeCode: "INTERNAL_RETURN",
        fromWarehouseId: "employee",
        returnReason: reason || undefined,
        lines: [{ materialId: item.materialId, quantity: q }],
        submit: true,
      });
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pos-modal-overlay">
      <div className="pos-modal" style={{ maxWidth: 480 }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 18 }}>
          📦 {t("myInventory.returnModal")}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 18 }}>
          <div>
            <label style={{ fontSize: 11, color: "var(--pos-text-muted)", display: "block", marginBottom: 4 }}>
              {t("common.name")}
            </label>
            <div
              style={{
                background: "rgba(248,250,252,1)",
                border: "1px solid var(--pos-border)",
                borderRadius: 10,
                padding: "9px 13px",
                fontSize: 14,
                color: "var(--pos-text)",
              }}
            >
              <span className="pos-mono" style={{ fontSize: 12, color: "var(--pos-text-muted)", marginRight: 8 }}>
                {item.materialCode}
              </span>
              {item.materialName}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, color: "var(--pos-text-muted)", display: "block", marginBottom: 4 }}>
              {t("myInventory.givenQty")} (max: {item.balance} {item.unit})
            </label>
            <input
              type="number"
              className="pos-input"
              min={0.001}
              max={item.balance}
              step={0.001}
              value={qty}
              onChange={e => setQty(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, color: "var(--pos-text-muted)", display: "block", marginBottom: 4 }}>
              {t("ledger.returnReason")} ({t("common.notes").toLowerCase()})
            </label>
            <textarea
              className="pos-input"
              rows={3}
              placeholder={t("ixtiyoriyIzoh")}
              value={reason}
              onChange={e => setReason(e.target.value)}
              style={{ resize: "vertical" }}
            />
          </div>

          {error && <div style={{ color: "var(--pos-danger)", fontSize: 12 }}>{error}</div>}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="pos-btn pos-btn-ghost" onClick={onClose} disabled={saving}>
            {t("common.cancel")}
          </button>
          <button className="pos-btn pos-btn-success" onClick={() => void submit()} disabled={saving}>
            {saving ? "…" : `✅ ${t("myInventory.returnButton")}`}
          </button>
        </div>
      </div>
    </div>
  );
}
