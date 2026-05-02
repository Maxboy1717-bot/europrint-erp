import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Clock, Users, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyStateWidget } from "@/components/director/CompanyStateWidget";
import { IdealVsActualPanel } from "@/components/director/IdealVsActualPanel";
import { DirectorHeader } from "@/components/director/DirectorHeader";
import { AISummaryCard } from "@/components/director/AISummaryCard";
import { KpiSummaryCards } from "@/components/director/KpiSummaryCards";
import { OverdueOrdersCard } from "@/components/director/OverdueOrdersCard";
import { HRStatusCard } from "@/components/director/HRStatusCard";
import { ProductionStatusCard } from "@/components/director/ProductionStatusCard";
import { WarehouseStatusCard } from "@/components/director/WarehouseStatusCard";
import { FinanceCard } from "@/components/director/FinanceCard";
import { AlertsCard } from "@/components/director/AlertsCard";
import { KpiScorecard } from "@/components/director/KpiScorecard";
import { SalesSummaryCard } from "@/components/director/SalesSummaryCard";
import { QuickActionsCard } from "@/components/director/QuickActionsCard";
import type {
  DirectorSummary, DirDashboard, DirSummary, ProductionData,
  HRData, FinanceData, AlertItem, AISummary, WMSRentalData, KpiWithValue,
} from "@/components/director/types";

export default function DirectorDashboard() {
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
    toast({ title: "Ma'lumotlar yangilandi" });
  }

  const vipMutation = useMutation({
    mutationFn: async (orderId: number) => {
      return apiRequest("POST", `/api/director/orders/${orderId}/vip`, {});
    },
    onSuccess: () => { toast({ title: "VIP so'rovi yuborildi", description: "Menejer xabardor qilindi" }); },
    onError: () => { toast({ title: "Xatolik", variant: "destructive" }); },
  });

  const runningMachines = prod?.sessionsToday?.filter(s => s.status === "running" || s.status === "active").length ?? 0;
  const totalMachines = prod?.sessionsToday?.length ?? 0;
  const criticalAlerts = alertsData?.alerts?.filter(a => a.severity === "critical") ?? [];

  return (
    <div className="flex-1 overflow-auto bg-background p-5 space-y-5 pb-12">

      <div className="flex items-center justify-between gap-2">
        <DirectorHeader criticalAlerts={criticalAlerts} onRefresh={refreshAll} />
        <Button variant="outline" size="sm" onClick={refreshAll}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <AISummaryCard ai={ai} aiLoad={aiLoad} />

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
        </div>
      </div>

      <KpiScorecard kpis={kpis} kpisLoad={kpisLoad} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SalesSummaryCard dirSum={dirSum} dirSumLoad={dirSumLoad} />
        <QuickActionsCard onAction={(label) => toast({ title: label, description: "Funksiya tez kunda qo'shiladi" })} />
      </div>

      <CompanyStateWidget />
      <IdealVsActualPanel />

      {councils.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Kengashlar
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
          So'nggi yangilanish: {dirSum?.generatedAt
            ? new Date(dirSum.generatedAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
            : "—"}
        </span>
        <span className="ml-auto">Europrint ERP — Direktor Panel v3.0</span>
      </div>
    </div>
  );
}
