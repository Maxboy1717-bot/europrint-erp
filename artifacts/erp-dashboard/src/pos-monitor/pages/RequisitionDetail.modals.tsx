/**
 * @module RequisitionDetail.modals
 * @description Reject modal and inline timeline for RequisitionDetail.
 * Split out so the parent stays under 300 lines.
 */

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import type { StatusEvent } from "./RequisitionDetail.types";
import { TIMELINE_STEPS, TIMELINE_LABELS } from "./RequisitionDetail.types";

export function RejectModal({
  onClose,
  onSubmit,
  t,
}: {
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  t: (k: string) => string;
}) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function handle() {
    if (!reason.trim()) {
      setErr("Sabab majburiy");
      return;
    }
    setSaving(true);
    try {
      await onSubmit(reason);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pos-modal-overlay">
      <div className="pos-modal" style={{ maxWidth: 440 }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, color: "var(--pos-danger)" }}>
          ✕ {t("requests.reject")}
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: "var(--pos-text-muted)", display: "block", marginBottom: 4 }}>
            {t("radEtishSababi")}
          </label>
          <textarea
            className="pos-input"
            rows={4}
            placeholder={t("sababKiriting")}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{ resize: "vertical" }}
          />
        </div>
        {err && <div style={{ color: "var(--pos-danger)", fontSize: 12, marginBottom: 12 }}>{err}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="pos-btn pos-btn-ghost" onClick={onClose} disabled={saving}>
            {t("common.cancel")}
          </button>
          <button className="pos-btn pos-btn-danger" onClick={() => void handle()} disabled={saving}>
            {saving ? "…" : `✕ ${t("requests.reject")}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export function StatusTimeline({
  currentStatus,
  statusHistory,
}: {
  currentStatus: string;
  statusHistory?: StatusEvent[];
}) {
  const { t } = useTranslation("common");
  const isRejected = currentStatus === "REJECTED" || currentStatus === "CANCELLED";
  const currentIdx = TIMELINE_STEPS.indexOf(currentStatus);

  function getTimestamp(step: string): string | undefined {
    if (!statusHistory) return undefined;
    const ev = statusHistory.find((e) => e.status === step);
    return ev?.timestamp;
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, padding: "20px 0 8px" }}>
      {TIMELINE_STEPS.map((step, idx) => {
        const done = isRejected ? idx === 0 : currentIdx >= idx;
        const current = !isRejected && currentIdx === idx;
        const ts = getTimestamp(step);

        return (
          <div
            key={step}
            style={{
              display: "flex",
              alignItems: "center",
              flex: idx < TIMELINE_STEPS.length - 1 ? 1 : 0,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 80 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 700,
                  background: isRejected && idx > 0
                    ? "rgba(239,68,68,0.10)"
                    : done
                      ? "linear-gradient(135deg,#10B981,#059669)"
                      : "rgba(226,232,240,0.8)",
                  color: isRejected && idx > 0
                    ? "var(--pos-danger)"
                    : done
                      ? "#fff"
                      : "var(--pos-text-muted)",
                  border: current ? "2px solid var(--pos-accent)" : "none",
                  transition: "all 0.3s",
                  boxShadow: done && !isRejected ? "0 2px 8px rgba(16,185,129,0.30)" : "none",
                }}
              >
                {isRejected && idx > 0 ? "✕" : done ? "✓" : idx + 1}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: done ? "var(--pos-text)" : "var(--pos-text-muted)",
                  fontWeight: current ? 700 : 400,
                  textAlign: "center",
                }}
              >
                {TIMELINE_LABELS[step]}
              </div>
              {ts && (
                <div style={{ fontSize: 10, color: "var(--pos-text-muted)" }}>
                  {new Date(ts).toLocaleDateString("uz-UZ")}
                </div>
              )}
            </div>
            {idx < TIMELINE_STEPS.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 3,
                  borderRadius: 2,
                  background: done && !isRejected
                    ? "linear-gradient(90deg,#10B981,#059669)"
                    : "rgba(226,232,240,0.8)",
                  margin: "0 4px",
                  marginBottom: 28,
                }}
              />
            )}
          </div>
        );
      })}

      {isRejected && (
        <div style={{ marginLeft: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "var(--ep-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 16,
            }}
          >
            ✕
          </div>
          <div style={{ fontSize: 11, color: "var(--pos-danger)", fontWeight: 700 }}>
            {t("radEtildi")}
          </div>
        </div>
      )}
    </div>
  );
}
