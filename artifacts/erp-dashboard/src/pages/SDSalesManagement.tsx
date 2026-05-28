/**
 * @module SDSalesManagement
 * @description React page component. Route-level UI.
 * State management, hooks, and orchestration only — rendering delegated to sub-files.
 * API endpoints use /api/sd/* (backend confirmed under apps/api/src/modules/sd/).
 * Forecast/Analytics tabs use placeholders when endpoints not yet live.
 * Commission tab uses /api/sd/kpi/team.
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
import { tLabel } from "@/lib/i18n/tLabel";

import { URL_TAB_MAP, Invoice } from "./SDSalesManagementTypes";
import { InvoicesSection } from "./SDSalesManagementSectionsA";
import { EPPageHeader } from "@/components/ep";
import { useTranslation } from "@/lib/i18n";
import { Pagination } from "@/components/Pagination";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KpiTeamItem {
  managerId?: string;
  totalSales?: number | string;
  ordersCount?: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SDSalesManagement() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState(() => URL_TAB_MAP[location] || "invoices");

  // Pagination for invoices
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => {
    const tab = URL_TAB_MAP[location];
    if (tab) setActiveTab(tab);
  }, [location]);

  // ---------------------------------------------------------------------------
  // Invoices — use /api/sd/invoices
  // ---------------------------------------------------------------------------

  const { data: invoicesRaw, isLoading: invLoading, refetch: refetchInv } = useQuery({
    queryKey: ["/api/sd/invoices", page],
    queryFn: () => apiRequest("GET", `/api/sd/invoices?page=${page}&limit=${PAGE_SIZE}`),
  });

  const invoices: Invoice[] = (() => {
    if (!invoicesRaw) return [];
    if (Array.isArray(invoicesRaw)) return invoicesRaw as Invoice[];
    const d = invoicesRaw as { items?: Invoice[]; data?: Invoice[] };
    if (Array.isArray(d.items)) return d.items;
    if (Array.isArray(d.data)) return d.data;
    return [];
  })();

  const invoicesTotal: number = (() => {
    const d = invoicesRaw as { total?: number } | null;
    return d?.total ?? invoices.length;
  })();
  const totalPages = Math.ceil(invoicesTotal / PAGE_SIZE) || 1;

  const safeInvoices = Array.isArray(invoices) ? invoices : [];
  const totalRevenue = safeInvoices.reduce((s, inv) => s + Number(inv.totalAmount || 0), 0);
  const paidInvoices = safeInvoices.filter(inv => inv.status === "paid").length;
  const overdueInvoices = safeInvoices.filter(inv => inv.status === "overdue").length;

  // ---------------------------------------------------------------------------
  // Commission — use /api/sd/kpi/team
  // ---------------------------------------------------------------------------

  const { data: kpiTeamRaw, isLoading: commLoading } = useQuery({
    queryKey: ["/api/sd/kpi/team"],
    queryFn: () => apiRequest("GET", `/api/sd/kpi/team?year=${new Date().getFullYear()}&month=${new Date().getMonth() + 1}`),
    enabled: activeTab === "commission",
  });

  const kpiTeam: KpiTeamItem[] = (() => {
    if (!kpiTeamRaw) return [];
    if (Array.isArray(kpiTeamRaw)) return kpiTeamRaw as KpiTeamItem[];
    const d = kpiTeamRaw as { items?: KpiTeamItem[] };
    return Array.isArray(d.items) ? d.items : [];
  })();

  // ---------------------------------------------------------------------------
  // Forecast generate mutation
  // ---------------------------------------------------------------------------

  const generateForecast = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/sd/forecast/generate", {
        type: "monthly",
        period: new Date().toISOString().slice(0, 7),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sd/forecast"] });
      toast({
        title: tLabel("sd.forecast.created", "Prognoz yaratildi"),
        description: tLabel("sd.forecast.createdDesc", "AI prognoz muvaffaqiyatli yaratildi"),
      });
    },
    onError: () => toast({ title: tLabel("sd.error", "Xatolik"), variant: "destructive" }),
  });

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("savdoBoshqaruvi")}</b></>}
        title={t("savdoBoshqaruvi")}
        subtitle={t("hisobFakturalarPrognozAnalitikaKomissiya")}
        actions={
          <div className="flex items-center gap-2">
            <Badge className="bg-muted/60 text-foreground rounded-full px-3 py-0.5 text-xs font-semibold border-none">
              {invoicesTotal} {tLabel("sd.invoices.label", "hisob-faktura")}
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
            <FileText className="w-4 h-4 mr-1.5" />{t("hisobFakturalar")}
          </TabsTrigger>
          <TabsTrigger value="forecast" data-testid="tab-forecast" className="data-[state=active]:bg-card data-[state=active]:text-primary rounded-md">
            <TrendingUp className="w-4 h-4 mr-1.5" />{t("aiPrognoz")}
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics" className="data-[state=active]:bg-card data-[state=active]:text-primary rounded-md">
            <BarChart2 className="w-4 h-4 mr-1.5" />{t("analitika")}
          </TabsTrigger>
          <TabsTrigger value="commission" data-testid="tab-commission" className="data-[state=active]:bg-card data-[state=active]:text-primary rounded-md">
            <Award className="w-4 h-4 mr-1.5" />{t("komissiya")}
          </TabsTrigger>
        </TabsList>

        {/* ── Invoices ───────────────────────────────────────────────── */}
        <TabsContent value="invoices" className="space-y-4">
          <InvoicesSection
            invoices={safeInvoices}
            isLoading={invLoading}
            totalRevenue={totalRevenue}
            paidInvoices={paidInvoices}
            overdueInvoices={overdueInvoices}
          />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            pageSize={PAGE_SIZE}
            totalItems={invoicesTotal}
            onPageChange={(p) => setPage(p)}
          />
        </TabsContent>

        {/* ── Forecast — placeholder ─────────────────────────────────── */}
        <TabsContent value="forecast" className="space-y-4">
          <div className="bg-card rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t("aiSavdoPrognozi")}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {tLabel("sd.forecast.comingSoon", "Prognoz moduli tayyorlanmoqda")}
                </p>
              </div>
              <Button
                onClick={() => generateForecast.mutate()}
                disabled={generateForecast.isPending}
                data-testid="button-generate-forecast"
                className="bg-primary text-white rounded-lg px-5 font-semibold shadow-none"
              >
                {generateForecast.isPending
                  ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  : <TrendingUp className="w-4 h-4 mr-2" />}
                {tLabel("sd.forecast.generate", "Prognoz Yaratish")}
              </Button>
            </div>
            <div className="flex items-center justify-center h-48 text-muted-foreground border border-dashed border-border rounded-xl">
              <div className="text-center">
                <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="font-medium">{tLabel("sd.forecast.comingSoon", "Prognoz moduli tayyorlanmoqda")}</p>
                <p className="text-sm mt-1 opacity-70">{tLabel("sd.forecast.soonDesc", "Tez orada AI asosida prognoz qo'shiladi")}</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Analytics — placeholder ────────────────────────────────── */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="flex items-center justify-center h-64 text-muted-foreground bg-card rounded-xl border border-dashed border-border">
            <div className="text-center">
              <BarChart2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="font-medium">{tLabel("sd.analytics.comingSoon", "Analitika moduli tayyorlanmoqda")}</p>
              <p className="text-sm mt-1 opacity-70">
                {tLabel("sd.analytics.soonDesc", "Savdo ma'lumotlari to'planganda analitika ko'rinadi")}
              </p>
            </div>
          </div>
        </TabsContent>

        {/* ── Commission — KPI team data ─────────────────────────────── */}
        <TabsContent value="commission" className="space-y-4">
          <div className="bg-card rounded-xl p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">{t("savdochilarKomissiyasi")}</h2>
            {commLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={`sk-${i}`} className="h-10 bg-muted/60 rounded animate-pulse" />
                ))}
              </div>
            ) : kpiTeam.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground border border-dashed border-border rounded-xl">
                <div className="text-center">
                  <Award className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="font-medium">{tLabel("sd.commission.noData", "KPI ma'lumotlari mavjud emas")}</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/60">
                      <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2 px-4">
                        {tLabel("sd.col.managerId", "Menejer ID")}
                      </th>
                      <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2 px-4">
                        {tLabel("sd.col.totalSales", "Jami savdo")}
                      </th>
                      <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2 px-4">
                        {tLabel("sd.col.ordersCount", "Buyurtmalar soni")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(kpiTeam) ? kpiTeam : []).map((row, i) => (
                      <tr key={row.managerId ?? i} className="hover:bg-muted/40 border-t border-border/40" data-testid={`row-kpi-team-${i}`}>
                        <td className="py-2 px-4 font-medium text-foreground">{row.managerId || "—"}</td>
                        <td className="py-2 px-4 font-mono text-foreground">
                          {Number(row.totalSales || 0).toLocaleString()} so'm
                        </td>
                        <td className="py-2 px-4 text-foreground">{row.ordersCount ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
