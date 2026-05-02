import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { usePosI18n } from "../i18n/usePosI18n";
import { movementsApi } from "../api/pos-monitor.api";

interface Movement { id: number; movementNumber?: string; movementType: string; status: string; fromWarehouseId?: string; toWarehouseId?: string; totalAmount?: number; createdAt: string; createdBy?: number; }

const STATUS_BADGE: Record<string, string> = {
  draft: "pos-badge-gray", pending: "pos-badge-yellow", approved: "pos-badge-green",
  completed: "pos-badge-green", cancelled: "pos-badge-red", qc_pending: "pos-badge-yellow",
  qc_approved: "pos-badge-green", ai_processing: "pos-badge-blue",
};

const TYPE_COLOR: Record<string, string> = {
  EXTERNAL_IN: "#00FF94", EXTERNAL_OUT: "#FF4757", INTERNAL_ISSUE: "#FFB800",
  INTERNAL_RETURN: "#00D4FF", INTERNAL_TRANSFER: "#9B59B6", DAMAGE: "#FF4757",
};

export default function PosMovements() {
  const [, navigate] = useLocation();
  const { t } = usePosI18n();
  const [movements, setMovements]   = useState<Movement[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [expanded, setExpanded]     = useState<number[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await movementsApi.getAll();
      setMovements((Array.isArray(data) ? data : []) as Movement[]);
    } catch { /* noop */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const filtered = (movements ?? []).filter(m => {
    if (search && !(m.movementNumber ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType && m.movementType !== filterType) return false;
    if (filterStatus && m.status !== filterStatus) return false;
    return true;
  });

  function toggleExpand(id: number) {
    setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  const TYPES = ["EXTERNAL_IN","EXTERNAL_OUT","INTERNAL_ISSUE","INTERNAL_RETURN","INTERNAL_TRANSFER","DAMAGE"];
  const STATUSES = ["draft","pending","approved","completed","cancelled","qc_pending"];

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{t("movements.title")}</h2>
        <div style={{ flex: 1 }} />
        <input className="pos-input" style={{ width: 220 }} placeholder="Doc No qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
        <button className="pos-btn pos-btn-ghost" onClick={() => setShowFilter(f => !f)}>🔽 {t("common.filter")}</button>
        <button className="pos-btn pos-btn-ghost" onClick={() => void loadData()}>🔄</button>
        <button className="pos-btn pos-btn-primary" onClick={() => navigate("/pos-monitor/movements/new")}>
          ➕ {t("movements.newMovement")}
        </button>
      </div>

      {/* Filter panel */}
      {showFilter && (
        <div className="pos-card pos-fade-in" style={{ marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div>
            <label style={{ fontSize: 11, color: "var(--pos-text-muted)", marginBottom: 4, display: "block" }}>{t("movements.movementType")}</label>
            <select className="pos-input" style={{ width: 180 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">Barchasi</option>
              {TYPES.map(tp => <option key={tp} value={tp}>{t(`movType.${tp}`)}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "var(--pos-text-muted)", marginBottom: 4, display: "block" }}>{t("common.status")}</label>
            <select className="pos-input" style={{ width: 160 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">Barchasi</option>
              {STATUSES.map(s => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
            </select>
          </div>
          <button className="pos-btn pos-btn-ghost" style={{ alignSelf: "flex-end" }} onClick={() => { setFilterType(""); setFilterStatus(""); }}>
            ✕ Tozalash
          </button>
        </div>
      )}

      {loading && <div style={{ textAlign: "center", padding: 40, color: "var(--pos-text-muted)" }}>{t("common.loading")}</div>}

      {!loading && (
        <div className="pos-card" style={{ overflowX: "auto" }}>
          <table className="pos-table">
            <thead>
              <tr>
                <th></th>
                <th>№</th>
                <th>{t("movements.movementType")}</th>
                <th>{t("common.status")}</th>
                <th>Kimdan</th>
                <th>Qayerga</th>
                <th>{t("common.amount")}</th>
                <th>{t("common.date")}</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {(filtered ?? []).map(m => (
                <>
                  <tr
                    key={m.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/pos-monitor/movements/${m.id}`)}
                  >
                    <td onClick={e => { e.stopPropagation(); toggleExpand(m.id); }}>
                      <span style={{ cursor: "pointer", fontSize: 10 }}>{expanded.includes(m.id) ? "▼" : "▶"}</span>
                    </td>
                    <td className="pos-mono" style={{ color: "var(--pos-accent)", fontWeight: 600 }}>{m.movementNumber ?? `#${m.id}`}</td>
                    <td>
                      <span className="pos-badge pos-badge-blue" style={{ fontSize: 10, borderColor: TYPE_COLOR[m.movementType] ?? "var(--pos-border)", color: TYPE_COLOR[m.movementType] ?? "var(--pos-accent)" }}>
                        {t(`movType.${m.movementType}`)}
                      </span>
                    </td>
                    <td><span className={`pos-badge ${STATUS_BADGE[m.status] ?? "pos-badge-gray"}`} style={{ fontSize: 10 }}>{t(`status.${m.status}`)}</span></td>
                    <td style={{ color: "var(--pos-text-muted)", fontSize: 12 }}>{m.fromWarehouseId ?? "—"}</td>
                    <td style={{ color: "var(--pos-text-muted)", fontSize: 12 }}>{m.toWarehouseId ?? "—"}</td>
                    <td className="pos-mono">{m.totalAmount?.toFixed(0) ?? "0"}</td>
                    <td style={{ color: "var(--pos-text-muted)", fontSize: 12 }}>{new Date(m.createdAt).toLocaleDateString("uz-UZ")}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <button className="pos-btn pos-btn-ghost" style={{ fontSize: 11, padding: "3px 8px" }} onClick={() => navigate(`/pos-monitor/movements/${m.id}`)}>👁</button>
                    </td>
                  </tr>
                  {expanded.includes(m.id) && (
                    <tr key={`expand-${m.id}`} style={{ background: "rgba(0,212,255,0.03)" }}>
                      <td colSpan={9} style={{ padding: "12px 24px" }}>
                        <div style={{ fontSize: 12, color: "var(--pos-text-muted)" }}>
                          Harakat #{m.id} tafsilotlari · Sana: {new Date(m.createdAt).toLocaleString("uz-UZ")} ·
                          <button className="pos-btn pos-btn-ghost" style={{ fontSize: 11, padding: "2px 8px", marginLeft: 8 }} onClick={() => navigate(`/pos-monitor/movements/${m.id}`)}>
                            To'liq ko'rish →
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: 32, color: "var(--pos-text-muted)" }}>{t("common.noData")}</div>
          )}
        </div>
      )}
    </div>
  );
}
