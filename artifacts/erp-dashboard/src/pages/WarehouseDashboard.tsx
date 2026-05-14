/**
 * @module WarehouseDashboard
 * @description React page component. Route-level UI.
 */

import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity, ArrowRightLeft, BarChart3, PackageCheck,
  RefreshCw, TrendingUp, Warehouse, Zap,
} from "lucide-react";
import type { DashboardData } from "./WarehouseDashboardTypes";
import { fmt } from "./WarehouseDashboardTypes";
import {
  CategoryStatsPanel,
  KpiRow,
  LowStockPanel,
  PendingTransfersPanel,
  RecentTransactionsPanel,
  WarehouseCard,
} from "./WarehouseDashboardSections";

const QUICK_LINKS = [
  { label: "Qabul Akti (GRN)", url: "/wms/grn", icon: PackageCheck },
  { label: "Inventarizatsiya", url: "/wms/inventory", icon: BarChart3 },
  { label: "Ko'chirish", url: "/wms/transfer", icon: ArrowRightLeft },
  { label: "Ichki So'rov", url: "/wms/internal-requests", icon: Zap },
  { label: "Lot Traceability", url: "/wms/lot-traceability", icon: Activity },
  { label: "Ombor KPI", url: "/wms/kpi", icon: TrendingUp },
] as const;

export default function WarehouseDashboard() {
  const { t } = useTranslation("common");
  const [, navigate] = useLocation();

  const { data, isLoading, refetch, dataUpdatedAt } = useQuery<DashboardData>({
    queryKey: ["/api/warehouse/dashboard"],
    refetchInterval: 60_000,
  });

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  const kpis = data?.kpis;
  const warehouses = Array.isArray(data?.warehouses) ? data.warehouses : [];
  const lowStock = Array.isArray(data?.alerts?.lowStockItems) ? data.alerts.lowStockItems : [];
  const txs = Array.isArray(data?.recentTransactions) ? data.recentTransactions : [];
  const pending = Array.isArray(data?.pendingTransfers) ? data.pendingTransfers : [];
  const catStats = Array.isArray(data?.categoryStats) ? data.categoryStats : [];

  return (
    <div className="flex-1 overflow-auto bg-background p-6 font-inter">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-7 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] text-muted-foreground font-medium">{t("realVaqtMonitoring")}</span>
            {lastUpdated && <span className="text-[11px] text-muted-foreground">· {lastUpdated}</span>}
          </div>
          <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("omborBoshqaruvi1")}</b></>}
        title={t("omborBoshqaruvi1")}
      />
          <p className="text-sm text-muted-foreground mt-1">{t("barchaOmborlarHolatiZaxiraVa")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" />{t("refresh")}
          </Button>
          <Button size="sm" onClick={() => navigate("/wms/transfer")} className="gap-1.5 text-xs">
            <ArrowRightLeft className="w-3.5 h-3.5" />{t("move")}
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-7">
        <KpiRow kpis={kpis} isLoading={isLoading} />
      </div>

      {/* Warehouse Grid */}
      <div className="mb-7">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Warehouse className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">{t("omborlarRoyxati")}</p>
              <p className="text-xs text-muted-foreground">{t("bosingBatafsilKoring")}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">{warehouses.length} ta ombor</Badge>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={`k-${i}`} className="border border-border/60 rounded-xl p-5">
                <Skeleton className="w-12 h-12 rounded-lg mb-4" />
                <Skeleton className="h-5 w-3/4 mb-2 rounded-lg" />
                <Skeleton className="h-3 w-full mb-3 rounded-lg" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Skeleton className="h-12 rounded-lg" />
                  <Skeleton className="h-12 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : warehouses.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-xl">
            <Warehouse className="w-16 h-16 mx-auto mb-4 text-muted-foreground/20" />
            <p className="text-muted-foreground font-medium">{t("faolOmborlarTopilmadi")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {warehouses.map((wh) => (
              <WarehouseCard key={wh.id} wh={wh} onClick={() => navigate(`/warehouse/hub/${wh.code}`)} />
            ))}
          </div>
        )}
      </div>

      {/* Bottom 3-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <LowStockPanel lowStock={lowStock} isLoading={isLoading} />
        <RecentTransactionsPanel txs={txs} isLoading={isLoading} />
        <div className="space-y-4">
          <PendingTransfersPanel pending={pending} isLoading={isLoading} onNavigate={navigate} />
          <CategoryStatsPanel catStats={catStats} isLoading={isLoading} />
        </div>
      </div>

      {/* Quick links bar */}
      <div className="mt-6 pt-5 border-t border-border/60">
        <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">{t("tezkorHavolalar")}</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_LINKS.map((link) => (
            <Button key={link.url} variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => navigate(link.url)}>
              <link.icon className="w-3.5 h-3.5" />
              {link.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

import { EPPageHeader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
