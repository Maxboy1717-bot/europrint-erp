/**
 * @module GLPostingStatus
 * @description React UI component.
 */

import { useState, useEffect } from "react";
import { usePosI18n } from "../i18n/usePosI18n";
import { glApi } from "../api/pos-monitor.api";
import { useTranslation } from '@/lib/i18n';

// ─── Types ────────────────────────────────────────────────────────────────────
interface GlEntry {
  id: number;
  stageName?: string;
  status: string;
  glEntries?: Array<{
    accountDebit?: string;
    accountCredit?: string;
    amount?: number;
  }>;
  aiConfidence?: number;
  createdAt?: string;
}

export interface GLPostingStatusProps {
  movementId: number;
  compact?: boolean;
}

// ─── Status helpers ───────────────────────────────────────────────────────────
function deriveOverallStatus(entries: GlEntry[]): "none" | "reviewing" | "approved" | "rejected" {
  if (!entries.length) return "none";
  if (entries.some(e => e.status === "REJECTED")) return "rejected";
  if (entries.some(e => e.status === "AWAITING_REVIEW" || e.status === "PENDING")) return "reviewing";
  if (entries.every(e => e.status === "APPROVED")) return "approved";
  return "reviewing";
}

function getPosRole(): string {
  try {
    const sess = localStorage.getItem("pos_session");
    if (!sess) return "";
    const p = JSON.parse(sess) as { role?: string };
    return (p.role ?? "").toLowerCase();
  } catch { return ""; }
}

// ─── Compact badge ────────────────────────────────────────────────────────────
function CompactBadge({ status, t }: { status: ReturnType<typeof deriveOverallStatus>; t: (k: string) => string }) {
  const map = {
    none:      { cls: "pos-badge-gray",   label: t("glPosting.pending"),   icon: "⏳" },
    reviewing: { cls: "pos-badge-yellow", label: t("glPosting.reviewing"), icon: "🔍" },
    approved:  { cls: "pos-badge-green",  label: t("glPosting.approved"),  icon: "✓" },
    rejected:  { cls: "pos-badge-red",    label: t("glPosting.rejected"),  icon: "✕" },
  };
  const { cls, label, icon } = map[status];
  return (
    <span className={`pos-badge ${cls}`}>
      {icon} {label}
    </span>
  );
}

// ─── Full card ────────────────────────────────────────────────────────────────
function FullCard({
  entries,
  movementId,
  onApproved,
  t,
}: {
  entries: GlEntry[];
  movementId: number;
  onApproved: () => void;
  t: (k: string) => string;
}) {
  const { t } = useTranslation("common");
  const [busy, setBusy]   = useState(false);
  const [err, setErr]     = useState("");
  const isFinance = getPosRole().includes("finance") || getPosRole().includes("admin");

  async function approve() {
    setBusy(true);
    setErr("");
    try {
      await glApi.approveByMovement(movementId);
      onApproved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setBusy(false);
    }
  }

  const STATUS_MAP: Record<string, { badge: string; label: string }> = {
    AWAITING_REVIEW: { badge: "pos-badge-yellow", label: "Kutmoqda" },
    PENDING:         { badge: "pos-badge-yellow", label: "Kutmoqda" },
    APPROVED:        { badge: "pos-badge-green",  label: t("glPosting.approved") },
    REJECTED:        { badge: "pos-badge-red",    label: t("glPosting.rejected") },
  };

  return (
    <div className="pos-card pos-fade-in">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>📒 {t("glPosting.title")}</div>
        <div style={{ flex: 1 }} />
        {isFinance && entries.some(e => e.status !== "APPROVED") && (
          <button
            className="pos-btn pos-btn-success"
            style={{ fontSize: 12, padding: "5px 14px" }}
            disabled={busy}
            onClick={() => void approve()}
          >
            {busy ? "…" : `✅ ${t("glPosting.approve")}`}
          </button>
        )}
      </div>

      {err && (
        <div style={{ color: "var(--pos-danger)", fontSize: 12, marginBottom: 10 }}>{err}</div>
      )}

      {entries.length === 0 ? (
        <div style={{ textAlign: "center", padding: 24, color: "var(--pos-text-muted)", fontSize: 13 }}>
          ⏳ {t("glPosting.pending")}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="pos-table">
            <thead>
              <tr>
                <th>{t("milestone1")}</th>
                <th>{t("common.status")}</th>
                <th>Hisob (Debet)</th>
                <th>Hisob (Kredit)</th>
                <th>{t("common.amount")}</th>
                <th>AI</th>
                <th>{t("common.date")}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => {
                const statusInfo = STATUS_MAP[entry.status] ?? { badge: "pos-badge-gray", label: entry.status };
                const firstLine  = entry.glEntries?.[0];
                return (
                  <tr key={entry.id}>
                    <td style={{ fontWeight: 600, fontSize: 12 }}>{entry.stageName ?? `#${entry.id}`}</td>
                    <td>
                      <span className={`pos-badge ${statusInfo.badge}`} style={{ fontSize: 10 }}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td>
                      <span className="pos-mono" style={{ fontSize: 11, color: "var(--pos-text-muted)" }}>
                        {firstLine?.accountDebit ?? "—"}
                      </span>
                    </td>
                    <td>
                      <span className="pos-mono" style={{ fontSize: 11, color: "var(--pos-text-muted)" }}>
                        {firstLine?.accountCredit ?? "—"}
                      </span>
                    </td>
                    <td>
                      {firstLine?.amount !== undefined ? (
                        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12 }}>
                          {firstLine.amount.toLocaleString("uz-UZ")}
                        </span>
                      ) : "—"}
                    </td>
                    <td>
                      {entry.aiConfidence !== undefined ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div
                            style={{
                              width: 40,
                              height: 6,
                              borderRadius: 3,
                              background: "rgba(226,232,240,0.8)",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${Math.min(100, entry.aiConfidence * 100)}%`,
                                borderRadius: 3,
                                background:
                                  entry.aiConfidence >= 0.8
                                    ? "var(--pos-success)"
                                    : entry.aiConfidence >= 0.5
                                    ? "var(--pos-warning)"
                                    : "var(--pos-danger)",
                              }}
                            />
                          </div>
                          <span style={{ fontSize: 11, color: "var(--pos-text-muted)" }}>
                            {Math.round(entry.aiConfidence * 100)}%
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: "var(--pos-text-muted)", fontSize: 11 }}>—</span>
                      )}
                    </td>
                    <td style={{ fontSize: 11, color: "var(--pos-text-muted)" }}>
                      {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString("uz-UZ") : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Exported component ───────────────────────────────────────────────────────
export default function GLPostingStatus({ movementId, compact = false }: GLPostingStatusProps) {
  const { t }                   = usePosI18n();
  const [entries, setEntries]   = useState<GlEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await glApi.getByMovement(movementId);
      setEntries((Array.isArray(data) ? data : []) as GlEntry[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "GL yuklanmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [movementId]);

  if (loading) {
    if (compact) {
      return <span className="pos-badge pos-badge-gray" style={{ fontSize: 10 }}>⏳ GL...</span>;
    }
    return (
      <div
        className="pos-card"
        style={{
          height: 60,
          background: "var(--ep-primary)",
          animation: "pos-pulse 1.4s ease-in-out infinite",
        }}
      />
    );
  }

  if (error) {
    if (compact) {
      return <span className="pos-badge pos-badge-red" style={{ fontSize: 10 }}>⚠️ GL err</span>;
    }
    return (
      <div className="pos-card">
        <span style={{ color: "var(--pos-danger)", fontSize: 12 }}>⚠️ {error}</span>
        <button className="pos-btn pos-btn-ghost" style={{ marginLeft: 10, fontSize: 11 }} onClick={() => void load()}>
          🔄
        </button>
      </div>
    );
  }

  const overallStatus = deriveOverallStatus(entries);

  if (compact) {
    return <CompactBadge status={overallStatus} t={t} />;
  }

  return (
    <FullCard
      entries={entries}
      movementId={movementId}
      onApproved={() => void load()}
      t={t}
    />
  );
}
