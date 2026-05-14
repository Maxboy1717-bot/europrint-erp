/**
 * WarehouseKpiHub.tsx
 * ERP — Ombor KPI Dashboard.
 * Real-time KPI, har ombor bo'yicha o'lchov birliklari.
 * URL: /wms/kpi-hub
 */
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { warehouseFeaturesApi } from "@/lib/api/warehouse-features";

import { useTranslation } from '@/lib/i18n';
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
  return Number.isFinite(v) ? v.toLocaleString("uz-UZ", { maximumFractionDigits: max }) : "0";
}

function fmtMoney(n: number | null | undefined): string {
  const v = Number(n ?? 0);
  if (!Number.isFinite(v) || v === 0) return "0";
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(2) + " mlrd";
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + " mln";
  if (v >= 1_000) return (v / 1_000).toFixed(0) + " ming";
  return fmt(v);
}

export default function WarehouseKpiHub() {
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
      setWhKpis(Array.isArray(wh) ? (wh as WarehouseKpi[]) : []);
      setSysKpi(sys as SystemKpi);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    void loadData();
    const t = setInterval(() => void loadData(), 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-xs text-gray-500 font-semibold">OMBOR KPI HUB</div>
          <h1 className="text-2xl font-bold text-gray-900">Real-time Ombor Ko'rsatgichlari</h1>
        </div>
        <button
          onClick={() => void loadData()}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
        >
          🔄 Yangilash
        </button>
      </div>

      {loading && <div className="text-center py-10 text-gray-500">⏳ Yuklanmoqda...</div>}

      {/* System KPI */}
      {!loading && sysKpi && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            <KpiBox icon="🏭" label="Omborlar" value={String(sysKpi.totalWarehouses ?? 0)} />
            <KpiBox icon="📦" label="Materiallar" value={String(sysKpi.totalMaterials ?? 0)} />
            <KpiBox icon="💰" label="Jami qiymat" value={fmtMoney(sysKpi.totalStockValue) + " UZS"} color="text-[var(--ep-green)]" />
            <KpiBox icon="⚠️" label="Past stok" value={String(sysKpi.lowStockAlerts ?? 0)} color={(sysKpi.lowStockAlerts ?? 0) > 0 ? "text-[var(--ep-red)]" : "text-[var(--ep-green)]"} />
            <KpiBox icon="⏳" label="Kutmoqda" value={String(sysKpi.pendingMovements ?? 0)} color={(sysKpi.pendingMovements ?? 0) > 0 ? "text-[var(--ep-yellow)]" : "text-[var(--ep-green)]"} />
            <KpiBox icon="🔬" label="QC kutmoqda" value={String(sysKpi.qcPending ?? 0)} color={(sysKpi.qcPending ?? 0) > 0 ? "text-[var(--ep-yellow)]" : "text-[var(--ep-green)]"} />
            <KpiBox icon="📅" label="Bugun" value={String(sysKpi.todayMovements ?? 0)} />
            <KpiBox icon="📊" label="Hafta" value={String(sysKpi.weeklyMovements ?? 0)} />
            <KpiBox icon="📈" label="Oy" value={String(sysKpi.monthlyMovements ?? 0)} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="font-semibold mb-3">🏆 Top omborlar</div>
              {(Array.isArray(sysKpi.topWarehouses) ? sysKpi.topWarehouses : []).map((w, i) => (
                <div key={w.code} className="flex items-center gap-2 mb-2 text-sm">
                  <div className="w-6 h-6 rounded-full bg-blue-50 text-[var(--ep-blue)] flex items-center justify-center text-xs font-bold">{i + 1}</div>
                  <div className="flex-1"><b>{w.code}</b> <span className="text-gray-500">{w.name}</span></div>
                  <div className="w-24 h-2 bg-gray-100 rounded overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${w.valueShare}%` }} />
                  </div>
                  <div className="w-10 text-right font-semibold">{w.valueShare}%</div>
                </div>
              ))}
              {(sysKpi.topWarehouses ?? []).length === 0 && (
                <div className="text-center text-gray-400 py-4">Ma'lumot yo'q</div>
              )}
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="font-semibold mb-3">🔄 Harakatlar (30 kun)</div>
              {(Array.isArray(sysKpi.movementsByType) ? sysKpi.movementsByType : []).map(m => (
                <div key={m.type} className="flex items-center gap-2 mb-2 text-sm">
                  <div className="flex-1">{m.label}</div>
                  <div className="font-semibold">{m.count}</div>
                </div>
              ))}
              {(sysKpi.movementsByType ?? []).length === 0 && (
                <div className="text-center text-gray-400 py-4">Harakatlar yo'q</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Per-warehouse */}
      {!loading && whKpis.length > 0 && (
        <div>
          <div className="text-lg font-bold mb-3">🏪 Har ombor bo'yicha</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {whKpis.map(w => (
              <div
                key={w.warehouseId}
                onClick={() => navigate(`/warehouse/hub/${w.warehouseCode}`)}
                className="bg-white p-4 rounded-lg border border-gray-200 cursor-pointer hover:shadow-md transition"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🏭</span>
                  <div className="flex-1">
                    <div className="font-bold text-sm">{w.warehouseName}</div>
                    <div className="text-xs text-gray-500 font-mono">{w.warehouseCode}</div>
                  </div>
                  <span className="px-2 py-1 bg-blue-50 text-[var(--ep-blue)] rounded text-xs font-bold">
                    {w.warehouseType}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3 text-sm">
                  <Stat label={t('Material')} value={String(w.totalMaterials ?? 0)} />
                  <Stat label="Past" value={String(w.lowStockCount ?? 0)} red={(w.lowStockCount ?? 0) > 0} />
                  <Stat label="Tugagan" value={String(w.outOfStockCount ?? 0)} red={(w.outOfStockCount ?? 0) > 0} />
                  <Stat label="Bugun" value={String(w.movementsToday ?? 0)} />
                  <Stat label="Hafta" value={String(w.movementsThisWeek ?? 0)} />
                  <Stat label="Kutmoqda" value={String(w.pendingApprovals ?? 0)} amber={(w.pendingApprovals ?? 0) > 0} />
                </div>

                <div className="border-t pt-2 mb-2">
                  <div className="text-xs text-gray-500">JAMI QIYMAT</div>
                  <div className="text-lg font-bold text-[var(--ep-green)]">{fmtMoney(w.totalValue)} UZS</div>
                </div>

                {(w.units ?? []).length > 0 && (
                  <div className="border-t pt-2">
                    <div className="text-xs text-gray-500 mb-1">O'LCHOV BIRLIKLARI</div>
                    <div className="flex flex-wrap gap-1">
                      {(w.units ?? []).slice(0, 5).map(u => (
                        <span key={u.unit} className="bg-gray-50 rounded px-2 py-1 text-xs">
                          <b>{fmt(u.quantity, 2)}</b> {u.unit}
                          <span className="text-gray-400"> · {u.count}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(w.employeeCount ?? 0) > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
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

function KpiBox({ icon, label, value, color }: { icon: string; label: string; value: string; color?: string }) {
  return (
    <div className="bg-white rounded-lg p-3 border border-gray-200">
      <div className="text-lg">{icon}</div>
      <div className="text-xs text-gray-500 mt-1 uppercase">{label}</div>
      <div className={`text-xl font-bold mt-1 ${color ?? "text-gray-900"}`}>{value}</div>
    </div>
  );
}

function Stat({ label, value, red, amber }: { label: string; value: string; red?: boolean; amber?: boolean }) {
  return (
    <div>
      <div className={`text-base font-bold ${red ? "text-[var(--ep-red)]" : amber ? "text-[var(--ep-yellow)]" : "text-gray-900"}`}>{value}</div>
      <div className="text-[10px] text-gray-500 uppercase">{label}</div>
    </div>
  );
}
