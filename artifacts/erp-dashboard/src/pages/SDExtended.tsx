/**
 * @module SDExtended
 * @description React page component. Route-level UI — state, hooks, and orchestration only.
 */

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Tabs } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { routeTabMap, tabMeta, DEFAULT_MANAGER_QUOTA } from "./SDExtendedTypes";
import type { UserRecord, PapkaOrder, RentalRecord, ManagerStat } from "./SDExtendedTypes";
import { ManagerPanel, QuotaPanel } from "./SDExtendedSections";
import { RentalPanel, AdvancePanel } from "./SDExtendedSections2";
import { EPPageHeader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

// ── KPI Team Response ─────────────────────────────────────────────────────────
interface KpiTeamItem {
  managerId: number;
  totalSales: number;
  ordersCount: number;
}

// ── Quota Response ────────────────────────────────────────────────────────────
interface QuotaResponse {
  target?: number;
  achieved?: number;
  remaining?: number;
  ordersThisMonth?: number;
  conversionRate?: number;
  leadsByStatus?: Record<string, number>;
}

export default function SDExtended() {
  const { t } = useTranslation("common");
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();
  const defaultTab = routeTabMap[location] || "manager";
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    const tab = routeTabMap[location];
    if (tab) setActiveTab(tab);
  }, [location]);

  const meta = tabMeta[activeTab] || tabMeta["manager"];

  // ── Data Fetching ──────────────────────────────────────────────────────────

  const { data: kpiTeamRaw } = useQuery<KpiTeamItem[]>({
    queryKey: ["/api/sd/kpi/team"],
    queryFn: () => apiRequest("GET", "/api/sd/kpi/team?year=2026&month=5"),
    enabled: isAuthenticated === true,
  });

  const { data: quotaData } = useQuery<QuotaResponse>({
    queryKey: ["/api/sd/dashboard/quota"],
    queryFn: () => apiRequest("GET", "/api/sd/dashboard/quota"),
    enabled: isAuthenticated === true,
  });

  const { data: _papkaRaw } = useQuery<PapkaOrder[] | PapkaOrder>({ queryKey: ["/api/papka-orders"] });
  const papkaOrders: PapkaOrder[] = Array.isArray(_papkaRaw)
    ? _papkaRaw
    : ((_papkaRaw as PapkaOrder)?.items ?? (_papkaRaw as PapkaOrder)?.data ?? (_papkaRaw as PapkaOrder)?.orders ?? []);

  const { data: users = [] } = useQuery<UserRecord[]>({ queryKey: ["/api/users"] });

  const { data: rentalData = [], isLoading: rentalLoading } = useQuery<RentalRecord[]>({
    queryKey: ["/api/sd/active-rentals"],
  });

  // ── Derived Data ───────────────────────────────────────────────────────────

  const kpiTeam: KpiTeamItem[] = Array.isArray(kpiTeamRaw) ? kpiTeamRaw : [];
  const safeUsers = Array.isArray(users) ? users : [];

  // Build managerStats from SD KPI team endpoint
  const managerStats: ManagerStat[] = kpiTeam.map((item: KpiTeamItem) => {
    const user = safeUsers.find((u: UserRecord) => u.id === item.managerId);
    const name = user
      ? (user.fullName || `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || `Menejer #${item.managerId}`)
      : `Menejer #${item.managerId}`;
    const revenue = item.totalSales ?? 0;
    const quota = DEFAULT_MANAGER_QUOTA;
    return {
      name,
      totalDeals: item.ordersCount ?? 0,
      wonDeals: item.ordersCount ?? 0,
      revenue,
      quota,
      progress: Math.min(100, quota > 0 ? (revenue / quota) * 100 : 0),
    };
  });

  // Quota-based stats for summary cards
  const quotaTarget = quotaData?.target ?? 0;
  const quotaAchieved = quotaData?.achieved ?? 0;
  const quotaRemaining = quotaData?.remaining ?? Math.max(0, quotaTarget - quotaAchieved);
  const quotaPercent = quotaTarget > 0 ? (quotaAchieved / quotaTarget * 100).toFixed(1) : "0.0";

  // Totals for ManagerPanel summary cards
  const totalRevenue = managerStats.reduce((s, m) => s + m.revenue, 0);
  const totalDeals = managerStats.reduce((s, m) => s + m.totalDeals, 0);
  const wonDeals = managerStats.reduce((s, m) => s + m.wonDeals, 0);
  const managersCount = managerStats.length;

  const advanceOrders = (Array.isArray(papkaOrders) ? papkaOrders : []).filter((o: PapkaOrder) =>
    ["approved", "ready_for_planning"].includes(o.status)
  );

  // Audit 2026-08-08: AdvancePanel avval "Kritik muddati o'tgan"/"Bajarilgan avanslar"
  // kartalarida qattiq-kodlangan "0" ko'rsatardi (hech qanday hisob-kitobga bog'lanmagan,
  // Qoida 10/12 buzilishi). Endi real ma'lumotdan hisoblanadi: muddati o'tgan — kutilayotgan
  // avans-buyurtmalar orasida `tayyor_bolish_sanasi` bugundan oldin bo'lganlar; bajarilgan —
  // butun papka_orders ro'yxatidan `status === "completed"` (PapkaOrders.tsx'da xuddi shu
  // qiymat ishlatiladi — yangi status ixtiro qilinmadi).
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const criticalOverdueCount = advanceOrders.filter((o: PapkaOrder) =>
    o.tayyor_bolish_sanasi && new Date(o.tayyor_bolish_sanasi) < todayStart
  ).length;
  const completedAdvancesCount = (Array.isArray(papkaOrders) ? papkaOrders : []).filter(
    (o: PapkaOrder) => o.status === "completed"
  ).length;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 min-h-full">
      {/* Header + Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <EPPageHeader
        breadcrumb={<>{t("dashboardSd")}<b className="text-foreground">{meta?.title}</b></>}
        title={meta?.title || "Sales"}
        subtitle={t("sotuvModuliKengaytirilganBoshqaruvPaneli")}
      />
        </div>
        <div className="flex bg-muted/40 p-1 rounded-xl border border-border/30">
          {Object.entries(tabMeta).map(([tab, data]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <data.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{data.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quota summary row (shown when quota tab active) */}
      {activeTab === "quota" && quotaTarget > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Maqsad</p>
            <p className="text-2xl font-bold">{(quotaTarget / 1_000_000).toFixed(1)}M</p>
          </div>
          <div className="bg-card rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Haqiqiy</p>
            <p className="text-2xl font-bold text-[var(--ep-green)]">{(quotaAchieved / 1_000_000).toFixed(1)}M</p>
          </div>
          <div className="bg-card rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Qolgan</p>
            <p className="text-2xl font-bold text-[var(--ep-yellow)]">{(quotaRemaining / 1_000_000).toFixed(1)}M</p>
          </div>
          <div className="bg-card rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Bajarilish</p>
            <p className="text-2xl font-bold text-primary">{quotaPercent}%</p>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-0">
        <ManagerPanel
          dealsCount={totalDeals}
          wonDealsCount={wonDeals}
          totalRevenue={totalRevenue}
          managersCount={managersCount}
          managerStats={managerStats}
        />
        <QuotaPanel managerStats={managerStats} />
        <RentalPanel rentalData={Array.isArray(rentalData) ? rentalData : []} rentalLoading={rentalLoading} />
        <AdvancePanel
          advanceOrders={advanceOrders}
          criticalOverdueCount={criticalOverdueCount}
          completedAdvancesCount={completedAdvancesCount}
        />
      </Tabs>
    </div>
  );
}
