import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { usePosI18n } from "../i18n/usePosI18n";
import { stockApi, movementsApi } from "../api/pos-monitor.api";

interface StockRow { materialCardId: number; warehouseId: string; balance: number; }
interface Movement { id: number; movementNumber?: string; movementType: string; status: string; totalAmount?: number; createdAt: string; }

const STATUS_BADGE: Record<string, string> = {
  draft: "pos-badge-gray", pending: "pos-badge-yellow", approved: "pos-badge-green",
  completed: "pos-badge-green", cancelled: "pos-badge-red", qc_pending: "pos-badge-yellow",
};

export default function PosWarehouseDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { t } = usePosI18n();
  const whId = params.id ?? "";
  const [tab, setTab]             = useState<"stock" | "movements" | "bins">("stock");
  const [stock, setStock]         = useState<StockRow[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [stockData, movData] = await Promise.all([
        stockApi.getAll(),
        movementsApi.getAll({ fromWarehouseId: whId, limit: "50" }),
      ]).catch(() => [[], []]);
      const allStock = (Array.isArray(stockData) ? stockData : []) as StockRow[];
      setStock(allStock.filter(r => r.warehouseId === whId));
      setMovements((Array.isArray(movData) ? movData : []) as Movement[]);
    } catch { /* noop */ } finally { setLoading(false); }
  }, [whId]);

  useEffect(() => { void loadData(); }, [loadData]);

  const filtered = (stock ?? []).filter(r =>
    search ? String(r.materialCardId).includes(search) : true,
  );

  const totalBalance = (stock ?? []).reduce((s, r) => s + (r.balance ?? 0), 0);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button className="pos-btn pos-btn-ghost" style={{ padding: "6px 10px" }} onClick={() => navigate("/pos-monitor/warehouses")}>← {t("common.back")}</button>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{whId}</h2>
        <div style={{ flex: 1 }} />
        <div className="pos-card" style={{ padding: "8px 16px", display: "inline-flex", gap: 20 }}>
          <div>
            <div style={{ fontSize: 10, color: "var(--pos-text-muted)" }}>{t("warehouses.totalMaterials")}</div>
            <div className="pos-mono" style={{ fontWeight: 700, color: "var(--pos-accent)" }}>{stock.length}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "var(--pos-text-muted)" }}>{t("warehouses.totalValue")}</div>
            <div className="pos-mono" style={{ fontWeight: 700 }}>{totalBalance.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="pos-tabs">
        <div className={`pos-tab ${tab === "stock" ? "active" : ""}`} onClick={() => setTab("stock")}>📦 Stok</div>
        <div className={`pos-tab ${tab === "movements" ? "active" : ""}`} onClick={() => setTab("movements")}>🔄 {t("nav.movements")}</div>
        <div className={`pos-tab ${tab === "bins" ? "active" : ""}`} onClick={() => setTab("bins")}>🗂 Zonalar/Bin</div>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40, color: "var(--pos-text-muted)" }}>{t("common.loading")}</div>}

      {!loading && tab === "stock" && (
        <>
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <input className="pos-input" style={{ width: 280 }} placeholder={t("common.search")} value={search} onChange={e => setSearch(e.target.value)} />
            <button className="pos-btn pos-btn-ghost" onClick={() => void loadData()}>🔄 {t("common.refresh")}</button>
          </div>
          <div className="pos-card" style={{ overflowX: "auto" }}>
            <table className="pos-table">
              <thead>
                <tr>
                  <th>Material ID</th>
                  <th>{t("warehouses.totalValue")} (Balans)</th>
                  <th>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {(filtered ?? []).map(r => (
                  <tr key={`${r.warehouseId}-${r.materialCardId}`}>
                    <td>
                      <button
                        className="pos-btn pos-btn-ghost"
                        style={{ padding: "2px 6px", fontSize: 12 }}
                        onClick={() => navigate(`/pos-monitor/materials/${r.materialCardId}`)}
                      >
                        #{r.materialCardId}
                      </button>
                    </td>
                    <td className="pos-mono">{r.balance?.toFixed(3) ?? "0"}</td>
                    <td>
                      <button className="pos-btn pos-btn-ghost" style={{ padding: "3px 8px", fontSize: 11 }} onClick={() => navigate(`/pos-monitor/materials/${r.materialCardId}`)}>
                        👁
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div style={{ textAlign: "center", padding: 24, color: "var(--pos-text-muted)" }}>{t("common.noData")}</div>}
          </div>
        </>
      )}

      {!loading && tab === "movements" && (
        <div className="pos-card" style={{ overflowX: "auto" }}>
          <table className="pos-table">
            <thead>
              <tr>
                <th>Doc No</th>
                <th>{t("movements.movementType")}</th>
                <th>{t("common.status")}</th>
                <th>{t("common.amount")}</th>
                <th>{t("common.date")}</th>
              </tr>
            </thead>
            <tbody>
              {(movements ?? []).map(m => (
                <tr key={m.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/pos-monitor/movements/${m.id}`)}>
                  <td className="pos-mono" style={{ color: "var(--pos-accent)", fontWeight: 600 }}>{m.movementNumber ?? `#${m.id}`}</td>
                  <td><span className="pos-badge pos-badge-blue" style={{ fontSize: 10 }}>{m.movementType}</span></td>
                  <td><span className={`pos-badge ${STATUS_BADGE[m.status] ?? "pos-badge-gray"}`} style={{ fontSize: 10 }}>{m.status}</span></td>
                  <td className="pos-mono">{m.totalAmount?.toFixed(0) ?? "—"}</td>
                  <td style={{ color: "var(--pos-text-muted)", fontSize: 12 }}>{new Date(m.createdAt).toLocaleDateString("uz-UZ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {movements.length === 0 && <div style={{ textAlign: "center", padding: 24, color: "var(--pos-text-muted)" }}>{t("common.noData")}</div>}
        </div>
      )}

      {!loading && tab === "bins" && (
        <div className="pos-card">
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>🗂 Zona / Bin bo'yicha materiallar</div>
          {stock.length === 0 ? (
            <div style={{ textAlign: "center", padding: 24, color: "var(--pos-text-muted)" }}>{t("common.noData")}</div>
          ) : (
            <table className="pos-table">
              <thead>
                <tr><th>#</th><th>Material ID</th><th>Balans</th><th>Ombor</th></tr>
              </thead>
              <tbody>
                {stock.slice(0, 50).map((s, i) => (
                  <tr key={`${s.materialCardId}-${i}`}>
                    <td style={{ color: "var(--pos-text-muted)", fontSize: 12 }}>{i + 1}</td>
                    <td className="pos-mono" style={{ color: "var(--pos-accent)" }}>#{s.materialCardId}</td>
                    <td className="pos-mono" style={{ fontWeight: 600 }}>{s.balance?.toLocaleString("uz-UZ") ?? 0}</td>
                    <td style={{ color: "var(--pos-text-muted)", fontSize: 12 }}>{s.warehouseId ?? id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
