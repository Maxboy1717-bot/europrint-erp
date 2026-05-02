import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { usePosI18n } from "../i18n/usePosI18n";
import { reportsApi, stockApi, movementsApi } from "../api/pos-monitor.api";
import { getPosSocket } from "../socket/pos-socket";
import PosBarcodeScanner from "../components/PosBarcodeScanner";

interface KpiData { todayMovementsCount?: number; todayTotalAmount?: number; pendingApprovalCount?: number; lowStockCount?: number; }
interface Movement { id: number; movementType: string; status: string; totalAmount?: number; createdAt: string; movementNumber?: string; }
interface StockRow  { warehouseId: string; materialCardId: number; balance: number; }
interface ExpiryRow { warehouseId: string; materialCardId: number; balance: number; expiresAt?: string; daysLeft?: number; }

const MOV_TYPE_COLORS: Record<string, string> = {
  EXTERNAL_IN: "#00FF94", EXTERNAL_OUT: "#FF4757", INTERNAL_ISSUE: "#FFB800",
  INTERNAL_RETURN: "#00D4FF", INTERNAL_TRANSFER: "#9B59B6", DAMAGE: "#FF4757",
};

function StatCard({ label, value, icon, color = "var(--pos-accent)" }: { label: string; value: string | number; icon: string; color?: string }) {
  return (
    <div className="pos-stat-card pos-fade-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 24 }}>{icon}</span>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} className="pos-live" />
      </div>
      <div className="pos-stat-value" style={{ color }}>{value}</div>
      <div className="pos-stat-label">{label}</div>
    </div>
  );
}

const fmt  = (n: number) => new Intl.NumberFormat("uz-UZ").format(n);
const fmtT = (d: string) => new Date(d).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });

export default function PosDashboard() {
  const [, navigate] = useLocation();
  const { t } = usePosI18n();
  const [kpi, setKpi]                   = useState<KpiData>({});
  const [feed, setFeed]                 = useState<Movement[]>([]);
  const [stockSummary, setStockSummary] = useState<StockRow[]>([]);
  const [pending, setPending]           = useState<Movement[]>([]);
  const [expiry, setExpiry]             = useState<ExpiryRow[]>([]);
  const [loading, setLoading]           = useState(true);
  const [showScanner, setShowScanner]   = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [kpiData, stockData, pendingData, recentData, expiryData] = await Promise.all([
        reportsApi.getKpi(),
        stockApi.getAll(),
        movementsApi.getAll({ status: "pending" }).catch(() => []),
        movementsApi.getAll({ limit: "10" }).catch(() => []),
        stockApi.getExpiryAlerts(30).catch(() => []),
      ]);
      setKpi((kpiData as KpiData) ?? {});
      setStockSummary((Array.isArray(stockData) ? stockData : []) as StockRow[]);
      setPending((Array.isArray(pendingData) ? pendingData : []) as Movement[]);
      if (Array.isArray(recentData) && recentData.length > 0) {
        setFeed(f => f.length === 0 ? (recentData as Movement[]) : f);
      }
      setExpiry((Array.isArray(expiryData) ? expiryData : []) as ExpiryRow[]);
    } catch { /* noop */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  useEffect(() => {
    try {
      const sock = getPosSocket();
      const onCreated = (data: Movement) => {
        setFeed(prev => [data, ...(prev ?? []).slice(0, 9)]);
        setKpi(k => ({ ...k, todayMovementsCount: (k.todayMovementsCount ?? 0) + 1 }));
      };
      sock.on("movement.created",   onCreated);
      sock.on("movement.confirmed", (data: Movement) => setFeed(prev => (prev ?? []).map(m => m.id === data.id ? { ...m, ...data } : m)));
      sock.on("stock.alert",        () => void stockApi.getLowAlerts().then(d => { if (Array.isArray(d)) setKpi(k => ({ ...k, lowStockCount: d.length })); }).catch(() => undefined));
      return () => { sock.off("movement.created"); sock.off("movement.confirmed"); sock.off("stock.alert"); };
    } catch { return undefined; }
  }, []);

  const QUICK_ACTIONS = [
    { icon: "📷", label: t("dashboard.scan"),     action: () => setShowScanner(true) },
    { icon: "➕", label: t("dashboard.inward"),   action: () => navigate("/pos-monitor/movements/new?type=EXTERNAL_IN") },
    { icon: "➖", label: t("dashboard.outward"),  action: () => navigate("/pos-monitor/movements/new?type=EXTERNAL_OUT") },
    { icon: "🔄", label: t("dashboard.transfer"), action: () => navigate("/pos-monitor/movements/new?type=INTERNAL_TRANSFER") },
    { icon: "📋", label: t("dashboard.request"),  action: () => navigate("/pos-monitor/requests") },
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard label={t("dashboard.todayMovements")}   value={loading ? "..." : fmt(kpi.todayMovementsCount ?? 0)}  icon="🔄" color="var(--pos-accent)" />
        <StatCard label={t("dashboard.todayAmount")}      value={loading ? "..." : `${fmt(kpi.todayTotalAmount ?? 0)} so'm`} icon="💰" color="var(--pos-success)" />
        <StatCard label={t("dashboard.awaitingApproval")} value={loading ? "..." : fmt(kpi.pendingApprovalCount ?? 0)} icon="⏳" color="var(--pos-warning)" />
        <StatCard label={t("dashboard.lowStockAlerts")}   value={loading ? "..." : fmt(kpi.lowStockCount ?? 0)}        icon="⚠️" color="var(--pos-danger)" />
      </div>

      <div className="pos-card" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--pos-text-muted)", marginBottom: 14, textTransform: "uppercase", letterSpacing: 1 }}>{t("dashboard.quickActions")}</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {QUICK_ACTIONS.map(a => (
            <button key={a.label} className="pos-btn pos-btn-ghost" style={{ gap: 6, fontSize: 13, padding: "8px 14px" }} onClick={a.action}>
              <span>{a.icon}</span> {a.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div className="pos-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{t("dashboard.recentFeed")}</span>
            <span style={{ fontSize: 11, color: "var(--pos-success)" }} className="pos-live">● LIVE</span>
          </div>
          <div className="pos-timeline">
            {feed.length === 0 && !loading && <div style={{ color: "var(--pos-text-muted)", fontSize: 13 }}>{t("common.noData")}</div>}
            {(feed ?? []).map(m => (
              <div key={m.id} className="pos-timeline-item pos-slide-in" style={{ cursor: "pointer" }} onClick={() => navigate(`/pos-monitor/movements/${m.id}`)}>
                <span className="pos-timeline-dot" style={{ background: MOV_TYPE_COLORS[m.movementType] ?? "var(--pos-accent)" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{m.movementNumber ?? `#${m.id}`}<span className="pos-badge pos-badge-blue" style={{ marginLeft: 8, fontSize: 10 }}>{m.movementType}</span></div>
                  <div style={{ fontSize: 11, color: "var(--pos-text-muted)" }}>{fmtT(m.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pos-card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>{t("dashboard.warehouseMap")}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {stockSummary.length === 0 && !loading && <div style={{ color: "var(--pos-text-muted)", fontSize: 13 }}>{t("common.noData")}</div>}
            {(stockSummary ?? []).slice(0, 7).map((row, i) => {
              const pct = Math.min(100, Math.round((row.balance / 1000) * 100));
              const color = pct > 60 ? "green" : pct > 30 ? "yellow" : "red";
              return (
                <div key={`${row.warehouseId}-${row.materialCardId}-${i}`}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                    <span style={{ color: "var(--pos-text-muted)" }}>{row.warehouseId}</span>
                    <span className="pos-mono" style={{ color: "var(--pos-text)" }}>{pct}%</span>
                  </div>
                  <div className="pos-progress"><div className={`pos-progress-fill ${color}`} style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {expiry.length > 0 && (
        <div className="pos-card" style={{ marginBottom: 24, borderColor: "rgba(255,184,0,0.3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 18 }}>🗓️</span>
            <span style={{ fontWeight: 600, fontSize: 14, color: "var(--pos-warning)" }}>Muddat yaqinlashayotgan materiallar</span>
            <span className="pos-badge pos-badge-yellow" style={{ fontSize: 10 }}>{expiry.length} ta</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }}>
            {expiry.slice(0, 8).map((e, i) => (
              <div key={`exp-${e.materialCardId}-${i}`} style={{ padding: "8px 12px", background: "rgba(255,184,0,0.06)", borderRadius: 8, border: "1px solid rgba(255,184,0,0.2)" }}>
                <div className="pos-mono" style={{ fontSize: 12, color: "var(--pos-accent)", marginBottom: 2 }}>Material #{e.materialCardId}</div>
                <div style={{ fontSize: 11, color: "var(--pos-text-muted)" }}>Ombor: {e.warehouseId}</div>
                <div style={{ fontSize: 11, color: "var(--pos-text-muted)" }}>Qoldiq: {e.balance}</div>
                {e.expiresAt && <div style={{ fontSize: 11, color: "var(--pos-warning)", fontWeight: 600 }}>Muddat: {new Date(e.expiresAt).toLocaleDateString("uz-UZ")}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pos-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{t("dashboard.myTasks")}{pending.length > 0 && <span className="pos-badge pos-badge-yellow" style={{ marginLeft: 8, fontSize: 11 }}>{pending.length}</span>}</div>
          <button className="pos-btn pos-btn-ghost" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => void loadData()}>🔄</button>
        </div>
        {pending.length === 0 ? (
          <div style={{ color: "var(--pos-text-muted)", fontSize: 13, textAlign: "center", padding: "16px 0" }}>✅ Tasdiqlash kutayotgan harakatlar yo'q</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pending.slice(0, 5).map(m => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "rgba(255,184,0,0.06)", borderRadius: 8, border: "1px solid rgba(255,184,0,0.2)", cursor: "pointer" }} onClick={() => navigate(`/pos-monitor/movements/${m.id}`)}>
                <span style={{ fontSize: 18 }}>📋</span>
                <div style={{ flex: 1 }}>
                  <div className="pos-mono" style={{ fontSize: 13, fontWeight: 600, color: "var(--pos-accent)" }}>{m.movementNumber ?? `#${m.id}`}</div>
                  <div style={{ fontSize: 11, color: "var(--pos-text-muted)" }}>{m.movementType} · {fmtT(m.createdAt)}</div>
                </div>
                <span className="pos-badge pos-badge-yellow" style={{ fontSize: 10 }}>Kutilmoqda</span>
                {m.totalAmount != null && <div className="pos-mono" style={{ fontSize: 13, fontWeight: 600 }}>{fmt(m.totalAmount)}</div>}
                <span style={{ color: "var(--pos-accent)", fontSize: 16 }}>›</span>
              </div>
            ))}
            {pending.length > 5 && <button className="pos-btn pos-btn-ghost" style={{ fontSize: 12 }} onClick={() => navigate("/pos-monitor/movements?status=pending")}>+ {pending.length - 5} ta ko'proq →</button>}
          </div>
        )}
      </div>

      {showScanner && <PosBarcodeScanner onClose={() => setShowScanner(false)} />}
    </div>
  );
}
