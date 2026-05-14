/**
 * @module SDOverviewDashboard
 * @description React page component. Route-level UI.
 */

import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageState } from "@/components/ui/page-state";
import { RefreshCw } from "lucide-react";
import {
  ShoppingCart, Package, Warehouse, Truck, AlertTriangle, DollarSign, ArrowRight, BarChart3,
  Activity, PieChart, CheckSquare, Clock, Zap,
} from "lucide-react";
import { fmt, LEAD_STATUS_LABELS } from "@/lib/sd-helpers";
import type {
  OverviewDashboardData,
  ManagerActionsData,
  CrmActivity,
} from "./SDOverviewDashboardTypes";
import {
  ACTIVITY_TYPE_ICONS,
  ACTIVITY_TYPE_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  ACTION_ICONS,
} from "./SDOverviewDashboardTypes";
import { EPPageHeader, EPStatusPill } from "@/components/ep";

export default function SDOverviewDashboard() {
  const { data: overview, isLoading, isError, refetch } = useQuery<OverviewDashboardData>({
    queryKey: ["/api/sd/dashboard/overview"],
  });

  const { data: managerActions } = useQuery<ManagerActionsData>({
    queryKey: ["/api/sd/dashboard/manager-actions"],
    refetchInterval: 60_000,
  });

  const { data: todayActivities = [] } = useQuery<CrmActivity[]>({
    queryKey: ["/api/crm/followup-activities/today"],
  });

  const stats = [
    { label: "Yangi buyurtmalar (hafta)", value: overview?.newOrders?.count || 0, sub: fmt(overview?.newOrders?.amount || 0) + " so'm", icon: ShoppingCart, color: "text-[var(--ep-blue)]" },
    { label: "Ishlab chiqarishda", value: overview?.inProduction?.count || 0, sub: fmt(overview?.inProduction?.amount || 0) + " so'm", icon: Package, color: "text-[var(--ep-primary)]" },
    { label: "Omborga keldi", value: overview?.inWarehouse?.count || 0, sub: fmt(overview?.inWarehouse?.amount || 0) + " so'm", icon: Warehouse, color: "text-[var(--ep-cyan)]" },
    { label: "Yetkazilmoqda", value: overview?.delivering?.count || 0, sub: "Yo'lda", icon: Truck, color: "text-[var(--ep-green)]" },
    { label: "Debitorlar", value: fmt(overview?.debitors?.amount || 0), sub: `${overview?.debitors?.count || 0} ta to'lov`, icon: AlertTriangle, color: "text-[var(--ep-red)]" },
    { label: "Oylik tushumlar", value: fmt(overview?.monthlyRevenue || 0), sub: fmt(overview?.monthlyCollected || 0) + " yig'ildi", icon: DollarSign, color: "text-[var(--ep-green)]" },
  ];

  const funnel = overview?.leadFunnel || {};
  const funnelOrder = ["new", "working", "quoted", "negotiating", "won", "lost", "frozen"];

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BarChart3 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <EPPageHeader
        breadcrumb={<>Dashboard · <b className="text-foreground">Umumiy Ko'rinish</b></>}
        title="Umumiy Ko'rinish"
        subtitle="Savdo tizimining barcha ko'rsatkichlari (Real-time)"
      />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-card rounded-lg p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Oylik buyurtmalar</p>
            <p className="text-4xl font-bold tracking-tight text-foreground mt-1">{overview?.monthlyOrders || 0} ta</p>
          </div>
          <div className="bg-card rounded-lg p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Oylik tushum</p>
            <p className="text-4xl font-bold tracking-tight text-foreground mt-1">{fmt(overview?.monthlyCollected || 0)}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <PageState
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        skeleton="dashboard"
        errorTitle="Dashboard yuklanmadi"
        errorMessage="Server bilan bog'lanishda xatolik."
      >
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
            {(Array.isArray(stats) ? stats : []).map(s => (
              <div key={s.label} className="bg-card rounded-lg p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</p>
                  <s.icon className={cn("w-4 h-4", s.color)} />
                </div>
                <p className="text-4xl font-bold tracking-tight text-foreground mt-1">{s.value}</p>
                <p className="text-sm font-medium text-primary mt-1">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* TZ-04: Menejer Action List — qarz, kechikkan, taklif */}
          {managerActions && managerActions.actionList && managerActions.actionList.length > 0 && (
            <div className="bg-card rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  Muhim harakatlar
                </h2>
                <div className="flex items-center gap-2">
                  <EPStatusPill tone="neutral" className="no-default-hover-elevate">
                    {managerActions.overduePayments?.total || 0} qarz
                  </EPStatusPill>
                  <Badge className="bg-amber-100 text-amber-800 no-default-hover-elevate">
                    {managerActions.delayedOrders?.total || 0} kechikkan
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(Array.isArray(managerActions.actionList) ? managerActions.actionList : []).map((action, idx) => {
                  const Icon = ACTION_ICONS[action.type] || AlertTriangle;
                  return (
                    <div
                      key={idx}
                      data-testid={`card-action-${action.type}-${idx}`}
                      className={cn("flex items-start gap-3 p-4 rounded-lg border", PRIORITY_COLORS[action.priority])}
                    >
                      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{action.title}</p>
                        {action.amount !== undefined && action.amount > 0 && (
                          <p className="text-xs font-medium mt-0.5">{fmt(action.amount)} so'm</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <EPStatusPill tone="neutral" className="text-[10px] no-default-hover-elevate px-1.5 py-0.5">
                            {PRIORITY_LABELS[action.priority]}
                          </EPStatusPill>
                          <span className="text-xs underline cursor-pointer">{action.action}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[var(--ep-red)]">{fmt(managerActions.overduePayments?.amount || 0)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Muddati o'tgan qarz</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[var(--ep-yellow)]">{managerActions.delayedOrders?.total || 0} ta</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Kechikkan buyurtma</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[var(--ep-blue)]">{managerActions.pendingProposals?.total || 0} ta</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Kutilayotgan taklif</p>
                </div>
              </div>
            </div>
          )}

          {/* Today's CRM Activities */}
          <div className="bg-card rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-primary" />
                Bugungi faoliyatlar
              </h2>
              <div className="flex items-center gap-2">
                <EPStatusPill tone="neutral" className="no-default-hover-elevate">{(Array.isArray(todayActivities) ? todayActivities : []).filter(a => !a.isDone).length} aktiv</EPStatusPill>
                <EPStatusPill tone="success">{(Array.isArray(todayActivities) ? todayActivities : []).filter(a => a.isDone).length} bajarildi</EPStatusPill>
              </div>
            </div>
            {todayActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Bugun uchun faoliyat rejalashtirilmagan</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(Array.isArray(todayActivities) ? todayActivities : []).slice(0, 6).map(act => {
                  const Icon = ACTIVITY_TYPE_ICONS[act.type] || Activity;
                  const isOverdue = act.dueDate && new Date(act.dueDate) < new Date() && !act.isDone;
                  return (
                    <div key={act.id} data-testid={`card-dashboard-activity-${act.id}`}
                      className={cn("flex items-start gap-3 p-3 rounded-lg", act.isDone ? "opacity-60 bg-muted/60" : isOverdue ? "bg-red-50" : "bg-muted/40")}>
                      <Icon className={cn("w-4 h-4 shrink-0 mt-0.5", isOverdue ? "text-[var(--ep-red)]" : "text-primary")} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{act.subject}</p>
                        <p className="text-xs text-muted-foreground">{ACTIVITY_TYPE_LABELS[act.type] || act.type}</p>
                        {act.dueDate && (
                          <p className={cn("text-xs flex items-center gap-1 mt-0.5", isOverdue ? "text-[var(--ep-red)] font-medium" : "text-muted-foreground")}>
                            <Clock className="w-3 h-3" /> {act.dueDate.slice(11, 16)}
                          </p>
                        )}
                      </div>
                      {act.isDone && <CheckSquare className="w-4 h-4 text-[var(--ep-green)] shrink-0" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl p-6">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-primary" />
                Lead Funnel (Sotuv voronkasi)
              </h2>
              <div className="flex flex-wrap gap-3">
                {(Array.isArray(funnelOrder) ? funnelOrder : []).map(st => (
                  <div key={st} className="flex items-center gap-2 p-2 bg-muted/40 rounded-lg">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs font-semibold border-none",
                      st === "won" ? "bg-green-100 text-green-800" :
                      st === "lost" ? "bg-red-100 text-red-800" :
                      st === "negotiating" ? "bg-amber-100 text-amber-800" :
                      "bg-primary/10 text-primary"
                    )}>
                      {LEAD_STATUS_LABELS[st] || st}
                    </span>
                    <span className="font-bold text-sm text-foreground">{funnel[st] || 0}</span>
                    {st !== "frozen" && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-xl p-6">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-4">
                <PieChart className="w-4 h-4 text-primary" />
                Konversiya tahlili
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Yutilgan leadlar (Conversion Rate)</span>
                  <span className="text-lg font-bold text-foreground">
                    {overview?.monthlyOrders && Object.values(funnel).reduce((a: number, b: number) => a + b, 0) > 0
                      ? Math.round((Number(funnel.won || 0) / Object.values(funnel).reduce((a: number, b: number) => a + b, 0)) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="w-full bg-muted/40 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${overview?.monthlyOrders && Object.values(funnel).reduce((a: number, b: number) => a + b, 0) > 0
                      ? Math.round((Number(funnel.won || 0) / Object.values(funnel).reduce((a: number, b: number) => a + b, 0)) * 100)
                      : 0}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Jami leadlardan {funnel.won || 0} tasi muvaffaqiyatli buyurtmaga aylantirilgan.
                </p>
              </div>
            </div>
          </div>
        </>
      </PageState>
    </div>
  );
}
