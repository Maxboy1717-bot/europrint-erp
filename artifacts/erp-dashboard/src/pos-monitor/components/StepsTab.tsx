import { useState, useEffect, useCallback } from "react";
import { movementsApi } from "../api/pos-monitor.api";

interface Confirmation {
  id: number; movementId: number; step: string; userId: number;
  decision: string; signedAt: string; signatureHash: string; ip?: string; comment?: string;
}
interface HistEntry { id: number; fromStatus: string; toStatus: string; changedAt: string; comment?: string; }

const DECISION_BADGE: Record<string, string> = {
  APPROVED: "pos-badge-green", REJECTED: "pos-badge-red", REWORK: "pos-badge-yellow", PENDING: "pos-badge-gray",
};
const DECISION_ICON: Record<string, string> = { APPROVED: "✅", REJECTED: "❌", REWORK: "🔄", PENDING: "⏳" };
const STEP_LABEL: Record<string, string> = {
  draft: "Qoralama", qc_pending: "QC Tekshiruvi", qc_approved: "QC Tasdiq",
  pending: "Moliya Tasdiq", approved: "Tasdiqlandi", completed: "Yakunlandi",
  cancelled: "Bekor", finance: "Moliya", warehouse: "Ombor", qc: "QC", manager: "Menejer",
};

function hashShort(h: string): string { return h.length > 12 ? `${h.slice(0, 8)}…${h.slice(-4)}` : h; }
function fmtDate(d: string): string {
  return new Date(d).toLocaleString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function ConfirmCard({ c }: { c: Confirmation }) {
  return (
    <div style={{ padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "1px solid var(--pos-border)", marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 16 }}>{DECISION_ICON[c.decision] ?? "•"}</span>
        <span style={{ fontWeight: 600, fontSize: 13 }}>{STEP_LABEL[c.step] ?? c.step}</span>
        <span className={`pos-badge ${DECISION_BADGE[c.decision] ?? "pos-badge-gray"}`} style={{ fontSize: 10 }}>{c.decision}</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: "var(--pos-text-muted)" }}>{fmtDate(c.signedAt)}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: "var(--pos-text-muted)", marginBottom: 2 }}>IMZOLAGAN (User ID)</div>
          <div className="pos-mono" style={{ color: "var(--pos-accent)" }}>#{c.userId}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "var(--pos-text-muted)", marginBottom: 2 }}>IP MANZIL</div>
          <div className="pos-mono">{c.ip ?? "—"}</div>
        </div>
        <div style={{ gridColumn: "span 2" }}>
          <div style={{ fontSize: 10, color: "var(--pos-text-muted)", marginBottom: 2 }}>IMZO HASH (SHA-256)</div>
          <div className="pos-mono" style={{ fontSize: 11, color: "var(--pos-text-muted)", wordBreak: "break-all" }} title={c.signatureHash}>{hashShort(c.signatureHash)}</div>
        </div>
        {c.comment && (
          <div style={{ gridColumn: "span 2" }}>
            <div style={{ fontSize: 10, color: "var(--pos-text-muted)", marginBottom: 2 }}>IZOH</div>
            <div style={{ fontStyle: "italic", color: "var(--pos-text-muted)" }}>{c.comment}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export function StepsTab({ movementId }: { movementId: number }) {
  const [confirmations, setConfirmations] = useState<Confirmation[]>([]);
  const [history,       setHistory]       = useState<HistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView]       = useState<"confirmations" | "history">("confirmations");

  const load = useCallback(async () => {
    try {
      const [conf, hist] = await Promise.all([
        movementsApi.getConfirmations(movementId).catch(() => []),
        movementsApi.getHistory(movementId).catch(() => []),
      ]);
      setConfirmations(Array.isArray(conf) ? (conf as Confirmation[]) : []);
      setHistory(Array.isArray(hist) ? (hist as HistEntry[]) : []);
    } catch { /* noop */ } finally { setLoading(false); }
  }, [movementId]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <div style={{ textAlign: "center", padding: 32, color: "var(--pos-text-muted)" }}>Yuklanmoqda…</div>;

  return (
    <div className="pos-card">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 15 }}>✅ Tasdiqlash bosqichlari</div>
        <div style={{ display: "flex", gap: 4 }}>
          <button className={`pos-btn ${view === "confirmations" ? "pos-btn-primary" : "pos-btn-ghost"}`} style={{ fontSize: 11, padding: "3px 10px" }} onClick={() => setView("confirmations")}>
            Imzolar ({confirmations.length})
          </button>
          <button className={`pos-btn ${view === "history" ? "pos-btn-primary" : "pos-btn-ghost"}`} style={{ fontSize: 11, padding: "3px 10px" }} onClick={() => setView("history")}>
            Holat tarixi ({history.length})
          </button>
        </div>
        <button className="pos-btn pos-btn-ghost" style={{ fontSize: 11, padding: "3px 8px", marginLeft: "auto" }} onClick={() => void load()}>🔄</button>
      </div>

      {view === "confirmations" && (
        confirmations.length === 0
          ? <div style={{ textAlign: "center", padding: 24, color: "var(--pos-text-muted)", fontSize: 13 }}>Tasdiqlash yozuvlari mavjud emas</div>
          : confirmations.map(c => <ConfirmCard key={c.id} c={c} />)
      )}

      {view === "history" && (
        history.length === 0
          ? <div style={{ textAlign: "center", padding: 24, color: "var(--pos-text-muted)", fontSize: 13 }}>Holat o'zgarishlari mavjud emas</div>
          : (
            <div className="pos-timeline">
              {history.map(h => (
                <div key={h.id} className="pos-timeline-item">
                  <span className="pos-timeline-dot" style={{ background: "var(--pos-accent)" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{h.fromStatus} → {h.toStatus}</div>
                    <div style={{ fontSize: 11, color: "var(--pos-text-muted)" }}>{fmtDate(h.changedAt)}</div>
                    {h.comment && <div style={{ fontSize: 11, color: "var(--pos-text-muted)", fontStyle: "italic" }}>"{h.comment}"</div>}
                  </div>
                </div>
              ))}
            </div>
          )
      )}
    </div>
  );
}
