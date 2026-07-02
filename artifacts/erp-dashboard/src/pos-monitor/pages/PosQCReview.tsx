/**
 * @module PosQCReview
 * @description React page component. Route-level UI.
 */

import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { usePosI18n } from "../i18n/usePosI18n";
import { movementsApi } from "../api/pos-monitor.api";

interface Movement {
  id: number;
  movementNumber?: string;
  movementType: string;
  status: string;
  totalAmount?: number;
  createdAt: string;
  fromWarehouseName?: string;
  toWarehouseName?: string;
}

// Karantin-oqim holatlari ham ko'rinadi: 'karantin' (yangi tashqi kirim) va 'qc_review'
// (48 soatdan keyin cron eskalatsiyasi). Qaror harakat-detal sahifasida haqiqiy oqim
// (/wh-features/movement/:id/qc-decision — QuarantineWorkflowService) orqali qabul qilinadi.
const QC_STATUS_ORDER = ["qc_pending", "karantin", "qc_review"];

export default function PosQCReview() {
  const [, navigate] = useLocation();
  const { t } = usePosI18n();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("qc_pending");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await movementsApi.getAll({ status: filterStatus });
      setMovements(Array.isArray(data) ? data as Movement[] : []);
    } catch { setMovements([]); } finally { setLoading(false); }
  }, [filterStatus]);

  useEffect(() => { void load(); }, [load]);

  const DECISION_COLORS: Record<string, string> = {
    qc_pending:  "var(--pos-warning)",
    karantin:    "#9B59B6",
    qc_review:   "#9B59B6",
    qc_approved: "var(--pos-success)",
    qc_rework:   "var(--pos-warning)",
    qc_rejected: "var(--pos-danger)",
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>🔬 {t("qcreview.title")}</h2>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 6 }}>
          {QC_STATUS_ORDER.map(s => (
            <button
              key={s}
              className={`pos-btn ${filterStatus === s ? "pos-btn-primary" : "pos-btn-ghost"}`}
              onClick={() => setFilterStatus(s)}
            >
              {t(`status.${s}`)}
            </button>
          ))}
        </div>
        <button className="pos-btn pos-btn-ghost" onClick={() => void load()}>🔄</button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--pos-text-muted)" }}>{t("common.loading")}</div>
      ) : movements.length === 0 ? (
        <div className="pos-card" style={{ textAlign: "center", padding: 48, color: "var(--pos-text-muted)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{t("qcreview.empty")}</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>{t("qcreview.emptyDesc")}</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {movements.map(m => (
            <div key={m.id} className="pos-card pos-fade-in"
              style={{ borderLeft: `3px solid ${DECISION_COLORS[m.status] ?? "var(--pos-accent)"}`, cursor: "pointer" }}
              onClick={() => navigate(`/pos-monitor/movements/${m.id}`)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {m.movementNumber ?? `#${m.id}`}
                    <span className="pos-badge-yellow" style={{ marginLeft: 8, fontSize: 11 }}>{t(`status.${m.status}`)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--pos-text-muted)", marginTop: 4 }}>
                    {t(`movType.${m.movementType}`)} • {new Date(m.createdAt).toLocaleString("uz-UZ")}
                    {m.fromWarehouseName && ` • ${m.fromWarehouseName}`}
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: "var(--pos-accent)", fontSize: 15 }}>
                  {m.totalAmount ? `${m.totalAmount.toLocaleString()} so'm` : ""}
                </div>
                <div style={{ color: "var(--pos-text-muted)", fontSize: 18 }}>›</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
