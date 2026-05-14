/**
 * @module SDExtended
 * @description React page component. Route-level UI — state, hooks, and orchestration only.
 */

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Tabs } from "@/components/ui/tabs";
import { routeTabMap, tabMeta, DEFAULT_MANAGER_QUOTA } from "./SDExtendedTypes";
import type { CrmDeal, UserRecord, PapkaOrder, RentalRecord, ManagerStat } from "./SDExtendedTypes";
import { ManagerPanel, QuotaPanel } from "./SDExtendedSections";
import { RentalPanel, AdvancePanel } from "./SDExtendedSections2";
import { EPPageHeader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

export default function SDExtended() {
  const { t } = useTranslation("common");
  const [location] = useLocation();
  const defaultTab = routeTabMap[location] || "manager";
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    const tab = routeTabMap[location];
    if (tab) setActiveTab(tab);
  }, [location]);

  const meta = tabMeta[activeTab] || tabMeta["manager"];

  // ── Data Fetching ──────────────────────────────────────────────────────────

  const { data: deals = [] } = useQuery<CrmDeal[]>({ queryKey: ["/api/crm/deals"] });

  const { data: _papkaRaw } = useQuery<PapkaOrder[] | PapkaOrder>({ queryKey: ["/api/papka-orders"] });
  const papkaOrders: PapkaOrder[] = Array.isArray(_papkaRaw)
    ? _papkaRaw
    : ((_papkaRaw as PapkaOrder)?.items ?? (_papkaRaw as PapkaOrder)?.data ?? (_papkaRaw as PapkaOrder)?.orders ?? []);

  const { data: users = [] } = useQuery<UserRecord[]>({ queryKey: ["/api/users"] });

  const { data: rentalData = [], isLoading: rentalLoading } = useQuery<RentalRecord[]>({
    queryKey: ["/api/sd/active-rentals"],
  });

  // ── Derived Data ───────────────────────────────────────────────────────────

  const safeDeals = Array.isArray(deals) ? deals : [];
  const safeUsers = Array.isArray(users) ? users : [];

  const managers = safeUsers.filter((u: UserRecord) =>
    ["manager", "sales_manager"].includes(u.role)
  );

  const wonDeals = safeDeals.filter((d: CrmDeal) => d.stage === "won");
  const totalRevenue = wonDeals.reduce((s: number, d: CrmDeal) => s + (Number(d.expectedRevenue) || 0), 0);

  const managerStats: ManagerStat[] = managers.map((m: UserRecord) => {
    const mDeals = safeDeals.filter((d: CrmDeal) => d.assignedTo === m.id);
    const mWon = mDeals.filter((d: CrmDeal) => d.stage === "won");
    const mRevenue = mWon.reduce((s: number, d: CrmDeal) => s + (Number(d.expectedRevenue) || 0), 0);
    const quota = DEFAULT_MANAGER_QUOTA;
    return {
      name: m.fullName || `${m.firstName} ${m.lastName}`,
      totalDeals: mDeals.length,
      wonDeals: mWon.length,
      revenue: mRevenue,
      quota,
      progress: Math.min(100, (mRevenue / quota) * 100),
    };
  });

  const advanceOrders = (Array.isArray(papkaOrders) ? papkaOrders : []).filter((o: PapkaOrder) =>
    ["approved", "ready_for_planning"].includes(o.status)
  );

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

      {/* Tab Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-0">
        <ManagerPanel
          dealsCount={safeDeals.length}
          wonDealsCount={wonDeals.length}
          totalRevenue={totalRevenue}
          managersCount={managers.length}
          managerStats={managerStats}
        />
        <QuotaPanel managerStats={managerStats} />
        <RentalPanel rentalData={Array.isArray(rentalData) ? rentalData : []} rentalLoading={rentalLoading} />
        <AdvancePanel advanceOrders={advanceOrders} />
      </Tabs>
    </div>
  );
}
