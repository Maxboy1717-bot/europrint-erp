import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Banknote, Receipt, RefreshCw, FileText, Calculator, PlusCircle, BarChart3 } from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";
import type { DailyMetrics, AiFinanceInsight } from "./daily-kpi/types";
import { formatShortCurrency, getWeeklyDateRange } from "./daily-kpi/types";
import { WeeklyTrendChart } from "./daily-kpi/WeeklyTrendChart";
import { AIInsightsSection } from "./daily-kpi/AIInsightsSection";

export default function DailyKPIDashboard() {
  const { dateFrom, dateTo } = getWeeklyDateRange();

  const { data: todayMetrics, isLoading: todayLoading, refetch: refetchToday, isError } = useQuery<DailyMetrics>({ queryKey: ["/api/finance-extended/daily-metrics/today"] });
  const { data: weeklyMetrics = [], isLoading: weeklyLoading } = useQuery<DailyMetrics[]>({ queryKey: ["/api/finance-extended/daily-metrics", { dateFrom, dateTo }] });
  const { data: aiInsights, isLoading: insightsLoading } = useQuery<AiFinanceInsight[]>({ queryKey: ["/api/finance-extended/ai-finance-insights"] });

  const chartData = weeklyMetrics?.map((m) => ({
    date: new Date(m.metricDate).toLocaleDateString("uz-UZ", { weekday: "short", day: "numeric" }),
    daromad: m.dailyIncome || 0, xarajat: m.dailyExpense || 0, pulOqimi: m.dailyNetCash || 0,
  })).reverse() || [];

  const netCashPositive = (todayMetrics?.dailyNetCash || 0) >= 0;

  if (isError) return <ErrorState onRetry={refetchToday} />;

  const kpiCards: { title: string; value: number; icon: React.ElementType; gradient: string; trend?: number; fallback?: string; isNetCash?: boolean }[] = [
    { title: "Pul qoldig'i", value: todayMetrics?.cashBalance || 0, icon: Wallet, gradient: "from-blue-600 to-blue-700", trend: todayMetrics?.cashTrend, fallback: "Kassalar va bank hisoblarida" },
    { title: "Kunlik daromad", value: todayMetrics?.dailyIncome || 0, icon: TrendingUp, gradient: "from-green-600 to-green-700", trend: todayMetrics?.incomeTrend, fallback: "Bugungi tushum" },
    { title: "Kunlik xarajat", value: todayMetrics?.dailyExpense || 0, icon: TrendingDown, gradient: "from-red-500 to-red-600", trend: undefined, fallback: "Bugungi chiqim" },
    { title: "Pul oqimi", value: todayMetrics?.dailyNetCash || 0, icon: Banknote, gradient: netCashPositive ? "from-violet-600 to-violet-700" : "from-orange-500 to-orange-600", isNetCash: true },
  ];

  return (
    <div className="min-h-screen bg-background" data-testid="daily-kpi-dashboard">
      <div className="border-b bg-gradient-to-r from-violet-600 to-purple-500 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8" />
              <div><h1 className="text-2xl font-bold">Kunlik Moliya KPI</h1><p className="text-violet-100 text-sm">Kunlik moliyaviy ko'rsatkichlar paneli</p></div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="bg-surface-container-lowest/10 border-white/30 text-white">{new Date().toLocaleDateString("uz-UZ", { weekday: "long", day: "numeric", month: "long" })}</Badge>
              <Button size="sm" variant="outline" className="bg-surface-container-lowest/10 border-white/30 text-white hover:bg-surface-container-lowest/20" onClick={() => refetchToday()} data-testid="button-refresh-metrics"><RefreshCw className="h-4 w-4 mr-1" />Yangilash</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {(Array.isArray(kpiCards) ? kpiCards : []).map((card, i) => (
            <Card key={`k-${i}`} className={`bg-gradient-to-br ${card.gradient} text-white border-0`} data-testid={`card-${["cash-balance","daily-income","daily-expense","net-cash-flow"][i]}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium opacity-90">{card.title}</CardTitle>
                <card.icon className="h-5 w-5 opacity-80" />
              </CardHeader>
              <CardContent>
                {todayLoading ? <Skeleton className="h-8 w-32 bg-surface-container-lowest/20" /> : (
                  <>
                    <div className="text-2xl font-bold">{card.isNetCash && netCashPositive ? "+" : ""}{formatShortCurrency(card.value)}</div>
                    <p className="text-xs opacity-75 mt-1">
                      {card.trend !== undefined && card.trend !== 0 ? (
                        <>{card.trend > 0 ? <ArrowUpRight className="inline h-3 w-3" /> : <ArrowDownRight className="inline h-3 w-3" />}{" "}{Math.abs(card.trend).toFixed(1)}% kechagi kundan</>
                      ) : card.isNetCash ? (
                        netCashPositive ? <><ArrowUpRight className="inline h-3 w-3" /> Ijobiy oqim</> : <><ArrowDownRight className="inline h-3 w-3" /> Salbiy oqim</>
                      ) : (
                        <>{i === 2 && <ArrowDownRight className="inline h-3 w-3" />} {card.fallback}</>
                      )}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <WeeklyTrendChart chartData={chartData} isLoading={weeklyLoading} />
          <Card data-testid="card-quick-actions">
            <CardHeader><CardTitle className="flex items-center gap-2"><PlusCircle className="h-5 w-5 text-violet-500" />Tezkor amallar</CardTitle><CardDescription>Tez-tez ishlatiladigan funksiyalar</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {([
                { href: "/accounting/income-expense", icon: TrendingUp, label: "Yangi kirim qo'shish", variant: "default" as const, testId: "button-new-income" },
                { href: "/accounting/income-expense", icon: TrendingDown, label: "Yangi chiqim qo'shish", variant: "outline" as const, testId: "button-new-expense" },
                { href: "/accounting/cash-register", icon: Receipt, label: "Kassa operatsiyalari", variant: "outline" as const, testId: "button-cash-register" },
                { href: "/finance/reports", icon: FileText, label: "Moliya hisobotlari", variant: "outline" as const, testId: "button-finance-reports" },
                { href: "/accounting/payroll", icon: Calculator, label: "Oylik hisoblash", variant: "outline" as const, testId: "button-payroll" },
              ]).map((action) => (
                <Button key={action.testId} asChild variant={action.variant} className={`w-full justify-start ${action.variant === "default" ? "bg-violet-600 hover:bg-violet-700" : ""}`} data-testid={action.testId}>
                  <Link href={action.href}><action.icon className="h-4 w-4 mr-2" />{action.label}</Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        <AIInsightsSection insights={aiInsights} isLoading={insightsLoading} />

        {todayMetrics && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {todayMetrics.totalReceivables !== undefined && (
              <Card data-testid="card-receivables"><CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2"><CardTitle className="text-sm font-medium">Debitorlik qarzi</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{formatShortCurrency(todayMetrics.totalReceivables)}</div>{todayMetrics.overdueReceivables !== undefined && todayMetrics.overdueReceivables > 0 && <p className="text-xs text-red-500 mt-1">Muddati o'tgan: {formatShortCurrency(todayMetrics.overdueReceivables)}</p>}</CardContent></Card>
            )}
            {todayMetrics.totalPayables !== undefined && (
              <Card data-testid="card-payables"><CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2"><CardTitle className="text-sm font-medium">Kreditorlik qarzi</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{formatShortCurrency(todayMetrics.totalPayables)}</div>{todayMetrics.overduePayables !== undefined && todayMetrics.overduePayables > 0 && <p className="text-xs text-red-500 mt-1">Muddati o'tgan: {formatShortCurrency(todayMetrics.overduePayables)}</p>}</CardContent></Card>
            )}
            {todayMetrics.newOrdersCount !== undefined && (
              <Card data-testid="card-new-orders"><CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2"><CardTitle className="text-sm font-medium">Bugungi buyurtmalar</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{todayMetrics.newOrdersCount} ta</div>{todayMetrics.newOrdersValue !== undefined && <p className="text-xs text-muted-foreground mt-1">{formatShortCurrency(todayMetrics.newOrdersValue)} qiymatida</p>}</CardContent></Card>
            )}
            {todayMetrics.inventoryValue !== undefined && (
              <Card data-testid="card-inventory-value"><CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2"><CardTitle className="text-sm font-medium">Inventar qiymati</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{formatShortCurrency(todayMetrics.inventoryValue)}</div><p className="text-xs text-muted-foreground mt-1">Umumiy ombor qiymati</p></CardContent></Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
