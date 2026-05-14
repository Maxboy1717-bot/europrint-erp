/**
 * @module PosRequests
 * @description React page component. Route-level UI.
 */

import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { usePosI18n } from "../i18n/usePosI18n";
import { requestsApi } from "../api/pos-monitor.api";

function NewRequestModal({ onClose, onCreated, t }: { onClose: () => void; onCreated: () => void; t: (k: string) => string }) {
  const [justification, setJustification] = useState("");
  const [priority, setPriority]           = useState("MEDIUM");
  const [materialId, setMaterialId]       = useState("");
  const [qty, setQty]                     = useState("");
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState("");

  async function submit() {
    if (!materialId || !qty) { setError("Material ID va miqdor majburiy"); return; }
    setSaving(true); setError("");
    try {
      await requestsApi.create({
        justification: justification || undefined,
        priority,
        lines: [{ materialCardId: parseInt(materialId, 10), requestedQty: parseFloat(qty) }],
      });
      onCreated();
    } catch { setError("Xatolik yuz berdi"); } finally { setSaving(false); }
  }

  return (
    <div className="pos-modal-overlay">
      <div className="pos-modal" style={{ maxWidth: 520 }}>
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>📋 {t("requests.newRequest")}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 11, color: "var(--pos-text-muted)", marginBottom: 4, display: "block" }}>Ustuvorlik</label>
            <select className="pos-input" value={priority} onChange={e => setPriority(e.target.value)}>
              {["LOW","MEDIUM","HIGH","URGENT"].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "var(--pos-text-muted)", marginBottom: 4, display: "block" }}>{t('common.materialId')}</label>
            <input className="pos-input" placeholder="Material karta ID" value={materialId} onChange={e => setMaterialId(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "var(--pos-text-muted)", marginBottom: 4, display: "block" }}>Miqdor *</label>
            <input className="pos-input" type="number" min={0} placeholder="0" value={qty} onChange={e => setQty(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "var(--pos-text-muted)", marginBottom: 4, display: "block" }}>Asoslama</label>
            <textarea className="pos-input" rows={2} placeholder="Izoh..." value={justification} onChange={e => setJustification(e.target.value)} style={{ resize: "vertical" }} />
          </div>
          {error && <div style={{ color: "var(--pos-danger)", fontSize: 12 }}>{error}</div>}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="pos-btn pos-btn-ghost" onClick={onClose}>{t("common.cancel")}</button>
          <button className="pos-btn pos-btn-primary" disabled={saving} onClick={() => void submit()}>
            {saving ? "…" : `📋 ${t("common.submit")}`}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ReqLine  { materialCardId: number; requestedQty: number; unit?: string; notes?: string; }
interface Request  { id: number; requestNumber?: string; status: string; priority?: string; departmentId?: string; justification?: string; createdAt: string; lines?: ReqLine[]; }

const PRIORITY_BADGE: Record<string, string> = {
  LOW: "pos-badge-gray", MEDIUM: "pos-badge-blue", HIGH: "pos-badge-yellow", URGENT: "pos-badge-red",
};
const STATUS_BADGE: Record<string, string> = {
  DRAFT:"pos-badge-gray", SUBMITTED:"pos-badge-blue", APPROVED:"pos-badge-green",
  REJECTED:"pos-badge-red", IN_PROGRESS:"pos-badge-yellow", COMPLETED:"pos-badge-green", CANCELLED:"pos-badge-red",
};

export default function PosRequests() {
  const [, navigate] = useLocation();
  const { t } = usePosI18n();
  const [activeTab, setActiveTab] = useState<"my" | "approve" | "fulfill">("my");
  const [requests, setRequests]   = useState<Request[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showNew, setShowNew]     = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await requestsApi.getAll();
      setRequests((Array.isArray(data) ? data : []) as Request[]);
    } catch { /* noop */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  async function approve(id: number) {
    await requestsApi.approve({ id } as Record<string, unknown>);
    void loadData();
  }
  async function reject(id: number) {
    await requestsApi.reject({ id } as Record<string, unknown>);
    void loadData();
  }

  const myReqs     = (Array.isArray(requests) ? requests : []).filter(r => r.status !== "COMPLETED");
  const toApprove  = (Array.isArray(requests) ? requests : []).filter(r => r.status === "SUBMITTED");
  const toFulfill  = (Array.isArray(requests) ? requests : []).filter(r => r.status === "APPROVED");

  const list = activeTab === "my" ? myReqs : activeTab === "approve" ? toApprove : toFulfill;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{t("requests.title")}</h2>
        <div style={{ flex: 1 }} />
        <button className="pos-btn pos-btn-primary" onClick={() => setShowNew(true)}>
          ➕ {t("requests.newRequest")}
        </button>
      </div>

      <div className="pos-tabs">
        <div className={`pos-tab ${activeTab === "my" ? "active" : ""}`} onClick={() => setActiveTab("my")}>
          {t("requests.myRequests")} <span className="pos-badge pos-badge-blue" style={{ fontSize: 10, marginLeft: 6 }}>{myReqs.length}</span>
        </div>
        <div className={`pos-tab ${activeTab === "approve" ? "active" : ""}`} onClick={() => setActiveTab("approve")}>
          {t("requests.toApprove")} <span className="pos-badge pos-badge-yellow" style={{ fontSize: 10, marginLeft: 6 }}>{toApprove.length}</span>
        </div>
        <div className={`pos-tab ${activeTab === "fulfill" ? "active" : ""}`} onClick={() => setActiveTab("fulfill")}>
          {t("requests.toFulfill")} <span className="pos-badge pos-badge-green" style={{ fontSize: 10, marginLeft: 6 }}>{toFulfill.length}</span>
        </div>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40, color: "var(--pos-text-muted)" }}>{t("common.loading")}</div>}

      {!loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(Array.isArray(list) ? list : []).map(req => (
            <div key={req.id} className="pos-card pos-fade-in">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span className="pos-mono" style={{ fontWeight: 700, color: "var(--pos-accent)", fontSize: 15 }}>
                  {req.requestNumber ?? `#${req.id}`}
                </span>
                <span className={`pos-badge ${STATUS_BADGE[req.status] ?? "pos-badge-gray"}`} style={{ fontSize: 10 }}>
                  {t(`status.${req.status}`)}
                </span>
                {req.priority && (
                  <span className={`pos-badge ${PRIORITY_BADGE[req.priority] ?? "pos-badge-gray"}`} style={{ fontSize: 10 }}>
                    {req.priority}
                  </span>
                )}
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 12, color: "var(--pos-text-muted)" }}>{new Date(req.createdAt).toLocaleDateString("uz-UZ")}</span>
              </div>

              {req.justification && (
                <div style={{ fontSize: 13, color: "var(--pos-text-muted)", marginBottom: 10 }}>{req.justification}</div>
              )}

              {req.lines && req.lines.length > 0 && (
                <div style={{ fontSize: 12, color: "var(--pos-text-muted)", marginBottom: 10 }}>
                  {req.lines.length} ta material · Jami: {(Array.isArray(req.lines) ? req.lines : []).reduce((s, l) => s + l.requestedQty, 0)} birlik
                </div>
              )}

              {/* Actions */}
              {activeTab === "approve" && req.status === "SUBMITTED" && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="pos-btn pos-btn-success" style={{ fontSize: 12, padding: "6px 14px" }} onClick={() => void approve(req.id)}>
                    ✅ {t("requests.approve")}
                  </button>
                  <button className="pos-btn pos-btn-danger" style={{ fontSize: 12, padding: "6px 14px" }} onClick={() => void reject(req.id)}>
                    ✕ {t("requests.reject")}
                  </button>
                </div>
              )}
              {activeTab === "fulfill" && req.status === "APPROVED" && (
                <button className="pos-btn pos-btn-primary" style={{ fontSize: 12, padding: "6px 14px" }} onClick={() => navigate(`/pos-monitor/movements/new?reqId=${req.id}`)}>
                  📦 {t("requests.fulfill")}
                </button>
              )}
            </div>
          ))}
          {list.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "var(--pos-text-muted)" }}>{t("common.noData")}</div>}
        </div>
      )}

      {/* New request modal */}
      {showNew && <NewRequestModal onClose={() => setShowNew(false)} onCreated={() => { setShowNew(false); void loadData(); }} t={t} />}
    </div>
  );
}
