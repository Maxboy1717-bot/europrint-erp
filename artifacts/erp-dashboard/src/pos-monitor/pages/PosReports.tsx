/**
 * @module PosReports
 * @description React page component. Route-level UI.
 */

import { useState, useCallback } from "react";
import { usePosI18n } from "../i18n/usePosI18n";
import { reportsApi, stockApi, glApi, syncApi, inventoryApi, movementsApi } from "../api/pos-monitor.api";

function exportCsv(data: unknown, filename: string) {
  const rows = Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(","), ...rows.map(r => keys.map(k => JSON.stringify(r[k] ?? "")).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
}

interface KpiRow { label: string; value: string | number; color: string; }

const REPORT_TYPES = [
  "stock_balance","movement_journal","abc_analysis","three_way_mismatch",
  "fifo_aging","low_stock","expiry_alerts","gl_journal","gl_report",
  "confirmation_audit","qc_report","damage_report","inventory_variance",
  "request_fulfillment","employee_balance","inventory_act","supplier_rating",
  "turnover","cash_register_log","sync_status","label_history","pos_kpi",
] as const;

type ReportType = typeof REPORT_TYPES[number];

const REPORT_LABELS: Record<string, string> = {
  stock_balance: "Stok balans",        movement_journal: "Harakat jurnali",
  abc_analysis: "ABC Tahlil",          three_way_mismatch: "3-tomonlama taqqoslash",
  fifo_aging: "FIFO Qarilik",          low_stock: "Past stok",
  expiry_alerts: "Muddat ogohlantirish", gl_journal: "GL Jurnali",
  gl_report: "GL Hisobot (audit)",     confirmation_audit: "Tasdiqlash auditi",
  qc_report: "QC Hisobot",             damage_report: "Zarar harakatlari",
  inventory_variance: "Inventarizatsiya farqlari", request_fulfillment: "So'rov bajarish",
  employee_balance: "Xodim balansi",   inventory_act: "Inventarizatsiya akti",
  supplier_rating: "Ta'minotchi reytingi", turnover: "Aylanma",
  cash_register_log: "Kassa logi",     sync_status: "Sinxronizatsiya holati",
  label_history: "Label tarixi",       pos_kpi: "POS KPI",
};

const REPORT_ICON: Record<string, string> = {
  stock_balance: "📦", movement_journal: "🔄", abc_analysis: "📊", three_way_mismatch: "🔀",
  fifo_aging: "⏳", low_stock: "⚠️", expiry_alerts: "🗓️", gl_journal: "📒", gl_report: "📋",
  confirmation_audit: "✅", qc_report: "🔬", damage_report: "⚡", inventory_variance: "🔍",
  request_fulfillment: "📬", employee_balance: "👤", inventory_act: "📝", supplier_rating: "⭐",
  turnover: "🔁", cash_register_log: "💰", sync_status: "🔗", label_history: "🏷️", pos_kpi: "📈",
};

async function fetchReport(selected: ReportType, warehouseId: string, dateFrom: string, dateTo: string): Promise<unknown> {
  const p = new URLSearchParams();
  if (dateFrom) p.set("dateFrom", dateFrom);
  if (dateTo) p.set("dateTo", dateTo);
  if (warehouseId) p.set("warehouseId", warehouseId);
  switch (selected) {
    case "stock_balance":         return stockApi.getAll();
    case "movement_journal":      return reportsApi.getMovementStats();
    case "abc_analysis":          return reportsApi.getAbcAnalysis(warehouseId || undefined);
    case "three_way_mismatch":    return reportsApi.getThreeWayMismatch();
    case "fifo_aging":            return reportsApi.getTopMaterials();
    case "low_stock":             return stockApi.getLowAlerts();
    case "expiry_alerts":         return stockApi.getExpiryAlerts(30);
    case "gl_journal":            return glApi.getJournal();
    case "gl_report":             return reportsApi.getAudit({ dateFrom, dateTo });
    case "confirmation_audit":    return movementsApi.getAll({ limit: 100 }).catch(() => []);
    case "qc_report":             return movementsApi.getAll({ status: "qc_pending" }).catch(() => []);
    case "damage_report":         return movementsApi.getAll({ type: "DAMAGE" }).catch(() => []);
    case "inventory_variance":    return inventoryApi.getAll().catch(() => []);
    case "request_fulfillment":   return reportsApi.getLiabilities();
    case "employee_balance":      return reportsApi.getLiabilities();
    case "inventory_act":         return inventoryApi.getAll().catch(() => []);
    case "supplier_rating":       return reportsApi.getTopMaterials();
    case "turnover":              return reportsApi.getMovementStats("month");
    case "cash_register_log":     return reportsApi.getKpi();
    case "sync_status":           return syncApi.getStatus();
    case "label_history":         return reportsApi.getTopMaterials();
    case "pos_kpi":               return reportsApi.getKpi();
  }
}

export default function PosReports() {
  const { t } = usePosI18n();
  const [selected, setSelected] = useState<ReportType>("stock_balance");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");
  const [warehouseId, setWhId]  = useState("");
  const [loading, setLoading]   = useState(false);
  const [data, setData]         = useState<unknown>(null);
  const [kpiRows, setKpiRows]   = useState<KpiRow[]>([]);

  const generate = useCallback(async () => {
    setLoading(true); setData(null); setKpiRows([]);
    try {
      const result = await fetchReport(selected, warehouseId, dateFrom, dateTo);
      setData(result);
      if (selected === "stock_balance" && Array.isArray(result)) {
        const total = (result as { balance: number }[]).reduce((s, r) => s + (r.balance ?? 0), 0);
        setKpiRows([{ label: "Jami qatorlar", value: result.length, color: "var(--pos-accent)" }, { label: "Jami balans", value: total.toFixed(2), color: "var(--pos-success)" }]);
      }
    } catch { /* noop */ } finally { setLoading(false); }
  }, [selected, dateFrom, dateTo, warehouseId]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{t("reports.title")}</h2>
        <span className="pos-badge pos-badge-blue" style={{ fontSize: 10 }}>22 tur</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16 }}>
        <div>
          <div className="pos-card" style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--pos-text-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>{t("reports.selectReport")}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: 420, overflowY: "auto" }}>
              {REPORT_TYPES.map(rt => (
                <div key={rt} className={`pos-sidebar-item ${selected === rt ? "active" : ""}`} style={{ padding: "7px 10px", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }} onClick={() => setSelected(rt)}>
                  <span style={{ fontSize: 14 }}>{REPORT_ICON[rt] ?? "📄"}</span>
                  <span style={{ fontSize: 12 }}>{REPORT_LABELS[rt] ?? rt}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="pos-card">
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--pos-text-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>{t("filtrlar")}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div><label style={{ fontSize: 11, color: "var(--pos-text-muted)", marginBottom: 2, display: "block" }}>{t("reports.dateFrom")}</label><input className="pos-input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
              <div><label style={{ fontSize: 11, color: "var(--pos-text-muted)", marginBottom: 2, display: "block" }}>{t("reports.dateTo")}</label><input className="pos-input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
              <div><label style={{ fontSize: 11, color: "var(--pos-text-muted)", marginBottom: 2, display: "block" }}>{t("omborId")}</label><input className="pos-input" placeholder={t("Barchasi")} value={warehouseId} onChange={e => setWhId(e.target.value)} /></div>
              <button className="pos-btn pos-btn-primary" style={{ justifyContent: "center" }} onClick={() => void generate()} disabled={loading}>
                {loading ? "⏳ Yuklanmoqda..." : `${REPORT_ICON[selected] ?? "📊"} ${t("reports.generate")}`}
              </button>
            </div>
          </div>
        </div>

        <div>
          {kpiRows.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${kpiRows.length},1fr)`, gap: 12, marginBottom: 16 }}>
              {kpiRows.map(r => (
                <div key={r.label} className="pos-stat-card"><div className="pos-stat-value" style={{ color: r.color }}>{r.value}</div><div className="pos-stat-label">{r.label}</div></div>
              ))}
            </div>
          )}
          <div className="pos-card">
            {!data && !loading && (
              <div style={{ textAlign: "center", padding: 48, color: "var(--pos-text-muted)" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>{REPORT_ICON[selected] ?? "📊"}</div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{REPORT_LABELS[selected]}</div>
                <div style={{ fontSize: 12 }}>{t("hisobotniYuklashUchunTugmaniBosing")}</div>
              </div>
            )}
            {loading && <div style={{ textAlign: "center", padding: 48, color: "var(--pos-text-muted)" }}><div className="pos-live" style={{ fontSize: 32, marginBottom: 12 }}>⏳</div><div>{t("common.loading")}</div></div>}
            {data && !loading && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{REPORT_ICON[selected]} {REPORT_LABELS[selected]}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="pos-btn pos-btn-ghost" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => exportCsv(data, selected)}>📥 CSV</button>
                    <button className="pos-btn pos-btn-ghost" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => window.print()}>📄 PDF</button>
                  </div>
                </div>

                {/* ABC Analysis — special visualisation */}
                {selected === "abc_analysis" && Array.isArray(data) && data.length > 0 && (() => {
                  type AbcRow = { material_name: string; abc_class: "A" | "B" | "C"; total_value: number; pct_of_total: number; cumulative_pct: number; qty_on_hand: number; unit_of_measure: string };
                  const rows = data as AbcRow[];
                  const classCounts = { A: 0, B: 0, C: 0 };
                  const classValues = { A: 0, B: 0, C: 0 };
                  rows.forEach(r => { classCounts[r.abc_class] = (classCounts[r.abc_class] ?? 0) + 1; classValues[r.abc_class] = (classValues[r.abc_class] ?? 0) + r.total_value; });
                  const ABC_COLOR: Record<string, string> = { A: "var(--pos-success)", B: "var(--pos-warning)", C: "var(--pos-danger)" };
                  return (
                    <div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
                        {(["A","B","C"] as const).map(cls => (
                          <div key={cls} className="pos-stat-card" style={{ borderLeft: `3px solid ${ABC_COLOR[cls]}` }}>
                            <div className="pos-stat-value" style={{ color: ABC_COLOR[cls] }}>{classCounts[cls]} ta</div>
                            <div className="pos-stat-label">Sinf {cls} — {classValues[cls].toLocaleString("uz-UZ", { maximumFractionDigits: 0 })} so'm</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ overflowX: "auto" }}>
                        <table className="pos-table">
                          <thead><tr><th>{t("sinf")}</th><th>{t('common.Material')}</th><th>{t("unit")}</th><th className="pos-mono">{t("qoldiq")}</th><th className="pos-mono">{t("qiymat")}</th><th className="pos-mono">{t("ulushi")}</th><th className="pos-mono">{t("yigma")}</th></tr></thead>
                          <tbody>
                            {rows.slice(0, 200).map((r, i) => (
                              <tr key={i} style={{ background: r.abc_class === "A" ? "rgba(0,255,148,0.04)" : r.abc_class === "B" ? "rgba(255,184,0,0.04)" : undefined }}>
                                <td><span style={{ fontWeight: 700, color: ABC_COLOR[r.abc_class], fontSize: 13 }}>{r.abc_class}</span></td>
                                <td style={{ fontSize: 12, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.material_name}</td>
                                <td style={{ fontSize: 11, color: "var(--pos-text-muted)" }}>{r.unit_of_measure}</td>
                                <td className="pos-mono">{Number(r.qty_on_hand).toFixed(2)}</td>
                                <td className="pos-mono">{Number(r.total_value).toLocaleString("uz-UZ", { maximumFractionDigits: 0 })}</td>
                                <td className="pos-mono">{Number(r.pct_of_total).toFixed(2)}%</td>
                                <td className="pos-mono">{Number(r.cumulative_pct).toFixed(2)}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {rows.length > 200 && <div style={{ textAlign: "center", padding: 12, fontSize: 12, color: "var(--pos-text-muted)" }}>… yana {rows.length - 200} ta qator</div>}
                      </div>
                    </div>
                  );
                })()}

                {/* Generic table for other reports */}
                {selected !== "abc_analysis" && Array.isArray(data) && data.length > 0 ? (
                  <div style={{ overflowX: "auto" }}>
                    <table className="pos-table">
                      <thead><tr>{Object.keys((data as Record<string, unknown>[])[0] ?? {}).slice(0, 8).map(k => <th key={k}>{k}</th>)}</tr></thead>
                      <tbody>
                        {(data as Record<string, unknown>[]).slice(0, 100).map((row, i) => (
                          <tr key={`r-${i}`}>{Object.entries(row).slice(0, 8).map(([k, v]) => <td key={k} className={typeof v === "number" ? "pos-mono" : ""} style={{ fontSize: 12 }}>{v == null ? "—" : String(v).length > 50 ? `${String(v).slice(0, 50)}…` : String(v)}</td>)}</tr>
                        ))}
                      </tbody>
                    </table>
                    {Array.isArray(data) && data.length > 100 && <div style={{ textAlign: "center", padding: 12, fontSize: 12, color: "var(--pos-text-muted)" }}>… yana {data.length - 100} ta qator</div>}
                  </div>
                ) : selected !== "abc_analysis" && !Array.isArray(data) ? (
                  <pre style={{ fontSize: 11, color: "var(--pos-text-muted)", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{JSON.stringify(data, null, 2)}</pre>
                ) : selected !== "abc_analysis" && (
                  <div style={{ textAlign: "center", padding: 24, color: "var(--pos-text-muted)" }}>{t("common.noData")}</div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
