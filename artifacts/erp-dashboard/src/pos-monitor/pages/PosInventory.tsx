/**
 * @module PosInventory
 * @description React page component. Route-level UI.
 */

import { useState, useEffect, useCallback } from "react";
import { usePosI18n } from "../i18n/usePosI18n";
import { inventoryApi } from "../api/pos-monitor.api";
import {
  varianceConfigApi, deviationApi, freezeZonesApi,
  type VarianceThreshold, type VarianceDecisionView, type DeviationReason, type FreezeZone,
} from "../api/pos-wms-extra.api";

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
interface VarianceLine { materialCardId: number; materialName?: string; systemQty: number; actualQty: number; variance: number; }

const STATUS_BADGE: Record<string, string> = {
  DRAFT:"pos-badge-gray", SCHEDULED:"pos-badge-blue", IN_PROGRESS:"pos-badge-yellow",
  COUNTING_DONE:"pos-badge-yellow", FINANCE_REVIEW:"pos-badge-yellow", APPROVED:"pos-badge-green",
  CANCELLED:"pos-badge-red",
};

// ─── FE-P2: Farq sozlamalari / og'ish-sabab / muzlatilgan-zona paneli (additive) ──

function VarianceConfigPanel({ plans }: { plans: Plan[] }) {
  // Farq avto-tasdiq chegarasi (egasi-DATA — Q-43 real saqlash)
  const [warehouseId, setWarehouseId]   = useState("");
  const [qtyPct, setQtyPct]             = useState("");
  const [valueUzs, setValueUzs]         = useState("");
  const [notes, setNotes]               = useState("");
  const [cfgLoading, setCfgLoading]     = useState(false);
  const [cfgSaving, setCfgSaving]       = useState(false);
  const [cfgMsg, setCfgMsg]             = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // Farq qarori (avto-tasdiq / eskalatsiya)
  const [decCountId, setDecCountId]     = useState("");
  const [decision, setDecision]         = useState<VarianceDecisionView | null>(null);
  const [decLoading, setDecLoading]     = useState(false);
  const [decErr, setDecErr]             = useState("");

  // Og'ish-sabab katalogi
  const [reasons, setReasons]           = useState<DeviationReason[]>([]);

  // Muzlatilgan zonalar
  const [zones, setZones]               = useState<FreezeZone[]>([]);
  const [zonesLoading, setZonesLoading] = useState(false);
  const [fzWh, setFzWh]                  = useState("");
  const [fzMat, setFzMat]               = useState("");
  const [fzReason, setFzReason]         = useState("");
  const [fzSaving, setFzSaving]         = useState(false);
  const [fzMsg, setFzMsg]               = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [releaseId, setReleaseId]       = useState<number | null>(null);

  const loadConfig = useCallback(async () => {
    setCfgLoading(true); setCfgMsg(null);
    try {
      const whNum = warehouseId.trim() !== "" ? Number(warehouseId) : null;
      const cfg = await varianceConfigApi.getConfig(whNum) as VarianceThreshold | null;
      setQtyPct(cfg?.autoApproveQtyPct != null ? String(cfg.autoApproveQtyPct) : "");
      setValueUzs(cfg?.autoApproveValueUzs != null ? String(cfg.autoApproveValueUzs) : "");
      setNotes(cfg?.notes ?? "");
    } catch { setCfgMsg({ kind: "err", text: "Konfiguratsiya yuklanmadi" }); }
    finally { setCfgLoading(false); }
  }, [warehouseId]);

  const loadReasons = useCallback(async () => {
    try { setReasons(await deviationApi.getReasons()); } catch { setReasons([]); }
  }, []);

  const loadZones = useCallback(async () => {
    setZonesLoading(true);
    try { setZones(await freezeZonesApi.getAll({ status: "ACTIVE" })); }
    catch { setZones([]); }
    finally { setZonesLoading(false); }
  }, []);

  useEffect(() => { void loadConfig(); void loadReasons(); void loadZones(); }, [loadConfig, loadReasons, loadZones]);

  async function saveConfig() {
    const q = Number(qtyPct), v = Number(valueUzs);
    if (!Number.isFinite(q) || q < 0) { setCfgMsg({ kind: "err", text: "Miqdor foizi noto'g'ri" }); return; }
    if (!Number.isFinite(v) || v < 0) { setCfgMsg({ kind: "err", text: "Qiymat (so'm) noto'g'ri" }); return; }
    setCfgSaving(true); setCfgMsg(null);
    try {
      await varianceConfigApi.saveConfig({
        warehouseId: warehouseId.trim() !== "" ? Number(warehouseId) : null,
        autoApproveQtyPct: q,
        autoApproveValueUzs: v,
        notes: notes.trim() || undefined,
      });
      setCfgMsg({ kind: "ok", text: "Saqlandi" });
    } catch (e) { setCfgMsg({ kind: "err", text: e instanceof Error ? e.message : "Xatolik" }); }
    finally { setCfgSaving(false); }
  }

  async function loadDecision() {
    const id = Number(decCountId);
    if (!Number.isFinite(id) || id <= 0) { setDecErr("Reja ID noto'g'ri"); return; }
    setDecLoading(true); setDecErr(""); setDecision(null);
    try { setDecision(await varianceConfigApi.getDecision(id)); }
    catch (e) { setDecErr(e instanceof Error ? e.message : "Xatolik"); }
    finally { setDecLoading(false); }
  }

  async function freezeZone() {
    const wh = Number(fzWh);
    if (!Number.isFinite(wh) || wh <= 0) { setFzMsg({ kind: "err", text: "Ombor ID majburiy" }); return; }
    setFzSaving(true); setFzMsg(null);
    try {
      await freezeZonesApi.freeze({
        warehouse_id: wh,
        material_id: fzMat.trim() !== "" ? Number(fzMat) : null,
        reason: fzReason.trim() || undefined,
      });
      setFzMsg({ kind: "ok", text: "Zona muzlatildi" });
      setFzMat(""); setFzReason("");
      void loadZones();
    } catch (e) { setFzMsg({ kind: "err", text: e instanceof Error ? e.message : "Xatolik" }); }
    finally { setFzSaving(false); }
  }

  async function releaseZone(id: number) {
    try { await freezeZonesApi.release(id); void loadZones(); }
    catch { setFzMsg({ kind: "err", text: "Muzdan chiqarib bo'lmadi" }); }
    finally { setReleaseId(null); }
  }

  const lbl = { fontSize: 11, color: "var(--pos-text-muted)", marginBottom: 4, display: "block" } as const;
  const planList = Array.isArray(plans) ? plans : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── Farq avto-tasdiq chegarasi (Q-43 real saqlash) ── */}
      <div className="pos-card">
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>⚙️ Farq avto-tasdiq chegarasi</div>
        <div style={{ fontSize: 12, color: "var(--pos-text-muted)", marginBottom: 12 }}>
          Inventar farqi shu chegara ichida bo'lsa avto-tasdiqlanadi; oshsa menejer-tasdiq (eskalatsiya).
          Ombor ID bo'sh = global standart.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={lbl}>Ombor ID (ixtiyoriy)</label>
            <input className="pos-input" placeholder="Global default" value={warehouseId}
              onChange={e => setWarehouseId(e.target.value)} onBlur={() => void loadConfig()} />
          </div>
          <div>
            <label style={lbl}>Miqdor farqi chegarasi (%)</label>
            <input className="pos-input" type="number" min={0} placeholder="0" value={qtyPct} onChange={e => setQtyPct(e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Qiymat farqi chegarasi (so'm)</label>
            <input className="pos-input" type="number" min={0} placeholder="0" value={valueUzs} onChange={e => setValueUzs(e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Izoh (ixtiyoriy)</label>
            <input className="pos-input" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        {cfgMsg && (
          <div style={{ fontSize: 12, marginBottom: 10, color: cfgMsg.kind === "ok" ? "var(--pos-success)" : "var(--pos-danger)" }}>
            {cfgMsg.text}
          </div>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="pos-btn pos-btn-ghost" disabled={cfgLoading} onClick={() => void loadConfig()}>
            {cfgLoading ? "…" : "Qayta yuklash"}
          </button>
          <button className="pos-btn pos-btn-primary" disabled={cfgSaving} onClick={() => void saveConfig()}>
            {cfgSaving ? "…" : "Saqlash"}
          </button>
        </div>
      </div>

      {/* ── Farq qarori (avto-tasdiq / eskalatsiya) ── */}
      <div className="pos-card">
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>🧮 Farq qarori (avto-tasdiq / eskalatsiya)</div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", marginBottom: 12, flexWrap: "wrap" }}>
          <div style={{ minWidth: 180 }}>
            <label style={lbl}>Inventarizatsiya rejasi</label>
            <select className="pos-input" value={decCountId} onChange={e => setDecCountId(e.target.value)}>
              <option value="">— tanlang —</option>
              {planList.map(p => (
                <option key={p.id} value={p.id}>{p.planNumber ?? `#${p.id}`}{p.warehouseId ? ` · ${p.warehouseId}` : ""}</option>
              ))}
            </select>
          </div>
          <button className="pos-btn pos-btn-primary" disabled={decLoading} onClick={() => void loadDecision()}>
            {decLoading ? "…" : "Qarorni ko'rish"}
          </button>
        </div>
        {decErr && <div style={{ fontSize: 12, color: "var(--pos-danger)", marginBottom: 8 }}>{decErr}</div>}
        {decision && (
          <div style={{ padding: 14, background: "rgba(0,0,0,0.2)", borderRadius: 10, border: "1px solid var(--pos-border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span className={`pos-badge ${decision.decision === "AUTO_APPROVE" ? "pos-badge-green" : "pos-badge-yellow"}`}>
                {decision.decision === "AUTO_APPROVE" ? "AVTO-TASDIQ" : "ESKALATSIYA (menejer-tasdiq)"}
              </span>
              <span style={{ fontSize: 12, color: "var(--pos-text-muted)" }}>
                {decision.varianceLineCount} satr · {decision.escalatedLines} eskalatsiya
              </span>
            </div>
            <div style={{ fontSize: 12, color: "var(--pos-text-muted)", marginBottom: 6 }}>
              Chegara: miqdor ≤ {decision.threshold?.autoApproveQtyPct ?? 0}% · qiymat ≤ {decision.threshold?.autoApproveValueUzs ?? 0} so'm
            </div>
            {Array.isArray(decision.reasons) && decision.reasons.length > 0 && (
              <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 12, color: "var(--pos-warning)" }}>
                {decision.reasons.map((r, i) => <li key={`rsn-${i}`}>{r}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* ── Og'ish-sabab katalogi ── */}
      <div className="pos-card">
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>📑 Og'ish-sabab katalogi</div>
        {reasons.length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--pos-text-muted)" }}>Katalog bo'sh</div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {reasons.map(r => (
              <span key={r.code} className="pos-badge pos-badge-gray" style={{ fontSize: 11 }} title={r.description ?? undefined}>
                <span className="pos-mono" style={{ color: "var(--pos-accent)" }}>{r.code}</span>
                {(r.nameUz ?? r.name) ? ` · ${r.nameUz ?? r.name}` : ""}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Muzlatilgan zonalar (sanash paytida) ── */}
      <div className="pos-card">
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>🧊 Muzlatilgan zonalar</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr) auto", gap: 10, alignItems: "flex-end", marginBottom: 12 }}>
          <div>
            <label style={lbl}>Ombor ID</label>
            <input className="pos-input" value={fzWh} onChange={e => setFzWh(e.target.value)} placeholder="masalan: 1" />
          </div>
          <div>
            <label style={lbl}>Material ID (ixtiyoriy)</label>
            <input className="pos-input" value={fzMat} onChange={e => setFzMat(e.target.value)} placeholder="butun zona uchun bo'sh" />
          </div>
          <div>
            <label style={lbl}>Sabab (ixtiyoriy)</label>
            <input className="pos-input" value={fzReason} onChange={e => setFzReason(e.target.value)} />
          </div>
          <button className="pos-btn pos-btn-primary" disabled={fzSaving} onClick={() => void freezeZone()}>
            {fzSaving ? "…" : "🧊 Muzlatish"}
          </button>
        </div>
        {fzMsg && (
          <div style={{ fontSize: 12, marginBottom: 10, color: fzMsg.kind === "ok" ? "var(--pos-success)" : "var(--pos-danger)" }}>
            {fzMsg.text}
          </div>
        )}
        {zonesLoading ? (
          <div style={{ fontSize: 12, color: "var(--pos-text-muted)" }}>Yuklanmoqda…</div>
        ) : zones.length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--pos-text-muted)" }}>Faol muzlatilgan zona yo'q</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="pos-table">
              <thead><tr><th>ID</th><th>Ombor</th><th>Material</th><th>Sabab</th><th>Amal</th></tr></thead>
              <tbody>
                {zones.map(z => (
                  <tr key={z.id}>
                    <td className="pos-mono" style={{ color: "var(--pos-accent)" }}>#{z.id}</td>
                    <td>{z.warehouseId}</td>
                    <td>{z.materialId != null ? `#${z.materialId}` : "— butun zona —"}</td>
                    <td style={{ fontSize: 12, color: "var(--pos-text-muted)" }}>{z.reason ?? "—"}</td>
                    <td>
                      <button className="pos-btn pos-btn-ghost" style={{ fontSize: 11, padding: "3px 8px" }} onClick={() => setReleaseId(z.id)}>
                        Muzdan chiqarish
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* O'chirish/muzdan-chiqarish tasdiqi (Q-14) */}
      {releaseId !== null && (
        <div className="pos-modal-overlay">
          <div className="pos-modal" style={{ maxWidth: 400 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Muzdan chiqarishni tasdiqlang</div>
            <div style={{ fontSize: 13, color: "var(--pos-text-muted)", marginBottom: 16 }}>
              #{releaseId} muzlatilgan zona qaytadan faollashtiriladi.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="pos-btn pos-btn-ghost" onClick={() => setReleaseId(null)}>Bekor</button>
              <button className="pos-btn pos-btn-primary" onClick={() => void releaseZone(releaseId)}>Tasdiqlash</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PosInventory() {
  const { t } = usePosI18n();
  const [tab, setTab]     = useState<"plans" | "active" | "variances" | "config">("plans");
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
      // BE getVarianceReport returns an OBJECT { ..., lines: VarianceLine[] }, not an array.
      const res = await inventoryApi.getVariance(planId) as { lines?: VarianceLine[] };
      setVariances(Array.isArray(res?.lines) ? res.lines : []);
      setTab("variances");
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
        <div className={`pos-tab ${tab === "config" ? "active" : ""}`} onClick={() => setTab("config")}>⚙️ Sozlamalar</div>
      </div>

      {loading && tab !== "config" && <div style={{ textAlign: "center", padding: 40, color: "var(--pos-text-muted)" }}>{t("common.loading")}</div>}

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
                  const diff = v.variance ?? (v.actualQty - v.systemQty);
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

      {tab === "config" && <VarianceConfigPanel plans={plans} />}

      {showNewPlan && <NewPlanModal onClose={() => setShowNewPlan(false)} onCreated={() => { setShowNewPlan(false); void loadData(); }} t={t} />}
    </div>
  );
}
