/**
 * @module DirectorDashboard
 * @description React page component. Route-level UI.
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Clock, Users, RefreshCw, Bell, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EPPageHeader, EPStatusPill } from "@/components/ep";
import { tLabel } from "@/lib/i18n/tLabel";
import { CompanyStateWidget } from "@/components/director/CompanyStateWidget";
import { IdealVsActualPanel } from "@/components/director/IdealVsActualPanel";
import { AISummaryCard } from "@/components/director/AISummaryCard";
import { KpiSummaryCards } from "@/components/director/KpiSummaryCards";
import { OverdueOrdersCard } from "@/components/director/OverdueOrdersCard";
import { HRStatusCard } from "@/components/director/HRStatusCard";
import { ProductionStatusCard } from "@/components/director/ProductionStatusCard";
import { WarehouseStatusCard } from "@/components/director/WarehouseStatusCard";
import { FinanceCard } from "@/components/director/FinanceCard";
import { AlertsCard } from "@/components/director/AlertsCard";
import { PendingApprovalsCard } from "@/components/director/PendingApprovalsCard";
import { KpiScorecard } from "@/components/director/KpiScorecard";
import { SalesSummaryCard } from "@/components/director/SalesSummaryCard";
import { QuickActionsCard } from "@/components/director/QuickActionsCard";
import { MetricCard } from "@/components/director/MetricCard";
import { AlertFeed } from "@/components/director/AlertFeed";
import { AIAdvisor } from "@/components/director/AIAdvisor";
import { ModuleHealthGrid } from "@/components/director/ModuleHealthGrid";
import { CardAiInsightsCard } from "@/components/director/CardAiInsightsCard";
import { Inbox, AlertTriangle, Package, Activity, Sparkles } from "lucide-react";
import { useTranslation } from '@/lib/i18n';
import type {
  DirectorSummary, DirDashboard, DirSummary, ProductionData,
  HRData, FinanceData, AlertItem, AISummary, WMSRentalData, KpiWithValue,
} from "@/components/director/types";

export default function DirectorDashboard() {
  const { t } = useTranslation("common");
  const { toast } = useToast();

  const { data: erp, isLoading: erpLoad } = useQuery<DirectorSummary>({ queryKey: ["/api/europrint-control/director-summary"] });
  const { data: dash, isLoading: dashLoad, refetch: refetchDash } = useQuery<DirDashboard>({ queryKey: ["/api/director/dashboard"], refetchInterval: 60000 });
  const { data: dirSum, isLoading: dirSumLoad, refetch: refetchSum } = useQuery<DirSummary>({ queryKey: ["/api/director/summary"], refetchInterval: 60000 });
  const { data: prod, isLoading: prodLoad } = useQuery<ProductionData>({ queryKey: ["/api/director/production"], refetchInterval: 60000 });
  const { data: hr, isLoading: hrLoad } = useQuery<HRData>({ queryKey: ["/api/director/hr"], refetchInterval: 120000 });
  const { data: fin, isLoading: finLoad } = useQuery<FinanceData>({ queryKey: ["/api/director/finance"], refetchInterval: 120000 });
  const { data: alertsData } = useQuery<{ alerts: AlertItem[]; count: number }>({ queryKey: ["/api/director/alerts"], refetchInterval: 30000 });
  const { data: ai, isLoading: aiLoad } = useQuery<AISummary>({ queryKey: ["/api/director/ai-summary"], refetchInterval: 300000 });
  const { data: wmsRental, isLoading: wmsRentalLoad } = useQuery<WMSRentalData>({ queryKey: ["/api/director/wms-rental"], refetchInterval: 120000 });
  const { data: kpis = [], isLoading: kpisLoad } = useQuery<KpiWithValue[]>({ queryKey: ["/api/europrint-control/director-kpis"] });
  const { data: validSummary } = useQuery<{ totalRules: number; issueCount: number; criticalCount: number }>({ queryKey: ["/api/europrint-control/validation-summary"] });
  const { data: councils = [] } = useQuery<{ id: number; name: string; type: string }[]>({ queryKey: ["/api/coordination/councils"] });

  function refreshAll() {
    refetchDash(); refetchSum();
    toast({ title: t("malumotlarYangilandi") });
  }

  const vipMutation = useMutation({
    mutationFn: async (orderId: number) => {
      return apiRequest("POST", `/api/director/orders/${orderId}/vip`, {});
    },
    onSuccess: () => { toast({ title: t("vipSorovYuborildi"), description: t("menejerXabardorQilindi") }); },
    onError: () => { toast({ title: t("xatolik"), variant: "destructive" }); },
  });

  const runningMachines = prod?.sessionsToday?.filter(s => s.status === "running" || s.status === "active").length ?? 0;
  const totalMachines = prod?.sessionsToday?.length ?? 0;
  const criticalAlerts = alertsData?.alerts?.filter(a => a.severity === "critical") ?? [];

  return (
    <div className="flex-1 overflow-auto bg-background p-5 space-y-6 pb-12">

      <EPPageHeader
        title={
          <>
            {tLabel("director.titlePrefix", "Direktor")}{" "}
            <span className="text-primary">{tLabel("director.titleSuffix", "paneli")}</span>
          </>
        }
        subtitle={t("realVaqtKorsatkichlarBarcha6")}
        status={
          criticalAlerts.length > 0 ? (
            <EPStatusPill tone="danger">
              <Bell className="w-3.5 h-3.5 mr-1 animate-pulse" />
              {criticalAlerts.length} {t("kritik", "kritik ogohlantirish")}
            </EPStatusPill>
          ) : undefined
        }
        actions={
          <>
            <Button variant="outline" size="sm" onClick={refreshAll} data-testid="button-refresh-director">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> {t("refresh")}
            </Button>
            <Button size="sm" data-testid="button-export-director">
              <BarChart3 className="h-3.5 w-3.5 mr-1.5" /> {t("report")}
            </Button>
          </>
        }
      />

      <AISummaryCard ai={ai} aiLoad={aiLoad} />

      {/* ── AI Agentlar — KPI ko'rsatkichlari (5 ta yangi MetricCard) ── */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-[var(--ep-blue)]" /> {t("aiAgentlarKuzatuv")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <MetricCard
            label={t("kechikkanBuyurtma")}
            value={prod?.delayedOrders ?? 0}
            unit="ta"
            tone={(prod?.delayedOrders ?? 0) > 5 ? 'red' : 'amber'}
            icon={<Package className="h-4 w-4" />}
            warning={(prod?.delayedOrders ?? 0) > 10}
          />
          <MetricCard
            label={t("slaBuzilgan24h")}
            value={ai?.cc?.inboxOverdue ?? 0}
            unit="ta"
            tone={(ai?.cc?.inboxOverdue ?? 0) > 0 ? 'red' : 'green'}
            icon={<Inbox className="h-4 w-4" />}
            warning={(ai?.cc?.inboxOverdue ?? 0) > 0}
          />
          <MetricCard
            label={t("kritikQoldiq")}
            value={dash?.criticalStock ?? 0}
            unit="ta"
            tone={(dash?.criticalStock ?? 0) > 5 ? 'red' : 'amber'}
            icon={<AlertTriangle className="h-4 w-4" />}
          />
          <MetricCard
            label={t("bugungiDavomatsiz")}
            value={hr?.absentToday ?? 0}
            unit={t("unitXodim")}
            tone={(hr?.absentToday ?? 0) > 5 ? 'red' : 'slate'}
            icon={<Activity className="h-4 w-4" />}
          />
          <MetricCard
            label={t("brakFoizi")}
            value={prod?.defectPct ?? 0}
            unit="%"
            tone={(prod?.defectPct ?? 0) > 3 ? 'red' : 'green'}
            icon={<AlertTriangle className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* ── AI Advisor + Alert Feed ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <AIAdvisor />
        <AlertFeed limit={15} />
      </div>

      <CardAiInsightsCard items={dash?.aiInsights} isLoading={dashLoad} />

      {/* ── 20 modul holati grid ── */}
      <ModuleHealthGrid />

      <KpiSummaryCards
        erp={erp}
        dash={dash}
        dirSum={dirSum}
        isLoading={erpLoad || dashLoad || dirSumLoad}
        runningMachines={runningMachines}
        totalMachines={totalMachines}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="space-y-5">
          <OverdueOrdersCard
            prod={prod}
            prodLoad={prodLoad}
            onVipRequest={(id) => vipMutation.mutate(id)}
          />
          <HRStatusCard hr={hr} hrLoad={hrLoad} />
        </div>

        <div className="space-y-5">
          <ProductionStatusCard
            prod={prod}
            prodLoad={prodLoad}
            runningMachines={runningMachines}
            totalMachines={totalMachines}
          />
          <WarehouseStatusCard
            dash={dash}
            wmsRental={wmsRental}
            wmsRentalLoad={wmsRentalLoad}
            validationIssueCount={validSummary?.issueCount}
            totalRules={validSummary?.totalRules}
          />
        </div>

        <div className="space-y-5">
          <FinanceCard fin={fin} finLoad={finLoad} />
          <AlertsCard alerts={alertsData?.alerts} alertCount={alertsData?.count ?? 0} />
          <PendingApprovalsCard />
        </div>
      </div>

      <KpiScorecard kpis={kpis} kpisLoad={kpisLoad} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SalesSummaryCard dirSum={dirSum} dirSumLoad={dirSumLoad} />
        <QuickActionsCard onAction={(label) => toast({ title: label, description: t("funksiyaTezKundaQoshiladi") })} />
      </div>

      <CompanyStateWidget />
      <IdealVsActualPanel />

      {councils.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              {t("kengashlar")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(Array.isArray(councils) ? councils : []).map((c) => (
                <Badge key={c.id} variant="secondary" className="text-xs">
                  {c.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
        <Clock className="w-3.5 h-3.5" />
        <span>
          {t("songgiYangilanish")}: {dirSum?.generatedAt
            ? new Date(dirSum.generatedAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
            : "—"}
        </span>
        <span className="ml-auto">{t("europrintErpDirektorPanelV3")}</span>
      </div>
    </div>
  );
}
