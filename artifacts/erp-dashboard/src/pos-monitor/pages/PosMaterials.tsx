import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { usePosI18n } from "../i18n/usePosI18n";
import { materialsApi } from "../api/pos-monitor.api";
import PosBarcodeScanner from "../components/PosBarcodeScanner";

interface Material { id: number; name: string; sku?: string; category?: string; unit?: string; minQty?: number; }
interface StockRow  { materialCardId: number; warehouseId: string; balance: number; }

const CAT_COLORS: Record<string, string> = {
  consumable: "pos-badge-green", asset: "pos-badge-blue", finished: "pos-badge-yellow",
};

export default function PosMaterials() {
  const [, navigate] = useLocation();
  const { t } = usePosI18n();
  const [materials, setMaterials]     = useState<Material[]>([]);
  const [stock, setStock]             = useState<StockRow[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [showScanner, setShowScanner] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [matData, stockData] = await Promise.all([
        materialsApi.getAll(),
        materialsApi.getStock(),
      ]).catch(() => [[], []]);
      setMaterials((Array.isArray(matData) ? matData : []) as Material[]);
      setStock((Array.isArray(stockData) ? stockData : []) as StockRow[]);
    } catch { /* noop */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  function getTotalStock(id: number): number {
    return (stock ?? []).filter(r => r.materialCardId === id).reduce((s, r) => s + (r.balance ?? 0), 0);
  }

  const filtered = (materials ?? []).filter(m =>
    search
      ? m.name?.toLowerCase().includes(search.toLowerCase()) ||
        m.sku?.toLowerCase().includes(search.toLowerCase())
      : true,
  );

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{t("materials.title")}</h2>
        <div style={{ flex: 1 }} />
        <input
          className="pos-input"
          style={{ width: 260 }}
          placeholder={`${t("materials.sku")}, ${t("materials.barcode")}, ${t("common.name")}`}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="pos-btn pos-btn-ghost" onClick={() => setShowScanner(true)}>📷 {t("materials.barcode")}</button>
        <button className="pos-btn pos-btn-primary" onClick={() => navigate("/pos-monitor/materials/new")}>
          ➕ {t("materials.newMaterial")}
        </button>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40, color: "var(--pos-text-muted)" }}>{t("common.loading")}</div>}

      {!loading && (
        <div className="pos-card" style={{ overflowX: "auto" }}>
          <table className="pos-table">
            <thead>
              <tr>
                <th>{t("materials.sku")}</th>
                <th>{t("common.name")}</th>
                <th>{t("materials.category")}</th>
                <th>{t("common.unit")}</th>
                <th>{t("materials.totalStock")}</th>
                <th>{t("materials.minQty")}</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {(filtered ?? []).map(m => {
                const total = getTotalStock(m.id);
                const isLow = m.minQty !== undefined && total < m.minQty;
                return (
                  <tr key={m.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/pos-monitor/materials/${m.id}`)}>
                    <td className="pos-mono" style={{ color: "var(--pos-accent)", fontWeight: 600 }}>{m.sku ?? `#${m.id}`}</td>
                    <td style={{ fontWeight: 500 }}>{m.name}</td>
                    <td>
                      {m.category && (
                        <span className={`pos-badge ${CAT_COLORS[m.category] ?? "pos-badge-gray"}`} style={{ fontSize: 10 }}>
                          {m.category}
                        </span>
                      )}
                    </td>
                    <td style={{ color: "var(--pos-text-muted)" }}>{m.unit}</td>
                    <td>
                      <span className="pos-mono" style={{ color: isLow ? "var(--pos-danger)" : "var(--pos-text)", fontWeight: isLow ? 700 : 400 }}>
                        {total.toFixed(2)}
                      </span>
                      {isLow && <span style={{ marginLeft: 6, fontSize: 10 }}>⚠️</span>}
                    </td>
                    <td className="pos-mono" style={{ color: "var(--pos-text-muted)" }}>{m.minQty ?? "—"}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="pos-btn pos-btn-ghost" style={{ padding: "3px 7px", fontSize: 12 }} onClick={() => navigate(`/pos-monitor/materials/${m.id}`)}>👁</button>
                        <button className="pos-btn pos-btn-ghost" style={{ padding: "3px 7px", fontSize: 12 }}>✏️</button>
                        <button className="pos-btn pos-btn-ghost" style={{ padding: "3px 7px", fontSize: 12 }}>🏷</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: 32, color: "var(--pos-text-muted)" }}>{t("common.noData")}</div>
          )}
        </div>
      )}

      {showScanner && <PosBarcodeScanner onClose={() => setShowScanner(false)} />}
    </div>
  );
}
