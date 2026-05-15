/**
 * PosKpiDashboard.tsx
 * Real-time KPI — har ombor bo'yicha + umumiy tizim.
 * URL: /pos-monitor/kpi
 */
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { warehouseFeaturesApi } from "../api/pos-monitor.api";
import { useTranslation } from "@/lib/i18n";
interface WarehouseKpi {
  warehouseId: number; warehouseCode: string; warehouseName: string; warehouseType: string;
  totalMaterials: number; totalQuantity: number; totalValue: number;
  lowStockCount: number; outOfStockCount: number;
  movementsToday: number; movementsThisWeek: number; pendingApprovals: number;
  employeeCount: number; primaryUnit: string;
  units: Array<{ unit: string; count: number; quantity: number }>;
}

interface SystemKpi {
  totalWarehouses: number; totalMaterials: number; totalStockValue: number;
  lowStockAlerts: number; pendingMovements: number; qcPending: number;
  todayMovements: number; weeklyMovements: number; monthlyMovements: number;
  topWarehouses: Array<{ code: string; name: string; valueShare: number }>;
  movementsByType: Array<{ type: string; count: number; label: string }>;
}

function fmt(n: number | null | undefined, max = 0): string {
  const v = Number(n ?? 0);
  if (!Number.isFinite(v)) return "0";
  return v.toLocaleString("uz-UZ", { maximumFractionDigits: max });
}

function fmtMoney(n: number | null | undefined): string {
  const v = Number(n ?? 0);
  if (!Number.isFinite(v) || v === 0) return "0";
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(2) + " mlrd";
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + " mln";
  if (v >= 1_000) return (v / 1_000).toFixed(0) + " ming";
  return fmt(v);
}

export default function PosKpiDashboard() {
  const { t } = useTranslation('common');
  const [, navigate] = useLocation();
  const [whKpis, setWhKpis] = useState<WarehouseKpi[]>([]);
  const [sysKpi, setSysKpi] = useState<SystemKpi | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [wh, sys] = await Promise.all([
        warehouseFeaturesApi.getWarehouseKpis().catch(() => []),
        warehouseFeaturesApi.getSystemKpi().catch(() => null),
      ]);
      setWhKpis((wh as WarehouseKpi[]) ?? []);
      setSysKpi(sys as SystemKpi);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    void loadData();
    const interval = setInterval(() => void loadData(), 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", padding: "20px 24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>OMBOR KPI</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#1F2937" }}>
            {t("realTimeKorsatgichlar")}
          </h1>
        </div>
        <button
          onClick={() => void loadData()}
          style={{ padding: "8px 16px", background: "#F3F4F6", border: "1px solid #E5E7EB",
                   borderRadius: 8, cursor: "pointer", fontSize: 13 }}
        >
          {t("yangilash")}
        </button>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40 }}>{t("yuklanmoqda")}</div>}

      {/* System KPI */}
      {!loading && sysKpi && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                        gap: 12, marginBottom: 24 }}>
            <KpiCard icon="🏭" label={t("omborlar")} value={String(sysKpi.totalWarehouses)} />
            <KpiCard icon="📦" label={t("Materiallar")} value={String(sysKpi.totalMaterials)} />
            <KpiCard icon="💰" label={t("jamiQiymat1")} value={fmtMoney(sysKpi.totalStockValue) + " so'm"} color="#059669" />
            <KpiCard icon="⚠️" label={t("pastStok")} value={String(sysKpi.lowStockAlerts)} color={sysKpi.lowStockAlerts > 0 ? "#DC2626" : "#059669"} />
            <KpiCard icon="⏳" label={t("tasdiqlashKutmoqda")} value={String(sysKpi.pendingMovements)} color={sysKpi.pendingMovements > 0 ? "#D97706" : "#059669"} />
            <KpiCard icon="🔬" label="QC kutmoqda" value={String(sysKpi.qcPending)} color={sysKpi.qcPending > 0 ? "#D97706" : "#059669"} />
            <KpiCard icon="📅" label={t("bugungiHarakatlar")} value={String(sysKpi.todayMovements)} />
            <KpiCard icon="📊" label={t("weekly")} value={String(sysKpi.weeklyMovements)} />
            <KpiCard icon="📈" label={t("monthly")} value={String(sysKpi.monthlyMovements)} />
          </div>

          {/* Top warehouses + Movement types */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            <div style={{ background: "#FFF", borderRadius: 12, padding: 16, border: "1px solid #E5E7EB" }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>🏆 Top omborlar (qiymat ulushi)</div>
              {(Array.isArray(sysKpi.topWarehouses) ? sysKpi.topWarehouses : []).map((w, i) => (
                <div key={w.code} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#EFF6FF",
                                color: "#1E40AF", display: "flex", alignItems: "center",
                                justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, fontSize: 13 }}>
                    <b>{w.code}</b> <span style={{ color: "#6B7280" }}>{w.name}</span>
                  </div>
                  <div style={{ width: 100, height: 8, background: "#F3F4F6", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${w.valueShare}%`, height: "100%", background: "#10B981" }} />
                  </div>
                  <div style={{ width: 40, textAlign: "right", fontSize: 12, fontWeight: 600 }}>{w.valueShare}%</div>
                </div>
              ))}
            </div>

            <div style={{ background: "#FFF", borderRadius: 12, padding: 16, border: "1px solid #E5E7EB" }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>🔄 Harakatlar (oxirgi 30 kun)</div>
              {(Array.isArray(sysKpi.movementsByType) ? sysKpi.movementsByType : []).map(m => (
                <div key={m.type} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ flex: 1, fontSize: 13 }}>{m.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1F2937" }}>{m.count}</div>
                </div>
              ))}
              {(!sysKpi.movementsByType || sysKpi.movementsByType.length === 0) && (
                <div style={{ textAlign: "center", color: "#9CA3AF", padding: 16, fontSize: 13 }}>{t("harakatlarYoq")}</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Per-warehouse KPI */}
      {!loading && whKpis.length > 0 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{t("harOmborBoyichaKpi")}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
            {whKpis.map(w => (
              <div
                key={w.warehouseId}
                onClick={() => navigate(`/pos-monitor/warehouses/${w.warehouseId}`)}
                style={{ background: "#FFF", borderRadius: 12, border: "1px solid #E5E7EB",
                         padding: 16, cursor: "pointer", transition: "transform 0.1s" }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = ""}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 20 }}>🏭</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{w.warehouseName}</div>
                    <div style={{ fontSize: 11, color: "#6B7280", fontFamily: "monospace" }}>{w.warehouseCode}</div>
                  </div>
                  <span style={{ padding: "2px 8px", borderRadius: 6, background: "#EFF6FF", color: "#1E40AF",
                                fontSize: 10, fontWeight: 700 }}>
                    {w.warehouseType}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                  <Stat label={t('Material')} value={String(w.totalMaterials)} />
                  <Stat label={t("pastStok")} value={String(w.lowStockCount)} color={w.lowStockCount > 0 ? "#DC2626" : undefined} />
                  <Stat label={t("tugagan")} value={String(w.outOfStockCount)} color={w.outOfStockCount > 0 ? "#DC2626" : undefined} />
                  <Stat label={t("today")} value={String(w.movementsToday)} />
                  <Stat label={t("hafta")} value={String(w.movementsThisWeek)} />
                  <Stat label={t("kutmoqda1")} value={String(w.pendingApprovals)} color={w.pendingApprovals > 0 ? "#D97706" : undefined} />
                </div>

                {/* Jami qiymat */}
                <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: 10, marginBottom: 8 }}>
                  <div style={{ fontSize: 10, color: "#9CA3AF" }}>JAMI QIYMAT</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#059669" }}>
                    {fmtMoney(w.totalValue)} so'm
                  </div>
                </div>

                {/* Unit breakdown */}
                {(w.units ?? []).length > 0 && (
                  <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: 10 }}>
                    <div style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 4 }}>{t("olchovBirliklari")}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {(w.units ?? []).slice(0, 5).map(u => (
                        <div key={u.unit} style={{ background: "#F9FAFB", borderRadius: 6, padding: "3px 8px",
                                                    fontSize: 11, color: "#374151" }}>
                          <b>{fmt(u.quantity, 2)}</b> {u.unit}
                          <span style={{ color: "#9CA3AF" }}> · {u.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {w.employeeCount > 0 && (
                  <div style={{ marginTop: 8, fontSize: 11, color: "#6B7280" }}>
                    👥 {w.employeeCount} ta xodim
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ icon, label, value, color }: { icon: string; label: string; value: string; color?: string }) {
  return (
    <div style={{ background: "#FFF", borderRadius: 12, padding: "12px 14px", border: "1px solid #E5E7EB" }}>
      <div style={{ fontSize: 18 }}>{icon}</div>
      <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 4, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: color ?? "#1F2937", marginTop: 2 }}>{value}</div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, color: color ?? "#1F2937" }}>{value}</div>
      <div style={{ fontSize: 9, color: "#9CA3AF", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}
