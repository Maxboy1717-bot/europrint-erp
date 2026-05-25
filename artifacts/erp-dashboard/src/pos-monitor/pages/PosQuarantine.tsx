/**
 * @module PosQuarantine
 * @description React page component. Route-level UI.
 */

import { useState, useEffect, useCallback } from "react";
import { usePosI18n } from "../i18n/usePosI18n";
import { quarantineApi } from "../api/pos-monitor.api";

interface QuarantineItem {
  id: number;
  movementId: number;
  supplierName?: string;
  materialCode?: string;
  quantity: number;
  quarantineStartedAt?: string;
  qcResult?: string;
  certificateNumber?: string;
  waybillNumber?: string;
}

export default function PosQuarantine() {
  const { t } = usePosI18n();
  const [items, setItems] = useState<QuarantineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<QuarantineItem | null>(null);
  const [qcDecision, setQcDecision] = useState<"QABUL" | "REWORK" | "CHIQARISH" | "">("");
  const [qcNote, setQcNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await quarantineApi.getList();
      setItems(Array.isArray(data) ? (data as QuarantineItem[]) : []);
    } catch { setItems([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function handleQcSubmit() {
    if (!selected || !qcDecision) return;
    setSubmitting(true);
    setError("");
    try {
      await quarantineApi.recordQcDecision(selected.movementId, qcDecision, qcNote || undefined);
      setSelected(null);
      setQcDecision("");
      setQcNote("");
      void load();
    } catch (e: unknown) {
      setError((e as Error).message ?? "Xato yuz berdi");
    } finally { setSubmitting(false); }
  }

  function hoursInQuarantine(startedAt?: string): number {
    if (!startedAt) return 0;
    return Math.round((Date.now() - new Date(startedAt).getTime()) / 36e5);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>🔒 {t("quarantine.title")}</h2>
        <div style={{ flex: 1 }} />
        <button className="pos-btn pos-btn-ghost" onClick={() => void load()}>🔄 {t("common.refresh")}</button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--pos-text-muted)" }}>{t("common.loading")}</div>
      ) : items.length === 0 ? (
        <div className="pos-card" style={{ textAlign: "center", padding: 48, color: "var(--pos-text-muted)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{t("quarantine.empty")}</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>{t("quarantine.emptyDesc")}</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map(item => {
            const hours = hoursInQuarantine(item.quarantineStartedAt);
            const urgent = hours >= 48;
            return (
              <div key={item.id} className="pos-card pos-fade-in" style={{ borderLeft: `3px solid ${urgent ? "var(--pos-danger)" : "var(--pos-warning)"}` }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>
                      {urgent ? "🔴" : "🟡"} Harakat #{item.movementId}
                      {item.materialCode && <span style={{ fontSize: 12, color: "var(--pos-text-muted)", marginLeft: 8 }}>({item.materialCode})</span>}
                    </div>
                    <div style={{ display: "flex", gap: 24, marginTop: 8, fontSize: 13, color: "var(--pos-text-muted)", flexWrap: "wrap" }}>
                      {item.supplierName && <span>🏭 {item.supplierName}</span>}
                      {item.waybillNumber && <span>📄 {item.waybillNumber}</span>}
                      <span>📦 {item.quantity} birlik</span>
                      <span style={{ color: urgent ? "var(--pos-danger)" : "var(--pos-warning)", fontWeight: 600 }}>
                        ⏱ {hours} {t("quarantine.hoursInQuarantine")}
                      </span>
                    </div>
                  </div>
                  <button
                    className="pos-btn pos-btn-primary"
                    style={{ flexShrink: 0 }}
                    onClick={() => { setSelected(item); setQcDecision(""); setQcNote(""); setError(""); }}
                  >
                    🔬 {t("quarantine.qcDecision")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QC Qaror Modal */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="pos-card" style={{ width: 480, maxWidth: "90vw" }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
              🔬 {t("quarantine.qcDecision")} — Harakat #{selected.movementId}
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: "var(--pos-text-muted)", marginBottom: 4, display: "block" }}>{t("quarantine.decision")}</label>
              <div style={{ display: "flex", gap: 8 }}>
                {(["QABUL", "REWORK", "CHIQARISH"] as const).map(d => (
                  <button
                    key={d}
                    className={`pos-btn ${qcDecision === d ? "pos-btn-primary" : "pos-btn-ghost"}`}
                    style={{ flex: 1 }}
                    onClick={() => setQcDecision(d)}
                  >
                    {d === "QABUL" ? "✅" : d === "REWORK" ? "🔧" : "❌"} {d}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: "var(--pos-text-muted)", marginBottom: 4, display: "block" }}>{t("quarantine.note")}</label>
              <textarea
                className="pos-input"
                style={{ width: "100%", minHeight: 80, resize: "vertical" }}
                placeholder={t("quarantine.notePlaceholder")}
                value={qcNote}
                onChange={e => setQcNote(e.target.value)}
              />
            </div>

            {error && <div style={{ color: "var(--pos-danger)", fontSize: 13, marginBottom: 12 }}>❌ {error}</div>}

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="pos-btn pos-btn-ghost" onClick={() => setSelected(null)}>{t("common.cancel")}</button>
              <button
                className="pos-btn pos-btn-primary"
                disabled={!qcDecision || submitting}
                onClick={() => void handleQcSubmit()}
              >
                {submitting ? t("common.loading") : t("common.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
