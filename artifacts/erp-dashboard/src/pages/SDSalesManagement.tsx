import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/ui/page-header";
import {
  FileText, TrendingUp, BarChart2, Award,
  RefreshCw, CheckCircle, Clock, AlertTriangle, DollarSign, Target, Trophy,
} from "lucide-react";

const URL_TAB_MAP: Record<string, string> = {
  "/sd/invoices": "invoices",
  "/sd/forecast": "forecast",
  "/sd/analytics": "analytics",
  "/sd/commission": "commission",
  "/sd/sales-management": "invoices",
};

interface Invoice {
  id: string;
  invoiceNumber?: string;
  customerId?: string;
  customerName?: string;
  orderId?: string;
  issueDate?: string;
  dueDate?: string;
  totalAmount?: number | string;
  paidAmount?: number | string;
  status?: string;
  currency?: string;
}

interface ForecastHistory {
  id: string;
  period?: string;
  forecastType?: string;
  forecastedRevenue?: number | string;
  forecastedUnits?: number | string;
  actualRevenue?: number | string;
  accuracy?: number | string;
  generatedAt?: string;
}

interface AnalyticsMonthly {
  month?: string;
  year?: number;
  totalRevenue?: number | string;
  totalOrders?: number;
  avgOrderValue?: number | string;
  newCustomers?: number;
}

interface CommissionRecord {
  id: string;
  salesPersonId?: string;
  salesPersonName?: string;
  period?: string;
  totalSales?: number | string;
  commissionRate?: number | string;
  commissionAmount?: number | string;
  status?: string;
  approvedAt?: string;
}

interface LeaderboardEntry {
  rank?: number;
  salesPersonId?: string;
  salesPersonName?: string;
  totalSales?: number | string;
  target?: number | string;
  achievementPct?: number | string;
  commissionEarned?: number | string;
}

const statusVariant: Record<string, string> = {
  draft: "bg-surface-container text-on-surface",
  sent: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  partial: "bg-amber-100 text-amber-800",
  cancelled: "bg-surface-container text-on-surface-variant",
  approved: "bg-green-100 text-green-800",
  pending: "bg-amber-100 text-amber-800",
};

const statusLabel: Record<string, string> = {
  draft: "Qoralama",
  sent: "Yuborilgan",
  paid: "To'langan",
  overdue: "Muddati o'tgan",
  partial: "Qisman",
  cancelled: "Bekor",
  approved: "Tasdiqlangan",
  pending: "Kutilmoqda",
};

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
    mutationFn: () => apiRequest("POST", "/api/sales/forecast/generate", { type: "monthly", period: new Date().toISOString().slice(0, 7) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales/forecast/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales/forecast/accuracy"] });
      toast({ title: "Prognoz yaratildi", description: "AI prognoz muvaffaqiyatli yaratildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const totalRevenue = (Array.isArray(invoices) ? invoices : []).reduce((s, inv) => s + Number(inv.totalAmount || 0), 0);
  const paidInvoices = (Array.isArray(invoices) ? invoices : []).filter(inv => inv.status === "paid").length;
  const overdueInvoices = (Array.isArray(invoices) ? invoices : []).filter(inv => inv.status === "overdue").length;

  return (
    <div className="space-y-6">
      <PageHeader
        label="Europrint ERP · SD"
        title="Savdo"
        boldWord="Boshqaruvi"
        subtitle="Hisob-fakturalar · Prognoz · Analitika · Komissiya"
        data-testid="text-sales-management-title"
        actions={
          <div className="flex items-center gap-2">
            <Badge className="bg-surface-container text-on-surface rounded-full px-3 py-0.5 text-xs font-semibold border-none">
              {invoices.length} hisob-faktura
            </Badge>
            <Button variant="outline" size="icon" onClick={() => refetchInv()} data-testid="button-refresh" className="text-on-surface border-none">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-surface-container p-1 rounded-lg flex-wrap gap-1">
          <TabsTrigger value="invoices" data-testid="tab-invoices" className="data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary rounded-md">
            <FileText className="w-4 h-4 mr-1.5" />Hisob-fakturalar
          </TabsTrigger>
          <TabsTrigger value="forecast" data-testid="tab-forecast" className="data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary rounded-md">
            <TrendingUp className="w-4 h-4 mr-1.5" />AI Prognoz
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics" className="data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary rounded-md">
            <BarChart2 className="w-4 h-4 mr-1.5" />Analitika
          </TabsTrigger>
          <TabsTrigger value="commission" data-testid="tab-commission" className="data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary rounded-md">
            <Award className="w-4 h-4 mr-1.5" />Komissiya
          </TabsTrigger>
        </TabsList>

        {/* HISOB-FAKTURALAR */}
        <TabsContent value="invoices" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {([
              { label: "Jami hisob-faktura", value: invoices.length, icon: FileText, color: "text-primary" },
              { label: "To'liq to'langan", value: paidInvoices, icon: CheckCircle, color: "text-green-600" },
              { label: "Muddati o'tgan", value: overdueInvoices, icon: AlertTriangle, color: overdueInvoices > 0 ? "text-red-500" : "text-on-surface-variant" },
              { label: "Jami summa", value: `${(totalRevenue / 1_000_000).toFixed(1)}M`, icon: DollarSign, color: "text-on-surface" },
            ]).map((s, i) => (
              <div key={`k-${i}`} className="bg-surface-container-lowest rounded-lg p-5" data-testid={`invoice-kpi-${i}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{s.label}</p>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="text-3xl font-bold tracking-tight text-on-surface">{s.value}</p>
              </div>
            ))}
          </div>
          <Card className="bg-surface-container-lowest border-none rounded-xl">
            <CardContent className="p-0">
              {invLoading ? (
                <div className="p-4 space-y-2">{([...Array(5)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-10 w-full" />)}</div>
              ) : invoices.length === 0 ? (
                <div className="p-8 text-center text-on-surface-variant">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">Hisob-fakturalar mavjud emas</p>
                  <p className="text-sm mt-1 opacity-70">Buyurtmalar yetkazilganda avtomatik yaratiladi</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-surface-container hover:bg-surface-container border-none">
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Faktura №</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Mijoz</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Sana</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Muddat</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Summa</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">To'langan</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Holat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(invoices) ? invoices : []).map(inv => (
                      <TableRow key={inv.id} data-testid={`row-invoice-${inv.id}`} className="hover:bg-surface-container-low transition-colors border-none">
                        <TableCell className="py-3 px-6 font-mono font-medium text-on-surface">{inv.invoiceNumber || `INV-${inv.id.slice(-4)}`}</TableCell>
                        <TableCell className="py-3 px-6 text-on-surface">{inv.customerName || "—"}</TableCell>
                        <TableCell className="py-3 px-6 text-sm text-on-surface">{inv.issueDate ? new Date(inv.issueDate).toLocaleDateString("uz-UZ") : "—"}</TableCell>
                        <TableCell className="py-3 px-6 text-sm text-on-surface">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("uz-UZ") : "—"}</TableCell>
                        <TableCell className="py-3 px-6 font-mono text-on-surface">{inv.totalAmount ? `${Number(inv.totalAmount).toLocaleString()} so'm` : "—"}</TableCell>
                        <TableCell className="py-3 px-6 font-mono text-on-surface">{inv.paidAmount ? `${Number(inv.paidAmount).toLocaleString()} so'm` : "0"}</TableCell>
                        <TableCell className="py-3 px-6">
                          <Badge className={`${statusVariant[inv.status || ""] || "bg-surface-container text-on-surface"} rounded-full px-2.5 py-0.5 text-xs font-semibold border-none`}>
                            {statusLabel[inv.status || ""] || inv.status || "—"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI PROGNOZ */}
        <TabsContent value="forecast" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-xl font-bold text-on-surface">AI Savdo Prognozi</h2>
              <p className="text-sm text-on-surface-variant mt-0.5">Mashinali o'rganish asosida kelajakdagi savdo prognozi</p>
            </div>
            <Button
              onClick={() => generateForecast.mutate()}
              disabled={generateForecast.isPending}
              data-testid="button-generate-forecast"
              className="bg-gradient-to-br from-primary to-primary-dim text-white rounded-lg px-5 font-semibold shadow-none"
            >
              {generateForecast.isPending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <TrendingUp className="w-4 h-4 mr-2" />}
              Prognoz Yaratish
            </Button>
          </div>
          {forecastAccuracy && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-lowest rounded-lg p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Model Aniqligi</p>
                <p className="text-4xl font-bold text-primary">{forecastAccuracy.accuracy?.toFixed(1) || "—"}%</p>
              </div>
              <div className="bg-surface-container-lowest rounded-lg p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Jami Prognozlar</p>
                <p className="text-4xl font-bold text-on-surface">{forecastAccuracy.totalForecasts || 0}</p>
              </div>
            </div>
          )}
          <Card className="bg-surface-container-lowest border-none rounded-xl">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Prognoz Tarixi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {fcastLoading ? (
                <div className="p-4 space-y-2">{([...Array(4)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-10 w-full" />)}</div>
              ) : forecastHistory.length === 0 ? (
                <div className="p-8 text-center text-on-surface-variant">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">Prognoz tarixi yo'q</p>
                  <p className="text-sm mt-1 opacity-70">Yuqoridagi tugmani bosib AI prognoz yarating</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-surface-container hover:bg-surface-container border-none">
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Davr</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Tur</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Prognoz daromad</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Prognoz birliklar</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Aniqlik</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(forecastHistory) ? forecastHistory : []).map(f => (
                      <TableRow key={f.id} data-testid={`row-forecast-${f.id}`} className="hover:bg-surface-container-low transition-colors border-none">
                        <TableCell className="py-3 px-6 font-medium text-on-surface">{f.period || "—"}</TableCell>
                        <TableCell className="py-3 px-6">
                          <Badge className="bg-primary-container text-on-primary-container rounded-full px-2.5 py-0.5 text-xs font-semibold border-none">
                            {f.forecastType || "monthly"}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 px-6 font-mono text-on-surface">{f.forecastedRevenue ? `${Number(f.forecastedRevenue).toLocaleString()} so'm` : "—"}</TableCell>
                        <TableCell className="py-3 px-6 text-on-surface">{f.forecastedUnits || "—"}</TableCell>
                        <TableCell className="py-3 px-6">
                          {f.accuracy != null ? (
                            <span className={`font-bold text-sm ${Number(f.accuracy) >= 80 ? "text-green-600" : Number(f.accuracy) >= 60 ? "text-amber-600" : "text-red-500"}`}>
                              {Number(f.accuracy).toFixed(1)}%
                            </span>
                          ) : <span className="text-on-surface-variant">—</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ANALITIKA */}
        <TabsContent value="analytics" className="space-y-4">
          <h2 className="text-xl font-bold text-on-surface">Savdo Analitikasi</h2>
          {analyticsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {([1, 2, 3, 4]).map(i => <Skeleton key={`k-${i}`} className="h-24 w-full rounded-lg" />)}
            </div>
          ) : analyticsMonthly.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-xl p-8 text-center text-on-surface-variant">
              <BarChart2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium">Analitika ma'lumotlari yo'q</p>
              <p className="text-sm mt-1 opacity-70">Savdo ma'lumotlari to'planayotganda analitika ko'rinadi</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {([
                  { label: "Jami daromad", value: (Array.isArray(analyticsMonthly) ? analyticsMonthly : []).reduce((s, m) => s + Number(m.totalRevenue || 0), 0), fmt: (v: number) => `${(v / 1_000_000).toFixed(1)}M`, color: "text-primary" },
                  { label: "Jami buyurtmalar", value: (Array.isArray(analyticsMonthly) ? analyticsMonthly : []).reduce((s, m) => s + (m.totalOrders || 0), 0), fmt: (v: number) => v.toString(), color: "text-blue-600" },
                  { label: "O'rtacha buyurtma", value: analyticsMonthly.length > 0 ? (Array.isArray(analyticsMonthly) ? analyticsMonthly : []).reduce((s, m) => s + Number(m.avgOrderValue || 0), 0) / analyticsMonthly.length : 0, fmt: (v: number) => `${(v / 1_000_000).toFixed(2)}M`, color: "text-green-600" },
                  { label: "Yangi mijozlar", value: (Array.isArray(analyticsMonthly) ? analyticsMonthly : []).reduce((s, m) => s + (m.newCustomers || 0), 0), fmt: (v: number) => v.toString(), color: "text-amber-600" },
                ]).map((s, i) => (
                  <div key={`k-${i}`} className="bg-surface-container-lowest rounded-lg p-5" data-testid={`analytics-kpi-${i}`}>
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">{s.label}</p>
                    <p className={`text-3xl font-bold tracking-tight ${s.color}`}>{s.fmt(s.value)}</p>
                  </div>
                ))}
              </div>
              <Card className="bg-surface-container-lowest border-none rounded-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant">Oylik Trend</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-surface-container hover:bg-surface-container border-none">
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Oy</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Daromad</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Buyurtmalar</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">O'rtacha buyurtma</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Yangi mijozlar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(Array.isArray(analyticsMonthly) ? analyticsMonthly : []).map((m, idx) => (
                        <TableRow key={idx} data-testid={`row-analytics-${idx}`} className="hover:bg-surface-container-low transition-colors border-none">
                          <TableCell className="py-3 px-6 font-medium text-on-surface">{m.month}/{m.year}</TableCell>
                          <TableCell className="py-3 px-6 font-mono text-on-surface">{m.totalRevenue ? `${Number(m.totalRevenue).toLocaleString()} so'm` : "—"}</TableCell>
                          <TableCell className="py-3 px-6 text-on-surface">{m.totalOrders || 0}</TableCell>
                          <TableCell className="py-3 px-6 font-mono text-on-surface">{m.avgOrderValue ? `${Number(m.avgOrderValue).toLocaleString()} so'm` : "—"}</TableCell>
                          <TableCell className="py-3 px-6 text-on-surface">{m.newCustomers || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              {analyticsVelocity && (
                <Card className="bg-surface-container-lowest border-none rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant">Savdo Tezligi</CardTitle>
                    <CardDescription className="text-on-surface-variant">Pipeline va konversiya metrikalari</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(analyticsVelocity ?? {}).filter((_, i) => i < 4).map(([key, val]) => (
                        <div key={key} className="bg-surface-container rounded-lg p-4">
                          <p className="text-xs text-on-surface-variant capitalize">{key.replace(/_/g, " ")}</p>
                          <p className="text-2xl font-bold text-on-surface">{String(val ?? "—")}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* KOMISSIYA */}
        <TabsContent value="commission" className="space-y-4">
          <h2 className="text-xl font-bold text-on-surface">Savdochilar Komissiyasi</h2>
          {leaderLoading ? (
            <div className="space-y-3">{([1, 2, 3]).map(i => <Skeleton key={`k-${i}`} className="h-20 w-full rounded-lg" />)}</div>
          ) : leaderboard.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-xl p-6 text-center text-on-surface-variant">
              <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium">Leaderboard ma'lumotlari mavjud emas</p>
              <p className="text-sm mt-1 opacity-70">Savdochilar rejalari qo'shilganda reyting shakllanadi</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(Array.isArray(leaderboard) ? leaderboard : []).slice(0, 3).map((l, i) => (
                <div key={`k-${i}`} className={`bg-surface-container-lowest rounded-xl p-6 text-center border ${i === 0 ? "border-yellow-400" : i === 1 ? "border-outline-variant" : "border-amber-500"}`} data-testid={`leader-card-${i}`}>
                  <div className={`text-3xl font-bold mb-2 ${i === 0 ? "text-yellow-600" : i === 1 ? "text-on-surface-variant" : "text-amber-600"}`}>#{l.rank || i + 1}</div>
                  <div className="font-bold text-lg text-on-surface">{l.salesPersonName || "—"}</div>
                  <div className="text-3xl font-bold text-primary mt-2">{l.totalSales ? `${(Number(l.totalSales) / 1_000_000).toFixed(1)}M` : "—"}</div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mt-1">so'm</div>
                  {l.achievementPct != null && (
                    <Badge className="mt-3 bg-surface-container text-on-surface border-none shadow-none rounded-full px-3">
                      {Number(l.achievementPct).toFixed(0)}% reja
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
          <Card className="bg-surface-container-lowest border-none rounded-xl">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Komissiya Hisob-Kitobi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {commLoading ? (
                <div className="p-4 space-y-2">{([...Array(4)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-10 w-full" />)}</div>
              ) : commissions.length === 0 ? (
                <div className="p-8 text-center text-on-surface-variant">
                  <Award className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">Komissiya hisoblari mavjud emas</p>
                  <p className="text-sm mt-1 opacity-70">Savdochilar rejalari va natijalar kiritilganda hisob-kitob avtomatik bajariladi</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-surface-container hover:bg-surface-container border-none">
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Savdochi</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Davr</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Jami savdo</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Stavka</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Komissiya</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Holat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(commissions) ? commissions : []).map(c => (
                      <TableRow key={c.id} data-testid={`row-commission-${c.id}`} className="hover:bg-surface-container-low transition-colors border-none">
                        <TableCell className="py-3 px-6 font-medium text-on-surface">{c.salesPersonName || "—"}</TableCell>
                        <TableCell className="py-3 px-6 text-on-surface">{c.period || "—"}</TableCell>
                        <TableCell className="py-3 px-6 font-mono text-on-surface">{c.totalSales ? `${Number(c.totalSales).toLocaleString()} so'm` : "—"}</TableCell>
                        <TableCell className="py-3 px-6 text-on-surface">{c.commissionRate ? `${c.commissionRate}%` : "—"}</TableCell>
                        <TableCell className="py-3 px-6 font-mono font-bold text-primary">{c.commissionAmount ? `${Number(c.commissionAmount).toLocaleString()} so'm` : "—"}</TableCell>
                        <TableCell className="py-3 px-6">
                          <Badge className={`${statusVariant[c.status || ""] || "bg-surface-container text-on-surface"} rounded-full px-2.5 py-0.5 text-xs font-semibold border-none`}>
                            {statusLabel[c.status || ""] || c.status || "—"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
