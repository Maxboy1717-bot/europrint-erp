/**
 * @module KpiSummaryCards
 * @description React UI component.
 */

import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Package, Factory, Users, AlertTriangle, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrendChip, formatMoney } from "@/components/director/helpers";
import type { DirectorSummary, DirDashboard, DirSummary } from "@/components/director/types";

interface KpiSummaryCardsProps {
  erp: DirectorSummary | undefined;
  dash: DirDashboard | undefined;
  dirSum: DirSummary | undefined;
  isLoading: boolean;
  runningMachines: number;
  totalMachines: number;
}

export function KpiSummaryCards({
  erp, dash, dirSum, isLoading, runningMachines, totalMachines,
}: KpiSummaryCardsProps) {
  const items = [
    { label: "Oylik Daromad", value: erp?.revenue?.formatted ?? `${formatMoney(dirSum?.orders?.monthRevenue ?? 0)} so'm`, sub: "vs o'tgan oy", change: erp?.revenue?.change, trend: erp?.revenue?.trend, icon: DollarSign, color: "text-[var(--ep-green)]", bg: "bg-emerald-50" },
    { label: "Jami Buyurtma", value: erp?.orders?.formatted ?? String(dash?.orders?.month ?? 0), sub: `${dirSum?.orders?.today ?? 0} ta bugun`, change: erp?.orders?.change, trend: erp?.orders?.trend, icon: Package, color: "text-[var(--ep-blue)]", bg: "bg-blue-50" },
    { label: "Mashinalar", value: totalMachines ? `${runningMachines}/${totalMachines}` : `${dash?.orders?.inProduction ?? 0} ta`, sub: "hozir ishlamoqda", icon: Factory, color: "text-[var(--ep-primary)]", bg: "bg-orange-50" },
    { label: "OEE", value: erp?.production?.formatted ?? (dash?.production?.oee ? `${dash.production.oee}%` : "—"), sub: "O'rtacha samaradorlik", change: erp?.production?.change, trend: erp?.production?.trend, icon: Gauge, color: "text-[var(--ep-purple)]", bg: "bg-violet-50" },
    { label: "Xodimlar", value: erp?.employees?.formatted ?? `${dash?.hr?.present ?? 0}/${dash?.hr?.total ?? 0}`, sub: `${dash?.hr?.attendanceRate ?? 0}% davomad`, change: erp?.employees?.change, trend: erp?.employees?.trend, icon: Users, color: "text-[var(--ep-cyan)]", bg: "bg-teal-50" },
    { label: "Kechikkan", value: String(dirSum?.orders?.overdue ?? dash?.orders?.overdue ?? 0), sub: "muddati o'tgan", icon: AlertTriangle, color: (dirSum?.orders?.overdue ?? 0) > 0 ? "text-[var(--ep-red)]" : "text-[var(--ep-green)]", bg: (dirSum?.orders?.overdue ?? 0) > 0 ? "bg-red-50" : "bg-emerald-50" },
  ];

  return (
    <div>
      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Bugungi Holat</h2>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array(6).fill(0).map((_, i) => <Skeleton key={`k-${i}`} className="h-28 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {(Array.isArray(items) ? items : []).map((item, i) => (
            <div key={`k-${i}`} className="rounded-xl border bg-card p-4 space-y-2" data-testid={`kpi-card-${i}`}>
              <div className="flex items-center justify-between">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", item.bg)}>
                  <item.icon className={cn("w-4 h-4", item.color)} />
                </div>
                {item.change && <TrendChip change={item.change} trend={item.trend} />}
              </div>
              <p className="text-2xl font-bold text-foreground">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-[10px] text-muted-foreground">{item.sub}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
