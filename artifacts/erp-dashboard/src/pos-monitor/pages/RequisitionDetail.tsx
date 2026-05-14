/**
 * @module RequisitionDetail
 * @description React page component. Route-level UI.
 */

import { useState, useEffect, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { usePosI18n } from "../i18n/usePosI18n";
import { requestsApi } from "../api/pos-monitor.api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ReqLine {
  materialCardId: number;
  materialCode?: string;
  materialName?: string;
  requestedQty: number;
  unit?: string;
  availableQty?: number;
  notes?: string;
}

interface StatusEvent {
  status: string;
  timestamp?: string;
  userId?: number;
  userName?: string;
}

interface Requisition {
  id: number;
  requestNumber?: string;
  status: string;
  priority?: string;
  justification?: string;
  neededByDate?: string;
  targetWarehouseId?: string;
  targetWarehouseName?: string;
  createdAt: string;
  createdByName?: string;
  createdById?: number;
  departmentId?: string;
  lines?: ReqLine[];
  statusHistory?: StatusEvent[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_BADGE: Record<string, string> = {
  DRAFT: "pos-badge-gray",
  SUBMITTED: "pos-badge-yellow",
  PENDING: "pos-badge-yellow",
  APPROVED: "pos-badge-green",
  REJECTED: "pos-badge-red",
  FULFILLED: "pos-badge-blue",
  COMPLETED: "pos-badge-blue",
  IN_PROGRESS: "pos-badge-yellow",
  CANCELLED: "pos-badge-red",
};

const PRIORITY_BADGE: Record<string, string> = {
  LOW: "pos-badge-gray",
  MEDIUM: "pos-badge-blue",
  HIGH: "pos-badge-yellow",
  URGENT: "pos-badge-red",
};

const TIMELINE_STEPS = ["DRAFT", "SUBMITTED", "APPROVED", "FULFILLED"];
const TIMELINE_LABELS: Record<string, string> = {
  DRAFT: "Qoralama",
  SUBMITTED: "Yuborildi",
  APPROVED: "Tasdiqlandi",
  FULFILLED: "Bajarildi",
};

function getPosUserId(): number {
  try {
    const sess = localStorage.getItem("pos_session");
    if (!sess) return 0;
    const p = JSON.parse(sess) as { userId?: number };
    return p.userId ?? 0;
  } catch { return 0; }
}

function getPosRole(): string {
  try {
    const sess = localStorage.getItem("pos_session");
    if (!sess) return "";
    const p = JSON.parse(sess) as { role?: string };
    return (p.role ?? "").toLowerCase();
  } catch { return ""; }
}

// ─── Reject modal ─────────────────────────────────────────────────────────────
function RejectModal({
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
  const [err, setErr]       = useState("");

  async function handle() {
    if (!reason.trim()) { setErr("Sabab majburiy"); return; }
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
            Rad etish sababi *
          </label>
          <textarea
            className="pos-input"
            rows={4}
            placeholder="Sabab kiriting..."
            value={reason}
            onChange={e => setReason(e.target.value)}
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

// ─── Status timeline ──────────────────────────────────────────────────────────
function StatusTimeline({
  currentStatus,
  statusHistory,
}: {
  currentStatus: string;
  statusHistory?: StatusEvent[];
}) {
  const isRejected  = currentStatus === "REJECTED" || currentStatus === "CANCELLED";
  const currentIdx  = TIMELINE_STEPS.indexOf(currentStatus);

  function getTimestamp(step: string): string | undefined {
    if (!statusHistory) return undefined;
    const ev = statusHistory.find(e => e.status === step);
    return ev?.timestamp;
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, padding: "20px 0 8px" }}>
      {TIMELINE_STEPS.map((step, idx) => {
        const done    = isRejected ? idx === 0 : currentIdx >= idx;
        const current = !isRejected && currentIdx === idx;
        const ts      = getTimestamp(step);

        return (
          <div key={step} style={{ display: "flex", alignItems: "center", flex: idx < TIMELINE_STEPS.length - 1 ? 1 : 0 }}>
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
                    : done ? "#fff" : "var(--pos-text-muted)",
                  border: current ? "2px solid var(--pos-accent)" : "none",
                  transition: "all 0.3s",
                  boxShadow: done && !isRejected ? "0 2px 8px rgba(16,185,129,0.30)" : "none",
                }}
              >
                {isRejected && idx > 0 ? "✕" : done ? "✓" : idx + 1}
              </div>
              <div style={{ fontSize: 11, color: done ? "var(--pos-text)" : "var(--pos-text-muted)", fontWeight: current ? 700 : 400, textAlign: "center" }}>
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
            Rad etildi
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function RequisitionDetail() {
  const [, navigate]            = useLocation();
  const [match, params]         = useRoute("/pos-monitor/requests/:id");
  const { t }                   = usePosI18n();
  const id                      = match ? parseInt(params?.id ?? '0', 10) : 0;

  const [req, setReq]           = useState<Requisition | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [toast, setToast]       = useState("");

  const myUserId = getPosUserId();
  const myRole   = getPosRole();

  const isManager   = myRole.includes("manager") || myRole.includes("department_head") || myRole.includes("admin");
  const isWarehouse = myRole.includes("warehouse") || myRole.includes("storekeeper") || myRole.includes("admin");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const data = await requestsApi.getOne(id);
      setReq(data as Requisition);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function handleSubmit() {
    if (!req) return;
    setActionBusy(true);
    try {
      await requestsApi.submit(req.id);
      showToast("So'rov yuborildi");
      void load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleApprove() {
    if (!req) return;
    setActionBusy(true);
    try {
      await requestsApi.approve({ requestId: req.id });
      showToast("So'rov tasdiqlandi");
      void load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleReject(reason: string) {
    if (!req) return;
    await requestsApi.reject({ requestId: req.id, reason });
    setShowReject(false);
    showToast("So'rov rad etildi");
    void load();
  }

  async function handleFulfill() {
    if (!req) return;
    // Navigate to barcode chiqim page pre-filled with reqId
    navigate(`/pos-monitor/movements/new/chiqim?reqId=${req.id}`);
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="pos-card"
            style={{
              height: i === 0 ? 72 : 160,
              background: "var(--ep-primary)",
              animation: "pos-pulse 1.4s ease-in-out infinite",
            }}
          />
        ))}
      </div>
    );
  }

  if (error || !req) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <div style={{ color: "var(--pos-danger)", fontWeight: 600, marginBottom: 16 }}>
          {error || "So'rov topilmadi"}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button className="pos-btn pos-btn-ghost" onClick={() => navigate("/pos-monitor/requests")}>
            ← {t("common.back")}
          </button>
          <button className="pos-btn pos-btn-primary" onClick={() => void load()}>
            🔄 {t("common.refresh")}
          </button>
        </div>
      </div>
    );
  }

  const isCreator      = req.createdById === myUserId;
  const isDraft        = req.status === "DRAFT";
  const isPending      = req.status === "SUBMITTED" || req.status === "PENDING";
  const isApproved     = req.status === "APPROVED";
  const canSubmit      = isDraft && isCreator;
  const canApproveReject = isPending && isManager;
  const canFulfill     = isApproved && isWarehouse;

  return (
    <div className="pos-fade-in">
      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 72,
            right: 24,
            background: "var(--pos-text)",
            color: "#fff",
            borderRadius: 10,
            padding: "10px 18px",
            fontSize: 13,
            fontWeight: 600,
            zIndex: 9999,
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            animation: "slideIn 0.3s ease",
          }}
        >
          {toast}
        </div>
      )}

      {/* ── Back + Header ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <button className="pos-btn pos-btn-ghost" onClick={() => navigate("/pos-monitor/requests")}>
          ← {t("common.back")}
        </button>

        <span className="pos-mono" style={{ fontSize: 18, fontWeight: 700, color: "var(--pos-accent)" }}>
          {req.requestNumber ?? `#${req.id}`}
        </span>

        <span className={`pos-badge ${STATUS_BADGE[req.status] ?? "pos-badge-gray"}`} style={{ fontSize: 12 }}>
          {t(`status.${req.status}`) || req.status}
        </span>

        {req.priority && (
          <span className={`pos-badge ${PRIORITY_BADGE[req.priority] ?? "pos-badge-gray"}`} style={{ fontSize: 11 }}>
            {req.priority}
          </span>
        )}

        <div style={{ flex: 1 }} />

        <span style={{ fontSize: 12, color: "var(--pos-text-muted)" }}>
          {t("common.createdBy")}: <strong>{req.createdByName ?? "—"}</strong>
        </span>
        <span style={{ fontSize: 12, color: "var(--pos-text-muted)" }}>
          {new Date(req.createdAt).toLocaleDateString("uz-UZ")}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* ── Details card ────────────────────────────────────────────────── */}
        <div className="pos-card">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>📄 So'rov ma'lumotlari</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "var(--pos-text-muted)" }}>{t("requests.priority")}</span>
              <span className={`pos-badge ${PRIORITY_BADGE[req.priority ?? ""] ?? "pos-badge-gray"}`} style={{ fontSize: 11 }}>
                {req.priority ?? "—"}
              </span>
            </div>
            {req.neededByDate && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--pos-text-muted)" }}>Kerak bo'lish sanasi</span>
                <span>{new Date(req.neededByDate).toLocaleDateString("uz-UZ")}</span>
              </div>
            )}
            {req.targetWarehouseName && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--pos-text-muted)" }}>Maqsad ombori</span>
                <span>{req.targetWarehouseName}</span>
              </div>
            )}
            {req.justification && (
              <div style={{ fontSize: 13, marginTop: 4 }}>
                <div style={{ color: "var(--pos-text-muted)", marginBottom: 4 }}>{t("common.notes")}</div>
                <div
                  style={{
                    background: "rgba(248,250,252,1)",
                    borderRadius: 8,
                    padding: "8px 12px",
                    border: "1px solid var(--pos-border)",
                    fontSize: 13,
                  }}
                >
                  {req.justification}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Action section ─────────────────────────────────────────────── */}
        <div className="pos-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>⚡ Amallar</div>

          {canSubmit && (
            <div>
              <div style={{ fontSize: 13, color: "var(--pos-text-muted)", marginBottom: 10 }}>
                So'rovni bo'lim menejeriga yuboring.
              </div>
              <button
                className="pos-btn pos-btn-primary"
                disabled={actionBusy}
                onClick={() => void handleSubmit()}
              >
                {actionBusy ? "…" : `📨 ${t("common.submit")}`}
              </button>
            </div>
          )}

          {canApproveReject && (
            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="pos-btn pos-btn-success"
                disabled={actionBusy}
                onClick={() => void handleApprove()}
              >
                {actionBusy ? "…" : `✅ ${t("requests.approve")}`}
              </button>
              <button
                className="pos-btn pos-btn-danger"
                disabled={actionBusy}
                onClick={() => setShowReject(true)}
              >
                ✕ {t("requests.reject")}
              </button>
            </div>
          )}

          {canFulfill && (
            <div>
              <div style={{ fontSize: 13, color: "var(--pos-text-muted)", marginBottom: 10 }}>
                Barcode skaner bilan materialni chiqarib bering.
              </div>
              <button
                className="pos-btn pos-btn-primary"
                disabled={actionBusy}
                onClick={() => void handleFulfill()}
              >
                📦 Bajarish (Barcode skaner)
              </button>
            </div>
          )}

          {!canSubmit && !canApproveReject && !canFulfill && (
            <div style={{ fontSize: 13, color: "var(--pos-text-muted)", textAlign: "center", padding: "20px 0" }}>
              Hozircha amal mavjud emas
            </div>
          )}
        </div>
      </div>

      {/* ── Materials table ────────────────────────────────────────────────── */}
      {req.lines && req.lines.length > 0 && (
        <div className="pos-card" style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>📋 Materiallar</div>
          <div style={{ overflowX: "auto" }}>
            <table className="pos-table">
              <thead>
                <tr>
                  <th>{t("common.code")}</th>
                  <th>{t("common.name")}</th>
                  <th>{t("common.qty")}</th>
                  <th>{t("common.unit")}</th>
                  <th>Mavjud qoldiq</th>
                  <th>{t("common.notes")}</th>
                </tr>
              </thead>
              <tbody>
                {req.lines.map((line, idx) => (
                  <tr key={idx}>
                    <td>
                      <span className="pos-mono" style={{ fontSize: 11, color: "var(--pos-text-muted)" }}>
                        {line.materialCode ?? line.materialCardId}
                      </span>
                    </td>
                    <td>{line.materialName ?? `Material #${line.materialCardId}`}</td>
                    <td style={{ fontWeight: 600 }}>{line.requestedQty}</td>
                    <td style={{ color: "var(--pos-text-muted)" }}>{line.unit ?? "—"}</td>
                    <td>
                      {line.availableQty !== undefined ? (
                        <span
                          className={`pos-badge ${
                            (line.availableQty ?? 0) >= line.requestedQty
                              ? "pos-badge-green"
                              : "pos-badge-yellow"
                          }`}
                        >
                          {line.availableQty}
                        </span>
                      ) : (
                        <span style={{ color: "var(--pos-text-muted)" }}>—</span>
                      )}
                    </td>
                    <td style={{ color: "var(--pos-text-muted)", fontSize: 12 }}>{line.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Status Timeline ───────────────────────────────────────────────── */}
      <div className="pos-card" style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>🕐 Holat tarixi</div>
        <StatusTimeline currentStatus={req.status} statusHistory={req.statusHistory} />
      </div>

      {/* ── Reject modal ──────────────────────────────────────────────────── */}
      {showReject && (
        <RejectModal
          onClose={() => setShowReject(false)}
          onSubmit={handleReject}
          t={t}
        />
      )}
    </div>
  );
}
