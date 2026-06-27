/**
 * @module PosMaterialDetail
 * @description React page component. Route-level UI.
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { usePosI18n } from "../i18n/usePosI18n";
import { materialsApi, movementsApi, stockApi } from "../api/pos-monitor.api";
import {
  materialLifeExtraApi, MATERIAL_OWNER_TYPES, MATERIAL_HAZARD_CLASSES,
  type MaterialLife, type Substitute, type MaterialLifeUpdate,
} from "../api/pos-wms-extra.api";

interface StockRow  { materialCardId: number; warehouseId: string; balance: number; }
interface Movement  { id: number; movementNumber?: string; movementType: string; status: string; createdAt: string; totalAmount?: number; }

// ─── FE-P2: Material hayot-tsikli paneli (atribut + analog) — additive ────────

function LifeCyclePanel({ matId }: { matId: number }) {
  const [life, setLife]         = useState<MaterialLife | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // Tahrir holati (faqat berilgan maydonlar yangilanadi — BE .strict() PATCH)
  const [ownerType, setOwnerType]               = useState<string>("own");
  const [hazardClass, setHazardClass]           = useState<string>("");
  const [storageCondition, setStorageCondition] = useState<string>("");
  const [ageAlertDays, setAgeAlertDays]         = useState<string>("");
  const [isRecyclable, setIsRecyclable]         = useState(false);
  const [palletUnitQty, setPalletUnitQty]       = useState<string>("");
  const [isSample, setIsSample]                 = useState(false);

  // Analoglar (substitute)
  const [subs, setSubs]             = useState<Substitute[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [newSubId, setNewSubId]     = useState("");
  const [newSubPrio, setNewSubPrio] = useState("");
  const [newSubNotes, setNewSubNotes] = useState("");
  const [subSaving, setSubSaving]   = useState(false);
  const [subMsg, setSubMsg]         = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [removeSubId, setRemoveSubId] = useState<number | null>(null);

  const applyLife = useCallback((d: MaterialLife | null) => {
    setLife(d);
    setOwnerType(d?.ownerType ?? "own");
    setHazardClass(d?.hazardClass ?? "");
    setStorageCondition(d?.storageCondition ?? "");
    setAgeAlertDays(d?.ageAlertDays != null ? String(d.ageAlertDays) : "");
    setIsRecyclable(Boolean(d?.isRecyclable));
    setPalletUnitQty(d?.palletUnitQty != null ? String(d.palletUnitQty) : "");
    setIsSample(Boolean(d?.isSample));
  }, []);

  const loadLife = useCallback(async () => {
    setLoading(true); setMsg(null);
    try { applyLife(await materialLifeExtraApi.getLife(matId)); }
    catch (e) { setMsg({ kind: "err", text: e instanceof Error ? e.message : "Yuklanmadi" }); }
    finally { setLoading(false); }
  }, [matId, applyLife]);

  const loadSubs = useCallback(async () => {
    setSubsLoading(true);
    try { setSubs(await materialLifeExtraApi.listSubstitutes(matId)); }
    catch { setSubs([]); }
    finally { setSubsLoading(false); }
  }, [matId]);

  useEffect(() => { void loadLife(); void loadSubs(); }, [loadLife, loadSubs]);

  async function saveLife() {
    setSaving(true); setMsg(null);
    const body: MaterialLifeUpdate = {
      ownerType: (ownerType === "own" || ownerType === "customer") ? ownerType : "own",
      hazardClass: hazardClass.trim() !== "" ? hazardClass : null,
      storageCondition: storageCondition.trim() !== "" ? storageCondition : null,
      ageAlertDays: ageAlertDays.trim() !== "" ? Number(ageAlertDays) : null,
      isRecyclable,
      palletUnitQty: palletUnitQty.trim() !== "" ? Number(palletUnitQty) : null,
      isSample,
    };
    try {
      applyLife(await materialLifeExtraApi.updateLife(matId, body));
      setMsg({ kind: "ok", text: "Saqlandi" });
    } catch (e) { setMsg({ kind: "err", text: e instanceof Error ? e.message : "Xatolik" }); }
    finally { setSaving(false); }
  }

  async function addSub() {
    const id = Number(newSubId);
    if (!Number.isFinite(id) || id <= 0) { setSubMsg({ kind: "err", text: "Analog material ID noto'g'ri" }); return; }
    setSubSaving(true); setSubMsg(null);
    try {
      await materialLifeExtraApi.addSubstitute(matId, {
        substituteId: id,
        priority: newSubPrio.trim() !== "" ? Number(newSubPrio) : undefined,
        notes: newSubNotes.trim() || undefined,
      });
      setSubMsg({ kind: "ok", text: "Analog qo'shildi" });
      setNewSubId(""); setNewSubPrio(""); setNewSubNotes("");
      void loadSubs();
    } catch (e) { setSubMsg({ kind: "err", text: e instanceof Error ? e.message : "Xatolik" }); }
    finally { setSubSaving(false); }
  }

  async function removeSub(id: number) {
    try { await materialLifeExtraApi.removeSubstitute(id); void loadSubs(); }
    catch { setSubMsg({ kind: "err", text: "O'chirib bo'lmadi" }); }
    finally { setRemoveSubId(null); }
  }

  const lbl = { fontSize: 11, color: "var(--pos-text-muted)", marginBottom: 4, display: "block" } as const;
  const hazardBadge = hazardClass ? "pos-badge-red" : "pos-badge-gray";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── Ko'rsatkichlar (yosh/xavf) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        <div className="pos-card" style={{ padding: "12px 14px" }}>
          <div style={{ fontSize: 11, color: "var(--pos-text-muted)" }}>Egalik turi</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "var(--pos-accent)" }}>
            {life?.ownerType === "customer" ? "Mijoz-moli (davalcheskiy)" : "Bizniki"}
          </div>
        </div>
        <div className="pos-card" style={{ padding: "12px 14px" }}>
          <div style={{ fontSize: 11, color: "var(--pos-text-muted)" }}>Xavf-sinfi</div>
          <div style={{ marginTop: 4 }}>
            <span className={`pos-badge ${hazardBadge}`} style={{ fontSize: 11 }}>
              {hazardClass || "xavfsiz"}
            </span>
          </div>
        </div>
        <div className="pos-card" style={{ padding: "12px 14px" }}>
          <div style={{ fontSize: 11, color: "var(--pos-text-muted)" }}>Yosh ogohlantirishi</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: ageAlertDays ? "var(--pos-warning)" : "var(--pos-text)" }}>
            {ageAlertDays ? `${ageAlertDays} kun` : "—"}
          </div>
        </div>
      </div>

      {/* ── Atributlarni tahrirlash (Q-43 real saqlash) ── */}
      <div className="pos-card">
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>♻️ Hayot-tsikli atributlari</div>
        {loading ? (
          <div style={{ fontSize: 12, color: "var(--pos-text-muted)" }}>Yuklanmoqda…</div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={lbl}>Egalik turi</label>
                <select className="pos-input" value={ownerType} onChange={e => setOwnerType(e.target.value)}>
                  {MATERIAL_OWNER_TYPES.map(o => (
                    <option key={o} value={o}>{o === "own" ? "Bizniki" : "Mijoz-moli"}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl}>Xavf-sinfi</label>
                <select className="pos-input" value={hazardClass} onChange={e => setHazardClass(e.target.value)}>
                  <option value="">— xavfsiz —</option>
                  {MATERIAL_HAZARD_CLASSES.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Saqlash sharti</label>
                <input className="pos-input" value={storageCondition} onChange={e => setStorageCondition(e.target.value)} placeholder="masalan: +5..+25°C, quruq" />
              </div>
              <div>
                <label style={lbl}>Yosh ogohlantirishi (kun)</label>
                <input className="pos-input" type="number" min={1} value={ageAlertDays} onChange={e => setAgeAlertDays(e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Poddon birlik miqdori</label>
                <input className="pos-input" type="number" min={0} step="0.001" value={palletUnitQty} onChange={e => setPalletUnitQty(e.target.value)} />
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                  <input type="checkbox" checked={isRecyclable} onChange={e => setIsRecyclable(e.target.checked)} /> Qayta-ishlatiladigan
                </label>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                  <input type="checkbox" checked={isSample} onChange={e => setIsSample(e.target.checked)} /> Namuna
                </label>
              </div>
            </div>
            {msg && (
              <div style={{ fontSize: 12, marginBottom: 10, color: msg.kind === "ok" ? "var(--pos-success)" : "var(--pos-danger)" }}>{msg.text}</div>
            )}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="pos-btn pos-btn-ghost" disabled={loading} onClick={() => void loadLife()}>Qayta yuklash</button>
              <button className="pos-btn pos-btn-primary" disabled={saving} onClick={() => void saveLife()}>{saving ? "…" : "Saqlash"}</button>
            </div>
          </>
        )}
      </div>

      {/* ── Analoglar (substitute) CRUD ── */}
      <div className="pos-card">
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>🔁 Analoglar (o'rnini bosuvchi materiallar)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, alignItems: "flex-end", marginBottom: 12 }}>
          <div>
            <label style={lbl}>Analog material ID</label>
            <input className="pos-input" value={newSubId} onChange={e => setNewSubId(e.target.value)} placeholder="masalan: 42" />
          </div>
          <div>
            <label style={lbl}>Prioritet (kichik = afzal)</label>
            <input className="pos-input" type="number" min={0} value={newSubPrio} onChange={e => setNewSubPrio(e.target.value)} placeholder="100" />
          </div>
          <div>
            <label style={lbl}>Izoh (ixtiyoriy)</label>
            <input className="pos-input" value={newSubNotes} onChange={e => setNewSubNotes(e.target.value)} />
          </div>
          <button className="pos-btn pos-btn-primary" disabled={subSaving} onClick={() => void addSub()}>{subSaving ? "…" : "➕ Qo'shish"}</button>
        </div>
        {subMsg && (
          <div style={{ fontSize: 12, marginBottom: 10, color: subMsg.kind === "ok" ? "var(--pos-success)" : "var(--pos-danger)" }}>{subMsg.text}</div>
        )}
        {subsLoading ? (
          <div style={{ fontSize: 12, color: "var(--pos-text-muted)" }}>Yuklanmoqda…</div>
        ) : subs.length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--pos-text-muted)" }}>Analog qo'shilmagan</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="pos-table">
              <thead><tr><th>Analog</th><th>Nomi</th><th>Prioritet</th><th>Tasdiq</th><th>Izoh</th><th>Amal</th></tr></thead>
              <tbody>
                {subs.map(s => (
                  <tr key={s.id}>
                    <td className="pos-mono" style={{ color: "var(--pos-accent)" }}>#{s.substituteId}</td>
                    <td>{s.substituteName ?? "—"}</td>
                    <td className="pos-mono">{s.priority}</td>
                    <td>
                      <span className={`pos-badge ${s.isApproved ? "pos-badge-green" : "pos-badge-yellow"}`} style={{ fontSize: 10 }}>
                        {s.isApproved ? "tasdiqlangan" : "kutilmoqda"}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--pos-text-muted)" }}>{s.notes ?? "—"}</td>
                    <td>
                      <button className="pos-btn pos-btn-ghost" style={{ fontSize: 11, padding: "3px 8px" }} onClick={() => setRemoveSubId(s.id)}>
                        O'chirish
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* O'chirish tasdiqi (Q-14) */}
      {removeSubId !== null && (
        <div className="pos-modal-overlay">
          <div className="pos-modal" style={{ maxWidth: 400 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>O'chirishni tasdiqlang</div>
            <div style={{ fontSize: 13, color: "var(--pos-text-muted)", marginBottom: 16 }}>
              Analog juftlik o'chiriladi. Bu amalni qaytarib bo'lmaydi.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="pos-btn pos-btn-ghost" onClick={() => setRemoveSubId(null)}>Bekor</button>
              <button className="pos-btn pos-btn-primary" onClick={() => void removeSub(removeSubId)}>O'chirish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PosMaterialDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { t } = usePosI18n();
  const matId = parseInt(params.id ?? "0", 10);
  const [tab, setTab]           = useState<"general" | "stock" | "history" | "analytics" | "lifecycle">("general");
  const [stock, setStock]       = useState<StockRow[]>([]);
  const [history, setHistory]   = useState<Movement[]>([]);
  const [loading, setLoading]   = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [stockData, movData] = await Promise.all([
        stockApi.getAll(),
        movementsApi.getAll(),
      ]).catch(() => [[], []]);
      const allStock = (Array.isArray(stockData) ? stockData : []) as StockRow[];
      setStock(allStock.filter(r => r.materialCardId === matId));
      const allMov = (Array.isArray(movData) ? movData : []) as Movement[];
      setHistory(allMov.slice(0, 20));
    } catch { /* noop */ } finally { setLoading(false); }
  }, [matId]);

  useEffect(() => { void loadData(); }, [loadData]);

  const totalBalance = (Array.isArray(stock) ? stock : []).reduce((s, r) => s + (r.balance ?? 0), 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button className="pos-btn pos-btn-ghost" style={{ padding: "6px 10px" }} onClick={() => navigate("/pos-monitor/materials")}>← {t("common.back")}</button>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Material #{matId}</h2>
        <div style={{ flex: 1 }} />
        <div className="pos-card" style={{ padding: "8px 16px", display: "inline-flex", gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, color: "var(--pos-text-muted)" }}>{t("jamiStok")}</div>
            <div className="pos-mono" style={{ fontWeight: 700, color: "var(--pos-accent)", fontSize: 18 }}>{totalBalance.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="pos-tabs">
        <div className={`pos-tab ${tab === "general" ? "active" : ""}`} onClick={() => setTab("general")}>{t("umumiy")}</div>
        <div className={`pos-tab ${tab === "stock" ? "active" : ""}`} onClick={() => setTab("stock")}>{t("stok")}</div>
        <div className={`pos-tab ${tab === "history" ? "active" : ""}`} onClick={() => setTab("history")}>{t("harakatTarixi")}</div>
        <div className={`pos-tab ${tab === "analytics" ? "active" : ""}`} onClick={() => setTab("analytics")}>{t('common.analytics')}</div>
        <div className={`pos-tab ${tab === "lifecycle" ? "active" : ""}`} onClick={() => setTab("lifecycle")}>♻️ Hayot-tsikli</div>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40, color: "var(--pos-text-muted)" }}>{t("common.loading")}</div>}

      {!loading && tab === "general" && (
        <div className="pos-card">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--pos-text-muted)", marginBottom: 4 }}>{t('common.materialId')}</div>
              <div className="pos-mono" style={{ fontSize: 18, fontWeight: 700, color: "var(--pos-accent)" }}>#{matId}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--pos-text-muted)", marginBottom: 4 }}>{t("jamiStok")}</div>
              <div className="pos-mono" style={{ fontSize: 18, fontWeight: 700 }}>{totalBalance.toFixed(3)}</div>
            </div>
          </div>
          <div style={{ marginTop: 20, padding: "16px", background: "rgba(0,212,255,0.05)", borderRadius: 10, border: "1px solid rgba(0,212,255,0.15)" }}>
            <div style={{ fontSize: 11, color: "var(--pos-text-muted)", marginBottom: 8 }}>{t("barcode2")}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: 28, letterSpacing: 6, color: "var(--pos-text)", border: "1px solid var(--pos-border)", borderRadius: 6, padding: "8px 16px", background: "rgba(0,0,0,0.3)" }}>
                {String(matId).padStart(8, "0")}
              </div>
              <div style={{ fontSize: 12, color: "var(--pos-text-muted)" }}>
                <div>{t("materialId2")}<span className="pos-mono" style={{ color: "var(--pos-accent)" }}>#{matId}</span></div>
                <div>{t("jamiStok1")}<span className="pos-mono" style={{ color: "var(--pos-success)" }}>{totalBalance.toFixed(3)}</span></div>
                <div>{stock.length} ta ombordan</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && tab === "stock" && (
        <div className="pos-card" style={{ overflowX: "auto" }}>
          <table className="pos-table">
            <thead>
              <tr>
                <th>{t("ombor")}</th>
                <th>{t("balans")}</th>
                <th>{t("Amallar")}</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(stock) ? stock : []).map(r => (
                <tr key={`${r.warehouseId}-${r.materialCardId}`}>
                  <td>
                    <button className="pos-btn pos-btn-ghost" style={{ fontSize: 11, padding: "2px 8px" }} onClick={() => navigate(`/pos-monitor/warehouses/${r.warehouseId}`)}>
                      {r.warehouseId}
                    </button>
                  </td>
                  <td className="pos-mono" style={{ fontWeight: 600, color: r.balance > 0 ? "var(--pos-success)" : "var(--pos-danger)" }}>
                    {r.balance?.toFixed(3) ?? "0"}
                  </td>
                  <td>
                    <button className="pos-btn pos-btn-ghost" style={{ fontSize: 11, padding: "2px 8px" }} onClick={() => navigate(`/pos-monitor/movements/new?mat=${matId}&wh=${r.warehouseId}`)}>
                      {t("harakat1")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {stock.length === 0 && <div style={{ textAlign: "center", padding: 24, color: "var(--pos-text-muted)" }}>{t("common.noData")}</div>}
        </div>
      )}

      {!loading && tab === "history" && (
        <div className="pos-card" style={{ overflowX: "auto" }}>
          <table className="pos-table">
            <thead>
              <tr><th>{t('common.docNo')}</th><th>{t("tur")}</th><th>{t('common.status1')}</th><th>{t("summa")}</th><th>{t("date")}</th></tr>
            </thead>
            <tbody>
              {(Array.isArray(history) ? history : []).map(m => (
                <tr key={m.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/pos-monitor/movements/${m.id}`)}>
                  <td className="pos-mono" style={{ color: "var(--pos-accent)" }}>{m.movementNumber ?? `#${m.id}`}</td>
                  <td><span className="pos-badge pos-badge-blue" style={{ fontSize: 10 }}>{m.movementType}</span></td>
                  <td><span className="pos-badge pos-badge-gray" style={{ fontSize: 10 }}>{m.status}</span></td>
                  <td className="pos-mono">{m.totalAmount?.toFixed(0) ?? "—"}</td>
                  <td style={{ color: "var(--pos-text-muted)", fontSize: 12 }}>{new Date(m.createdAt).toLocaleDateString("uz-UZ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && tab === "analytics" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* ABC Classification */}
          <div className="pos-card">
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>{t("abcTahlil")}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
              {[
                { cls: "A", color: "var(--pos-success)", desc: "Yuqori qiymat (>80%)", pct: 80 },
                { cls: "B", color: "var(--pos-warning)", desc: "O'rta qiymat (15%)", pct: 15 },
                { cls: "C", color: "var(--pos-danger)",  desc: "Past qiymat (<5%)",   pct: 5 },
              ].map(({ cls, color, desc, pct }) => (
                <div key={cls} style={{ textAlign: "center", padding: "16px", background: "rgba(0,0,0,0.2)", borderRadius: 10, border: `1px solid ${color}33` }}>
                  <div style={{ fontSize: 36, fontWeight: 900, color }}>{cls}</div>
                  <div style={{ fontSize: 11, color: "var(--pos-text-muted)", marginTop: 4 }}>{desc}</div>
                  <div style={{ marginTop: 8, height: 4, borderRadius: 4, background: "var(--pos-border)" }}>
                    <div style={{ height: "100%", borderRadius: 4, background: color, width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Turnover stats */}
          <div className="pos-card">
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>{t("oborotKorsatkichlari")}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--pos-text-muted)", marginBottom: 4 }}>{t("umumiyHarakatlar")}</div>
                <div className="pos-mono" style={{ fontSize: 22, fontWeight: 700, color: "var(--pos-accent)" }}>
                  {history.length}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--pos-text-muted)", marginBottom: 4 }}>Jami aylanma (UZS)</div>
                <div className="pos-mono" style={{ fontSize: 22, fontWeight: 700, color: "var(--pos-success)" }}>
                  {new Intl.NumberFormat("uz-UZ").format(history.reduce((s, m) => s + (m.totalAmount ?? 0), 0))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--pos-text-muted)", marginBottom: 4 }}>{t("stokOmborlarda")}</div>
                <div className="pos-mono" style={{ fontSize: 22, fontWeight: 700, color: "var(--pos-warning)" }}>
                  {stock.length}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--pos-text-muted)", marginBottom: 4 }}>{t("jamiBalans")}</div>
                <div className="pos-mono" style={{ fontSize: 22, fontWeight: 700 }}>
                  {totalBalance.toFixed(3)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "lifecycle" && <LifeCyclePanel matId={matId} />}
    </div>
  );
}
