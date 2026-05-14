/**
 * @module GlTab
 * @description React UI component.
 */

import { useState, useEffect, useCallback } from "react";
import { glApi } from "../api/pos-monitor.api";
import { useTranslation } from '@/lib/i18n';

interface GlLog {
  id: number;
  stageName: string;
  status: string;
  glEntries: Array<{ accountCode?: string; accountName?: string; debit?: number; credit?: number }>;
  createdAt?: string;
}

const STATUS_MAP: Record<string, string> = {
  AWAITING_REVIEW: "pending",
  APPROVED: "approved",
  POSTED: "approved",
  REJECTED: "rejected",
  PROCESSING: "processing",
};

const STAGE_ICON: Record<string, string> = {
  EXTRACT: "📥", CLASSIFY: "🏷️", COMPUTE: "🧮", VERIFY: "🔍", POST: "✅",
};

const STATUS_BADGE: Record<string, string> = {
  pending: "pos-badge-yellow",
  approved: "pos-badge-green",
  rejected: "pos-badge-red",
  processing: "pos-badge-gray",
};

export function GlTab({ movementId }: { movementId: number }) {
  const { t } = useTranslation("common");
  const [logs, setLogs]           = useState<GlLog[]>([]);
  const [loading, setLoading]     = useState(true);
  const [approving, setApproving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await glApi.getByMovement(movementId);
      setLogs(Array.isArray(res) ? (res as GlLog[]) : []);
    } catch { /* noop */ } finally { setLoading(false); }
  }, [movementId]);

  useEffect(() => { void load(); }, [load]);

  const pendingLog    = logs.find(l => l.status === "AWAITING_REVIEW");
  const journalStage  = logs.find(l => l.stageName === "POST") ?? logs[logs.length - 1];
  const journalEntries = journalStage?.glEntries ?? [];

  async function approve() {
    setApproving(true);
    try { await glApi.approveByMovement(movementId); await load(); }
    catch { /* noop */ } finally { setApproving(false); }
  }

  if (loading) return <div style={{ textAlign: "center", padding: 32, color: "var(--pos-text-muted)" }}>{t("yuklanmoqda1")}</div>;

  return (
    <div>
      <div className="pos-card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{t("glPostingBosqichlari")}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="pos-btn pos-btn-ghost" style={{ fontSize: 12 }} onClick={() => void load()}>{t("yangilash")}</button>
            {pendingLog && (
              <button className="pos-btn pos-btn-success" style={{ fontSize: 12 }} disabled={approving} onClick={() => void approve()}>
                {approving ? "…" : "✅ GL Tasdiqlash"}
              </button>
            )}
          </div>
        </div>
        {logs.length === 0 ? (
          <div style={{ textAlign: "center", padding: 32, color: "var(--pos-text-muted)", fontSize: 13 }}>
            {t("buHarakatUchunGlPosting")}
          </div>
        ) : (
          <div className="pos-timeline">
            {logs.map(log => {
              const uiStatus = STATUS_MAP[log.status] ?? log.status;
              const dotColor = uiStatus === "approved" ? "var(--pos-success)"
                : uiStatus === "pending" ? "var(--pos-warning)"
                : uiStatus === "rejected" ? "var(--pos-danger)"
                : "var(--pos-border)";
              return (
                <div key={log.id} className="pos-timeline-item">
                  <span className="pos-timeline-dot" style={{ background: dotColor }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{STAGE_ICON[log.stageName] ?? "•"} {log.stageName}</span>
                      <span className={`pos-badge ${STATUS_BADGE[uiStatus] ?? "pos-badge-gray"}`} style={{ fontSize: 10 }}>{uiStatus}</span>
                    </div>
                    {log.createdAt && (
                      <div style={{ fontSize: 11, color: "var(--pos-text-muted)", marginTop: 2 }}>
                        {new Date(log.createdAt).toLocaleString("uz-UZ")}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {journalEntries.length > 0 && (
        <div className="pos-card">
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>📒 Buxgalteriya yozuvlari (POST bosqichi)</div>
          <div style={{ overflowX: "auto" }}>
            <table className="pos-table">
              <thead>
                <tr>
                  <th>{t("hisobKodi")}</th>
                  <th>{t("hisobNomi")}</th>
                  <th style={{ textAlign: "right" }}>{t("debet")}</th>
                  <th style={{ textAlign: "right" }}>{t("loan")}</th>
                </tr>
              </thead>
              <tbody>
                {journalEntries.map((e, i) => (
                  <tr key={`${e.accountCode ?? "x"}-${i}`}>
                    <td className="pos-mono" style={{ color: "var(--pos-accent)", fontWeight: 600 }}>{e.accountCode ?? "—"}</td>
                    <td style={{ color: "var(--pos-text-muted)" }}>{e.accountName ?? "—"}</td>
                    <td className="pos-mono" style={{ textAlign: "right" }}>{e.debit ? new Intl.NumberFormat("uz-UZ").format(e.debit) : "—"}</td>
                    <td className="pos-mono" style={{ textAlign: "right" }}>{e.credit ? new Intl.NumberFormat("uz-UZ").format(e.credit) : "—"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} style={{ textAlign: "right", fontWeight: 600, fontSize: 12, color: "var(--pos-text-muted)" }}>JAMI:</td>
                  <td className="pos-mono" style={{ textAlign: "right", fontWeight: 700, color: "var(--pos-success)" }}>
                    {new Intl.NumberFormat("uz-UZ").format(journalEntries.reduce((s, e) => s + (e.debit ?? 0), 0))}
                  </td>
                  <td className="pos-mono" style={{ textAlign: "right", fontWeight: 700, color: "var(--pos-danger)" }}>
                    {new Intl.NumberFormat("uz-UZ").format(journalEntries.reduce((s, e) => s + (e.credit ?? 0), 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
