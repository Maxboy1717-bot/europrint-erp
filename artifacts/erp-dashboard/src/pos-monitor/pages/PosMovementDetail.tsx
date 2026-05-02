import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { usePosI18n } from "../i18n/usePosI18n";
import { movementsApi } from "../api/pos-monitor.api";
import { GlTab } from "../components/GlTab";
import { StepsTab } from "../components/StepsTab";

interface MovLine {
  id: number; materialCardId: number; qty: number;
  unitPrice?: number; totalPrice?: number; lotNumber?: string; expiryDate?: string;
}
interface MovHist  { id: number; fromStatus: string; toStatus: string; changedAt: string; comment?: string; }
interface Movement {
  id: number; movementNumber?: string; movementType: string; status: string;
  fromWarehouseId?: string; toWarehouseId?: string; totalAmount?: number;
  createdAt: string; supplierDoc?: string; notes?: string;
  lines?: MovLine[];
}

const STATUS_STEPS: Record<string, string[]> = {
  EXTERNAL_IN:   ["draft", "qc_pending", "qc_approved", "pending", "approved", "completed"],
  EXTERNAL_OUT:  ["draft", "pending", "approved", "completed"],
  INTERNAL_ISSUE:["draft", "pending", "approved", "completed"],
};

const STATUS_BADGE: Record<string, string> = {
  draft: "pos-badge-gray", pending: "pos-badge-yellow", approved: "pos-badge-green",
  completed: "pos-badge-green", cancelled: "pos-badge-red",
  qc_pending: "pos-badge-yellow", qc_approved: "pos-badge-green",
};

export default function PosMovementDetail() {
  const params        = useParams<{ id: string }>();
  const [, navigate]  = useLocation();
  const { t }         = usePosI18n();
  const id            = parseInt(params.id ?? "0", 10);
  const [movement, setMovement] = useState<Movement | null>(null);
  const [history, setHistory]   = useState<MovHist[]>([]);
  const [tab, setTab]           = useState<"details" | "steps" | "gl">("details");
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [mov, hist] = await Promise.all([
        movementsApi.getOne(id),
        movementsApi.getHistory(id).catch(() => []),
      ]);
      setMovement(mov as Movement | null);
      setHistory((Array.isArray(hist) ? hist : []) as MovHist[]);
    } catch { /* noop */ } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { void loadData(); }, [loadData]);

  async function doAction(status: string) {
    setActing(true);
    try {
      await movementsApi.updateStatus(id, status, rejectReason || undefined);
      await loadData();
      setRejectReason("");
    } catch { /* noop */ } finally { setActing(false); }
  }

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "var(--pos-text-muted)" }}>{t("common.loading")}</div>;
  if (!movement) return <div style={{ textAlign: "center", padding: 60, color: "var(--pos-danger)" }}>Harakat topilmadi</div>;

  const steps   = STATUS_STEPS[movement.movementType] ?? ["draft", "pending", "completed"];
  const stepIdx = steps.indexOf(movement.status);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <button className="pos-btn pos-btn-ghost" style={{ padding: "6px 10px" }} onClick={() => navigate("/pos-monitor/movements")}>
          ← {t("common.back")}
        </button>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{movement.movementNumber ?? `#${movement.id}`}</h2>
        <span className={`pos-badge ${STATUS_BADGE[movement.status] ?? "pos-badge-gray"}`}>{t(`status.${movement.status}`)}</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 8 }}>
          {movement.status === "draft" && (
            <button className="pos-btn pos-btn-primary" disabled={acting} onClick={() => void doAction("pending")}>🚀 Yuborish</button>
          )}
          {movement.status === "pending" && (
            <>
              <button className="pos-btn pos-btn-success" disabled={acting} onClick={() => void doAction("approved")}>✅ Tasdiqlash</button>
              <button className="pos-btn pos-btn-danger"  disabled={acting} onClick={() => void doAction("cancelled")}>✕ Rad etish</button>
            </>
          )}
          {movement.status === "qc_pending" && (
            <>
              <button className="pos-btn pos-btn-success" disabled={acting} onClick={() => void doAction("qc_approved")}>✅ QC Qabul</button>
              <button className="pos-btn pos-btn-danger"  disabled={acting} onClick={() => void doAction("qc_rework")}>⟲ Qayta ishlash</button>
            </>
          )}
          <a className="pos-btn pos-btn-ghost" href={movementsApi.getPdf(movement.id)} target="_blank" rel="noreferrer" style={{ fontSize: 12, padding: "6px 12px" }}>
            📄 PDF
          </a>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, overflow: "hidden", borderRadius: 8 }}>
        {steps.map((s, i) => (
          <div key={s} style={{ flex: 1, height: 6, background: i <= stepIdx ? (i === stepIdx ? "var(--pos-accent)" : "var(--pos-success)") : "var(--pos-border)" }} />
        ))}
      </div>

      {/* Tabs */}
      <div className="pos-tabs">
        <div className={`pos-tab ${tab === "details" ? "active" : ""}`} onClick={() => setTab("details")}>📋 Tafsilot</div>
        <div className={`pos-tab ${tab === "steps"   ? "active" : ""}`} onClick={() => setTab("steps")}>✅ Tasdiqlash bosqichlari</div>
        <div className={`pos-tab ${tab === "gl"      ? "active" : ""}`} onClick={() => setTab("gl")}>📊 GL Posting</div>
      </div>

      {tab === "details" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
          <div className="pos-card">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 10, color: "var(--pos-text-muted)", marginBottom: 4 }}>Harakat turi</div>
                <span className="pos-badge pos-badge-blue">{t(`movType.${movement.movementType}`)}</span>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--pos-text-muted)", marginBottom: 4 }}>{t("common.status")}</div>
                <span className={`pos-badge ${STATUS_BADGE[movement.status] ?? "pos-badge-gray"}`}>{t(`status.${movement.status}`)}</span>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--pos-text-muted)", marginBottom: 4 }}>Kimdan ombor</div>
                <div style={{ fontWeight: 500 }}>{movement.fromWarehouseId ?? "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--pos-text-muted)", marginBottom: 4 }}>Qayerga ombor</div>
                <div style={{ fontWeight: 500 }}>{movement.toWarehouseId ?? "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--pos-text-muted)", marginBottom: 4 }}>Supplier Doc</div>
                <div className="pos-mono">{movement.supplierDoc ?? "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--pos-text-muted)", marginBottom: 4 }}>Yaratilgan sana</div>
                <div style={{ fontSize: 13 }}>{new Date(movement.createdAt).toLocaleString("uz-UZ")}</div>
              </div>
            </div>

            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--pos-text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
              {t("movements.items")}
            </div>
            <table className="pos-table">
              <thead>
                <tr><th>Material ID</th><th>Miqdor</th><th>Birlik narxi</th><th>Jami</th><th>Lot</th><th>Muddat</th></tr>
              </thead>
              <tbody>
                {(movement.lines ?? []).map(line => (
                  <tr key={line.id}>
                    <td className="pos-mono" style={{ color: "var(--pos-accent)" }}>#{line.materialCardId}</td>
                    <td className="pos-mono">{line.qty}</td>
                    <td className="pos-mono">{line.unitPrice?.toFixed(2) ?? "—"}</td>
                    <td className="pos-mono">{line.totalPrice?.toFixed(2) ?? "—"}</td>
                    <td style={{ color: "var(--pos-text-muted)" }}>{line.lotNumber ?? "—"}</td>
                    <td style={{ color: "var(--pos-text-muted)", fontSize: 12 }}>
                      {line.expiryDate ? new Date(line.expiryDate).toLocaleDateString("uz-UZ") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!(movement.lines ?? []).length && <div style={{ textAlign: "center", padding: 16, color: "var(--pos-text-muted)" }}>Qatorlar yo'q</div>}
          </div>

          <div>
            <div className="pos-card" style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: "var(--pos-text-muted)", marginBottom: 8 }}>JAMI SUMMA</div>
              <div className="pos-mono" style={{ fontSize: 28, fontWeight: 700, color: "var(--pos-accent)" }}>
                {movement.totalAmount?.toLocaleString("uz-UZ") ?? "—"}
              </div>
            </div>
            {history.length > 0 && (
              <div className="pos-card">
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--pos-text-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Holat tarixi</div>
                <div className="pos-timeline">
                  {history.map(h => (
                    <div key={h.id} className="pos-timeline-item">
                      <span className="pos-timeline-dot" style={{ background: "var(--pos-accent)" }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12 }}>{h.fromStatus} → {h.toStatus}</div>
                        <div style={{ fontSize: 11, color: "var(--pos-text-muted)" }}>{new Date(h.changedAt).toLocaleString("uz-UZ")}</div>
                        {h.comment && <div style={{ fontSize: 11, color: "var(--pos-text-muted)" }}>{h.comment}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "steps" && <StepsTab movementId={id} />}
      {tab === "gl"    && <GlTab    movementId={id} />}
    </div>
  );
}
