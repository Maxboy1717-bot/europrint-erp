/**
 * @module SDSalesManagement
 * @description React page component. Route-level UI.
 * State management, hooks, and orchestration only — rendering delegated to sub-files.
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { FileText, TrendingUp, BarChart2, Award, RefreshCw } from "lucide-react";

import { URL_TAB_MAP, Invoice, ForecastHistory, AnalyticsMonthly, CommissionRecord, LeaderboardEntry } from "./SDSalesManagementTypes";
import { InvoicesSection, ForecastSection, AnalyticsSection, CommissionSection } from "./SDSalesManagementSections";
import { EPPageHeader } from "@/components/ep";

export default function SDSalesManagement() {
  const { toast } = useToast();
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState(() => URL_TAB_MAP[location] || "invoices");

  useEffect(() => {
    const tab = URL_TAB_MAP[location];
    if (tab) setActiveTab(tab);
  }, [location]);

  const { data: invoices = [], isLoading: invLoading, refetch: refetchInv } = useQuery<Invoice[]>({
    queryKey: ["/api/sales/invoices"],
  });

  const { data: forecastHistory = [], isLoading: fcastLoading } = useQuery<ForecastHistory[]>({
    queryKey: ["/api/sales/forecast/history"],
    enabled: activeTab === "forecast",
  });

  const { data: forecastAccuracy = null } = useQuery<{ accuracy: number; totalForecasts: number }>({
    queryKey: ["/api/sales/forecast/accuracy"],
    enabled: activeTab === "forecast",
  });

  const { data: analyticsMonthly = [], isLoading: analyticsLoading } = useQuery<AnalyticsMonthly[]>({
    queryKey: ["/api/sales/analytics/monthly-trend"],
    enabled: activeTab === "analytics",
  });

  const { data: analyticsVelocity = null } = useQuery<Record<string, unknown>>({
    queryKey: ["/api/sales/analytics/velocity"],
    enabled: activeTab === "analytics",
  });

  const { data: commissions = [], isLoading: commLoading } = useQuery<CommissionRecord[]>({
    queryKey: ["/api/sales/commission/calculations"],
    enabled: activeTab === "commission",
  });

  const { data: leaderboard = [], isLoading: leaderLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/sales/targets/leaderboard"],
    enabled: activeTab === "commission",
  });

  const generateForecast = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/sales/forecast/generate", {
        type: "monthly",
        period: new Date().toISOString().slice(0, 7),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales/forecast/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales/forecast/accuracy"] });
      toast({ title: "Prognoz yaratildi", description: "AI prognoz muvaffaqiyatli yaratildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const safeInvoices = Array.isArray(invoices) ? invoices : [];
  const totalRevenue = safeInvoices.reduce((s, inv) => s + Number(inv.totalAmount || 0), 0);
  const paidInvoices = safeInvoices.filter(inv => inv.status === "paid").length;
  const overdueInvoices = safeInvoices.filter(inv => inv.status === "overdue").length;

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <EPPageHeader
        breadcrumb={<>Dashboard · <b className="text-foreground">Savdo Boshqaruvi</b></>}
        title="Savdo Boshqaruvi"
        subtitle="Hisob-fakturalar · Prognoz · Analitika · Komissiya"
        actions={
          <div className="flex items-center gap-2">
            <Badge className="bg-muted/60 text-foreground rounded-full px-3 py-0.5 text-xs font-semibold border-none">
              {invoices.length} hisob-faktura
            </Badge>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetchInv()}
              data-testid="button-refresh"
              className="text-foreground border-none"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        }
        data-testid="text-sales-management-title"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/60 p-1 rounded-lg flex-wrap gap-1">
          <TabsTrigger value="invoices" data-testid="tab-invoices" className="data-[state=active]:bg-card data-[state=active]:text-primary rounded-md">
            <FileText className="w-4 h-4 mr-1.5" />Hisob-fakturalar
          </TabsTrigger>
          <TabsTrigger value="forecast" data-testid="tab-forecast" className="data-[state=active]:bg-card data-[state=active]:text-primary rounded-md">
            <TrendingUp className="w-4 h-4 mr-1.5" />AI Prognoz
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics" className="data-[state=active]:bg-card data-[state=active]:text-primary rounded-md">
            <BarChart2 className="w-4 h-4 mr-1.5" />Analitika
          </TabsTrigger>
          <TabsTrigger value="commission" data-testid="tab-commission" className="data-[state=active]:bg-card data-[state=active]:text-primary rounded-md">
            <Award className="w-4 h-4 mr-1.5" />Komissiya
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          <InvoicesSection
            invoices={safeInvoices}
            isLoading={invLoading}
            totalRevenue={totalRevenue}
            paidInvoices={paidInvoices}
            overdueInvoices={overdueInvoices}
          />
        </TabsContent>

        <TabsContent value="forecast" className="space-y-4">
          <ForecastSection
            forecastHistory={forecastHistory}
            forecastAccuracy={forecastAccuracy}
            isLoading={fcastLoading}
            isPending={generateForecast.isPending}
            onGenerate={() => generateForecast.mutate()}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsSection
            analyticsMonthly={analyticsMonthly}
            analyticsVelocity={analyticsVelocity}
            isLoading={analyticsLoading}
          />
        </TabsContent>

        <TabsContent value="commission" className="space-y-4">
          <CommissionSection
            commissions={commissions}
            leaderboard={leaderboard}
            commLoading={commLoading}
            leaderLoading={leaderLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
