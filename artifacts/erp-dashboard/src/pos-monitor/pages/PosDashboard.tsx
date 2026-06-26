/**
 * @module PosDashboard
 * @description React page component. Route-level UI.
 */

import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { usePosI18n } from "../i18n/usePosI18n";
import { reportsApi, stockApi, movementsApi } from "../api/pos-monitor.api";
import { usePOSSocket } from "../hooks/usePOSSocket";
import PosBarcodeScanner from "../components/PosBarcodeScanner";

interface KpiData { todayMovementsCount?: number; todayTotalAmount?: number; pendingApprovalCount?: number; lowStockCount?: number; }
interface Movement { id: number; movementType: string; status: string; totalAmount?: number; createdAt: string; movementNumber?: string; }
interface StockRow  { warehouseId: string; materialCardId: number; balance: number; }
interface ExpiryRow { warehouseId: string; materialCardId: number; balance: number; expiresAt?: string; daysLeft?: number; }
interface ToastMsg   { id: number; msg: string; }

let _toastId = 0;
function newToastId() { return ++_toastId; }

const MOV_TYPE_COLORS: Record<string, string> = {
  EXTERNAL_IN: "var(--pos-success)", EXTERNAL_OUT: "var(--pos-danger)", INTERNAL_ISSUE: "var(--pos-warning)",
  INTERNAL_RETURN: "var(--pos-accent)", INTERNAL_TRANSFER: "#8B5CF6", DAMAGE: "var(--pos-danger)",
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
  const [toasts, setToasts]             = useState<ToastMsg[]>([]);

  const showToast = useCallback((msg: string) => {
    const id = newToastId();
    setToasts(t => [...t, { id, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 5000);
  }, []);

  const refetchStats = useCallback(async () => {
    try {
      const kpiData = await reportsApi.getKpi();
      setKpi((kpiData as KpiData) ?? {});
    } catch { /* noop */ }
  }, []);

  const refetchStock = useCallback(async () => {
    try {
      const stockData = await stockApi.getAll();
      setStockSummary((Array.isArray(stockData) ? stockData : []) as StockRow[]);
    } catch { /* noop */ }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [kpiData, stockData, pendingData, recentData, expiryData] = await Promise.all([
        reportsApi.getKpi().catch((e) => { console.error("[Dashboard] KPI:", e); return {}; }),
        stockApi.getAll().catch((e) => { console.error("[Dashboard] stock:", e); return []; }),
        movementsApi.getAll({ status: "pending" }).catch(() => []),
        movementsApi.getAll({ limit: 10 }).catch(() => []),
        stockApi.getExpiryAlerts(30).catch(() => []),
      ]);
      setKpi((kpiData as KpiData) ?? {});
      setStockSummary((Array.isArray(stockData) ? stockData : []) as StockRow[]);
      setPending((Array.isArray(pendingData) ? pendingData : []) as Movement[]);
      if (Array.isArray(recentData) && recentData.length > 0) {
        setFeed(f => f.length === 0 ? (recentData as Movement[]) : f);
      }
      setExpiry((Array.isArray(expiryData) ? expiryData : []) as ExpiryRow[]);
    } catch (e) {
      console.error("[PosDashboard] loadData xato:", e);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  // ── Real-time socket integration ──────────────────────────────────────────
  const { isConnected } = usePOSSocket({
    onMovementCreated: (data) => {
      setFeed(prev => [data as unknown as Movement, ...(prev ?? []).slice(0, 9)]);
      setKpi(k => ({ ...k, todayMovementsCount: (k.todayMovementsCount ?? 0) + 1 }));
      void refetchStats();
    },
    onMovementStatusChanged: () => {
      void refetchStats();
    },
    onLowStockAlert: (data) => {
      showToast(`⚠️ Past qoldiq: ${data.materialName} — ${data.availableQty} ${data.unit}`);
      setKpi(k => ({ ...k, lowStockCount: (k.lowStockCount ?? 0) + 1 }));
    },
    onStockUpdated: () => {
      void refetchStock();
    },
  });

  const QUICK_ACTIONS = [
    { icon: "📷", label: t("dashboard.scan"),     action: () => setShowScanner(true) },
    { icon: "➕", label: t("dashboard.inward"),   action: () => navigate("/pos-monitor/movements/new?type=EXTERNAL_IN") },
    { icon: "➖", label: t("dashboard.outward"),  action: () => navigate("/pos-monitor/movements/new?type=EXTERNAL_OUT") },
    { icon: "🔄", label: t("dashboard.transfer"), action: () => navigate("/pos-monitor/movements/new?type=INTERNAL_TRANSFER") },
    { icon: "📋", label: t("dashboard.request"),  action: () => navigate("/pos-monitor/requests") },
  ];

  return (
    <div>
      {/* ── Socket connection indicator ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6, marginBottom: 8, fontSize: 11, color: "var(--pos-text-muted)" }}>
        <span
          style={{
            display:      "inline-block",
            width:        8,
            height:       8,
            borderRadius: "50%",
            background:   isConnected ? "var(--pos-success)" : "var(--pos-danger)",
            boxShadow:    isConnected ? "0 0 0 2px rgba(16,185,129,0.25)" : "0 0 0 2px rgba(239,68,68,0.25)",
          }}
        />
        {isConnected ? "Real-time: faol" : "Real-time: uzilgan"}
      </div>

      {/* ── Toast container ── */}
      {toasts.length > 0 && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none" }}>
          {toasts.map(toast => (
            <div key={toast.id} className="pos-slide-in" style={{ background: "var(--pos-danger)", color: "var(--pos-card)", padding: "10px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, boxShadow: "0 4px 12px color-mix(in srgb, black 30%, transparent)", maxWidth: 340 }}>
              {toast.msg}
            </div>
          ))}
        </div>
      )}

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
            {(Array.isArray(feed) ? feed : []).map(m => (
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
            <span style={{ fontWeight: 600, fontSize: 14, color: "var(--pos-warning)" }}>{t("muddatYaqinlashayotganMateriallar")}</span>
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
          <div style={{ color: "var(--pos-text-muted)", fontSize: 13, textAlign: "center", padding: "16px 0" }}>{t("tasdiqlashKutayotganHarakatlarYoq")}</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pending.slice(0, 5).map(m => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "rgba(255,184,0,0.06)", borderRadius: 8, border: "1px solid rgba(255,184,0,0.2)", cursor: "pointer" }} onClick={() => navigate(`/pos-monitor/movements/${m.id}`)}>
                <span style={{ fontSize: 18 }}>📋</span>
                <div style={{ flex: 1 }}>
                  <div className="pos-mono" style={{ fontSize: 13, fontWeight: 600, color: "var(--pos-accent)" }}>{m.movementNumber ?? `#${m.id}`}</div>
                  <div style={{ fontSize: 11, color: "var(--pos-text-muted)" }}>{m.movementType} · {fmtT(m.createdAt)}</div>
                </div>
                <span className="pos-badge pos-badge-yellow" style={{ fontSize: 10 }}>{t("Kutilmoqda")}</span>
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
