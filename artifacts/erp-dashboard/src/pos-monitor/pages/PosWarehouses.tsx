import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { usePosI18n } from "../i18n/usePosI18n";
import { warehousesApi } from "../api/pos-monitor.api";

interface StockRow { warehouseId: string; materialCardId: number; balance: number; }
interface WarehouseGroup { id: string; totalBalance: number; materialCount: number; pct: number; type: string; }

const WH_TYPE_COLORS: Record<string, string> = {
  MAIN: "var(--pos-accent)", QUARANTINE: "var(--pos-warning)", DEFECTIVE: "var(--pos-danger)", DEPARTMENT: "var(--pos-success)",
};
const WH_BADGE: Record<string, string> = {
  MAIN: "pos-badge-blue", QUARANTINE: "pos-badge-yellow", DEFECTIVE: "pos-badge-red", DEPARTMENT: "pos-badge-green",
};

function guessType(id: string): string {
  if (id.includes("QC") || id.includes("QUARANTINE")) return "QUARANTINE";
  if (id.includes("DEF") || id.includes("DEFECT")) return "DEFECTIVE";
  if (id.includes("DEPT") || id.includes("DEP")) return "DEPARTMENT";
  return "MAIN";
}

export default function PosWarehouses() {
  const [, navigate] = useLocation();
  const { t } = usePosI18n();
  const [warehouses, setWarehouses] = useState<WarehouseGroup[]>([]);
  const [loading, setLoading]       = useState(true);
  const [viewMode, setViewMode]     = useState<"grid" | "table">("grid");
  const [search, setSearch]         = useState("");

  const loadData = useCallback(async () => {
    try {
      const data = await warehousesApi.getAll();
      const rows  = (Array.isArray(data) ? data : []) as StockRow[];
      const map: Record<string, WarehouseGroup> = {};
      rows.forEach(r => {
        if (!map[r.warehouseId]) {
          map[r.warehouseId] = { id: r.warehouseId, totalBalance: 0, materialCount: 0, pct: 0, type: guessType(r.warehouseId) };
        }
        const wh = map[r.warehouseId];
        if (wh) { wh.totalBalance += r.balance; wh.materialCount += 1; }
      });
      const list = Object.values(map);
      const maxBalance = Math.max(...list.map(w => w.totalBalance), 1);
      list.forEach(w => { w.pct = Math.min(100, Math.round((w.totalBalance / maxBalance) * 100)); });
      setWarehouses(list);
    } catch { /* noop */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const filtered = (warehouses ?? []).filter(w =>
    search ? w.id.toLowerCase().includes(search.toLowerCase()) : true,
  );

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{t("warehouses.title")}</h2>
        <div style={{ flex: 1 }} />
        <input className="pos-input" style={{ width: 220 }} placeholder={t("common.search")} value={search} onChange={e => setSearch(e.target.value)} />
        <button className={`pos-btn ${viewMode === "grid" ? "pos-btn-primary" : "pos-btn-ghost"}`} onClick={() => setViewMode("grid")}>▦</button>
        <button className={`pos-btn ${viewMode === "table" ? "pos-btn-primary" : "pos-btn-ghost"}`} onClick={() => setViewMode("table")}>☰</button>
      </div>

      {loading && <div style={{ color: "var(--pos-text-muted)", textAlign: "center", padding: 40 }}>{t("common.loading")}</div>}

      {!loading && viewMode === "grid" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
          {(filtered ?? []).map(wh => (
            <div key={wh.id} className="pos-card pos-fade-in" style={{ cursor: "pointer" }} onClick={() => navigate(`/pos-monitor/warehouses/${wh.id}`)}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontWeight: 600, fontSize: 15, color: "var(--pos-text)" }}>{wh.id}</span>
                <span className={`pos-badge ${WH_BADGE[wh.type] ?? "pos-badge-gray"}`}>
                  {t(`warehouses.type.${wh.type}`)}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--pos-text-muted)" }}>{t("warehouses.totalMaterials")}</div>
                  <div className="pos-mono" style={{ fontSize: 18, fontWeight: 600, color: "var(--pos-accent)" }}>{wh.materialCount}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--pos-text-muted)" }}>{t("warehouses.totalValue")}</div>
                  <div className="pos-mono" style={{ fontSize: 16, fontWeight: 600 }}>{wh.totalBalance.toFixed(0)}</div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--pos-text-muted)", marginBottom: 6 }}>
                  {t("warehouses.stockLevel")} — {wh.pct}%
                </div>
                <div className="pos-progress">
                  <div
                    className={`pos-progress-fill ${wh.pct > 60 ? "green" : wh.pct > 30 ? "yellow" : "red"}`}
                    style={{ width: `${wh.pct}%` }}
                  />
                </div>
              </div>
              <button
                className="pos-btn pos-btn-ghost"
                style={{ marginTop: 14, width: "100%", justifyContent: "center", fontSize: 12 }}
                onClick={e => { e.stopPropagation(); navigate(`/pos-monitor/warehouses/${wh.id}`); }}
              >
                👁 {t("warehouses.enter")}
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && viewMode === "table" && (
        <div className="pos-card" style={{ overflowX: "auto" }}>
          <table className="pos-table">
            <thead>
              <tr>
                <th>{t("warehouses.title")}</th>
                <th>{t("common.status")}</th>
                <th>{t("warehouses.totalMaterials")}</th>
                <th>{t("warehouses.totalValue")}</th>
                <th>{t("warehouses.stockLevel")}</th>
                <th>{t("common.action")}</th>
              </tr>
            </thead>
            <tbody>
              {(filtered ?? []).map(wh => (
                <tr key={wh.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/pos-monitor/warehouses/${wh.id}`)}>
                  <td style={{ fontWeight: 600, color: "var(--pos-text)" }}>{wh.id}</td>
                  <td><span className={`pos-badge ${WH_BADGE[wh.type] ?? "pos-badge-gray"}`}>{t(`warehouses.type.${wh.type}`)}</span></td>
                  <td className="pos-mono">{wh.materialCount}</td>
                  <td className="pos-mono">{wh.totalBalance.toFixed(0)}</td>
                  <td style={{ minWidth: 100 }}>
                    <div className="pos-progress">
                      <div className={`pos-progress-fill ${wh.pct > 60 ? "green" : wh.pct > 30 ? "yellow" : "red"}`} style={{ width: `${wh.pct}%` }} />
                    </div>
                  </td>
                  <td>
                    <button className="pos-btn pos-btn-ghost" style={{ fontSize: 11, padding: "4px 8px" }} onClick={e => { e.stopPropagation(); navigate(`/pos-monitor/warehouses/${wh.id}`); }}>
                      👁 {t("warehouses.enter")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: "center", color: "var(--pos-text-muted)", padding: 40 }}>{t("common.noData")}</div>
      )}
    </div>
  );
}
