/**
 * @module PosInventory
 * @description React page component. Route-level UI.
 */

import { useState, useEffect, useCallback } from "react";
import { usePosI18n } from "../i18n/usePosI18n";
import { inventoryApi } from "../api/pos-monitor.api";
import { useTranslation } from '@/lib/i18n';

function NewPlanModal({ onClose, onCreated, t }: { onClose: () => void; onCreated: () => void; t: (k: string) => string }) {
  const [warehouseId, setWarehouseId] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");

  async function submit() {
    if (!warehouseId) { setError("Ombor ID majburiy"); return; }
    setSaving(true); setError("");
    try {
      await inventoryApi.create({ warehouseId, scheduledFor: scheduledFor || undefined });
      onCreated();
    } catch { setError("Xatolik yuz berdi"); } finally { setSaving(false); }
  }

  return (
    <div className="pos-modal-overlay">
      <div className="pos-modal" style={{ maxWidth: 440 }}>
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>📋 {t("inventory.newPlan")}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 11, color: "var(--pos-text-muted)", marginBottom: 4, display: "block" }}>{t("omborId1")}</label>
            <input className="pos-input" placeholder={t("masalanWh001")} value={warehouseId} onChange={e => setWarehouseId(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "var(--pos-text-muted)", marginBottom: 4, display: "block" }}>{t("inventory.scheduledFor")}</label>
            <input className="pos-input" type="date" value={scheduledFor} onChange={e => setScheduledFor(e.target.value)} />
          </div>
          {error && <div style={{ color: "var(--pos-danger)", fontSize: 12 }}>{error}</div>}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="pos-btn pos-btn-ghost" onClick={onClose}>{t("common.cancel")}</button>
          <button className="pos-btn pos-btn-primary" disabled={saving} onClick={() => void submit()}>
            {saving ? "…" : t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

interface Plan { id: number; planNumber?: string; status: string; scheduledFor?: string; warehouseId?: string; createdAt: string; }
interface VarianceLine { materialCardId: number; systemQty: number; actualQty: number; varianceQty: number; }

const STATUS_BADGE: Record<string, string> = {
  DRAFT:"pos-badge-gray", SCHEDULED:"pos-badge-blue", IN_PROGRESS:"pos-badge-yellow",
  COUNTING_DONE:"pos-badge-yellow", FINANCE_REVIEW:"pos-badge-yellow", APPROVED:"pos-badge-green",
  CANCELLED:"pos-badge-red",
};

export default function PosInventory() {
  const { t } = useTranslation("common");
  const { t } = usePosI18n();
  const [tab, setTab]     = useState<"plans" | "active" | "variances">("plans");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [active, setActive] = useState<Plan | null>(null);
  const [variances, setVariances] = useState<VarianceLine[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showNewPlan, setShowNewPlan] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await inventoryApi.getAll();
      const list = (Array.isArray(data) ? data : []) as Plan[];
      setPlans(list);
      const inProg = list.find(p => p.status === "IN_PROGRESS");
      setActive(inProg ?? null);
    } catch { /* noop */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  async function loadVariances(planId: number) {
    try {
      const data = await inventoryApi.getVariance(planId);
      setVariances((Array.isArray(data) ? data : []) as VarianceLine[]);
    } catch { /* noop */ }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{t("inventory.title")}</h2>
        <div style={{ flex: 1 }} />
        <button className="pos-btn pos-btn-primary" onClick={() => setShowNewPlan(true)}>
          ➕ {t("inventory.newPlan")}
        </button>
      </div>

      {active && (
        <div className="pos-card pos-card-glow" style={{ marginBottom: 16, borderColor: "rgba(0,255,148,0.3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--pos-success)", display: "inline-block" }} className="pos-live" />
            <span style={{ fontWeight: 600, color: "var(--pos-success)" }}>FAOL SANOQ</span>
            <span className="pos-mono" style={{ fontSize: 13, color: "var(--pos-accent)" }}>{active.planNumber ?? `#${active.id}`}</span>
            <span className="pos-badge pos-badge-yellow" style={{ fontSize: 10 }}>{t(`status.${active.status}`)}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="pos-btn pos-btn-primary" style={{ fontSize: 12, padding: "6px 14px" }} onClick={() => void loadVariances(active.id)}>
              {t("farqlarniKorish")}
            </button>
            <button className="pos-btn pos-btn-ghost" style={{ fontSize: 12, padding: "6px 14px" }}>
              {t("pdfAct")}
            </button>
          </div>
        </div>
      )}

      <div className="pos-tabs">
        <div className={`pos-tab ${tab === "plans" ? "active" : ""}`} onClick={() => setTab("plans")}>{t("inventory.plans")}</div>
        <div className={`pos-tab ${tab === "active" ? "active" : ""}`} onClick={() => setTab("active")}>{t("inventory.activeCount")}</div>
        <div className={`pos-tab ${tab === "variances" ? "active" : ""}`} onClick={() => setTab("variances")}>{t("inventory.variances")}</div>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40, color: "var(--pos-text-muted)" }}>{t("common.loading")}</div>}

      {!loading && tab === "plans" && (
        <div className="pos-card" style={{ overflowX: "auto" }}>
          <table className="pos-table">
            <thead>
              <tr>
                <th>{t("inventory.planNo")}</th>
                <th>{t("ombor")}</th>
                <th>{t("common.status")}</th>
                <th>{t("inventory.scheduledFor")}</th>
                <th>{t("Amallar")}</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(plans) ? plans : []).map(plan => (
                <tr key={plan.id}>
                  <td className="pos-mono" style={{ color: "var(--pos-accent)", fontWeight: 600 }}>{plan.planNumber ?? `#${plan.id}`}</td>
                  <td>{plan.warehouseId ?? "—"}</td>
                  <td><span className={`pos-badge ${STATUS_BADGE[plan.status] ?? "pos-badge-gray"}`} style={{ fontSize: 10 }}>{t(`status.${plan.status}`)}</span></td>
                  <td style={{ color: "var(--pos-text-muted)", fontSize: 12 }}>
                    {plan.scheduledFor ? new Date(plan.scheduledFor).toLocaleDateString("uz-UZ") : "—"}
                  </td>
                  <td>
                    <button className="pos-btn pos-btn-ghost" style={{ fontSize: 11, padding: "3px 8px" }} onClick={() => void loadVariances(plan.id)}>
                      {t("farq1")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {plans.length === 0 && <div style={{ textAlign: "center", padding: 24, color: "var(--pos-text-muted)" }}>{t("common.noData")}</div>}
        </div>
      )}

      {!loading && tab === "active" && (
        <div className="pos-card">
          {active ? (
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Faol sanoq: {active.planNumber ?? `#${active.id}`}</div>
              <div style={{ color: "var(--pos-text-muted)", fontSize: 13 }}>
                {t("sanoqQatorlariniKiritishUchunBarcode")}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: 32, color: "var(--pos-text-muted)" }}>{t("faolSanoqYoq")}</div>
          )}
        </div>
      )}

      {!loading && tab === "variances" && (
        <div className="pos-card" style={{ overflowX: "auto" }}>
          {variances.length > 0 ? (
            <table className="pos-table">
              <thead>
                <tr>
                  <th>{t('common.materialId')}</th>
                  <th>{t("inventory.systemQty")}</th>
                  <th>{t("inventory.actualQty")}</th>
                  <th>{t("inventory.difference")}</th>
                  <th>{t("tur")}</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(variances) ? variances : []).map((v) => {
                  const diff = v.varianceQty ?? (v.actualQty - v.systemQty);
                  const isShort = diff < 0;
                  return (
                    <tr key={`var-${v.materialCardId}-${v.systemQty}`}>
                      <td className="pos-mono" style={{ color: "var(--pos-accent)" }}>#{v.materialCardId}</td>
                      <td className="pos-mono">{v.systemQty}</td>
                      <td className="pos-mono">{v.actualQty}</td>
                      <td className="pos-mono" style={{ fontWeight: 700, color: isShort ? "var(--pos-danger)" : "var(--pos-success)" }}>
                        {diff > 0 ? "+" : ""}{diff}
                      </td>
                      <td>
                        <span className={`pos-badge ${isShort ? "pos-badge-red" : "pos-badge-green"}`} style={{ fontSize: 10 }}>
                          {isShort ? t("inventory.shortage") : t("inventory.surplus")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: "center", padding: 32, color: "var(--pos-text-muted)" }}>
              {t("rejaTanlangVaFarqTugmasini")}
            </div>
          )}
        </div>
      )}

      {showNewPlan && <NewPlanModal onClose={() => setShowNewPlan(false)} onCreated={() => { setShowNewPlan(false); void loadData(); }} t={t} />}
    </div>
  );
}
