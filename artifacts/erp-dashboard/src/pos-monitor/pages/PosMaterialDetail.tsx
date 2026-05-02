import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { usePosI18n } from "../i18n/usePosI18n";
import { materialsApi, movementsApi, stockApi } from "../api/pos-monitor.api";

interface StockRow  { materialCardId: number; warehouseId: string; balance: number; }
interface Movement  { id: number; movementNumber?: string; movementType: string; status: string; createdAt: string; totalAmount?: number; }

export default function PosMaterialDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { t } = usePosI18n();
  const matId = parseInt(params.id ?? "0", 10);
  const [tab, setTab]           = useState<"general" | "stock" | "history" | "analytics">("general");
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

  const totalBalance = (stock ?? []).reduce((s, r) => s + (r.balance ?? 0), 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button className="pos-btn pos-btn-ghost" style={{ padding: "6px 10px" }} onClick={() => navigate("/pos-monitor/materials")}>← {t("common.back")}</button>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Material #{matId}</h2>
        <div style={{ flex: 1 }} />
        <div className="pos-card" style={{ padding: "8px 16px", display: "inline-flex", gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, color: "var(--pos-text-muted)" }}>Jami stok</div>
            <div className="pos-mono" style={{ fontWeight: 700, color: "var(--pos-accent)", fontSize: 18 }}>{totalBalance.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="pos-tabs">
        <div className={`pos-tab ${tab === "general" ? "active" : ""}`} onClick={() => setTab("general")}>Umumiy</div>
        <div className={`pos-tab ${tab === "stock" ? "active" : ""}`} onClick={() => setTab("stock")}>Stok</div>
        <div className={`pos-tab ${tab === "history" ? "active" : ""}`} onClick={() => setTab("history")}>Harakat tarixi</div>
        <div className={`pos-tab ${tab === "analytics" ? "active" : ""}`} onClick={() => setTab("analytics")}>Analytics</div>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40, color: "var(--pos-text-muted)" }}>{t("common.loading")}</div>}

      {!loading && tab === "general" && (
        <div className="pos-card">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--pos-text-muted)", marginBottom: 4 }}>Material ID</div>
              <div className="pos-mono" style={{ fontSize: 18, fontWeight: 700, color: "var(--pos-accent)" }}>#{matId}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--pos-text-muted)", marginBottom: 4 }}>Jami stok</div>
              <div className="pos-mono" style={{ fontSize: 18, fontWeight: 700 }}>{totalBalance.toFixed(3)}</div>
            </div>
          </div>
          <div style={{ marginTop: 20, padding: "16px", background: "rgba(0,212,255,0.05)", borderRadius: 10, border: "1px solid rgba(0,212,255,0.15)" }}>
            <div style={{ fontSize: 11, color: "var(--pos-text-muted)", marginBottom: 8 }}>Barcode</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: 28, letterSpacing: 6, color: "var(--pos-text)", border: "1px solid var(--pos-border)", borderRadius: 6, padding: "8px 16px", background: "rgba(0,0,0,0.3)" }}>
                {String(matId).padStart(8, "0")}
              </div>
              <div style={{ fontSize: 12, color: "var(--pos-text-muted)" }}>
                <div>Material ID: <span className="pos-mono" style={{ color: "var(--pos-accent)" }}>#{matId}</span></div>
                <div>Jami stok: <span className="pos-mono" style={{ color: "var(--pos-success)" }}>{totalBalance.toFixed(3)}</span></div>
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
                <th>Ombor</th>
                <th>Balans</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {(stock ?? []).map(r => (
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
                      + Harakat
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
              <tr><th>Doc No</th><th>Tur</th><th>Status</th><th>Summa</th><th>Sana</th></tr>
            </thead>
            <tbody>
              {(history ?? []).map(m => (
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
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>📊 ABC Tahlil</div>
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
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>📈 Oborot Ko'rsatkichlari</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--pos-text-muted)", marginBottom: 4 }}>Umumiy harakatlar</div>
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
                <div style={{ fontSize: 11, color: "var(--pos-text-muted)", marginBottom: 4 }}>Stok omborlarda</div>
                <div className="pos-mono" style={{ fontSize: 22, fontWeight: 700, color: "var(--pos-warning)" }}>
                  {stock.length}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--pos-text-muted)", marginBottom: 4 }}>Jami balans</div>
                <div className="pos-mono" style={{ fontSize: 22, fontWeight: 700 }}>
                  {totalBalance.toFixed(3)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
