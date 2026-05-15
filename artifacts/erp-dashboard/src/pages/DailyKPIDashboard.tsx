/**
 * @module DailyKPIDashboard
 * @description React page component. Route-level UI.
 */

import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Banknote, Receipt, RefreshCw, FileText, Calculator, PlusCircle, BarChart3 } from "lucide-react";
import type { DailyMetrics, AiFinanceInsight } from "./daily-kpi/types";
import { formatShortCurrency, getWeeklyDateRange } from "./daily-kpi/types";
import { WeeklyTrendChart } from "./daily-kpi/WeeklyTrendChart";
import { AIInsightsSection } from "./daily-kpi/AIInsightsSection";
import { EPErrorState } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

export default function DailyKPIDashboard() {
  const { t } = useTranslation("common");
  const { dateFrom, dateTo } = getWeeklyDateRange();

  const { data: todayMetrics, isLoading: todayLoading, refetch: refetchToday, isError, error } = useQuery<DailyMetrics>({ queryKey: ["/api/finance-extended/daily-metrics/today"] });
  const { data: weeklyMetrics = [], isLoading: weeklyLoading } = useQuery<DailyMetrics[]>({ queryKey: ["/api/finance-extended/daily-metrics", { dateFrom, dateTo }] });
  const { data: aiInsightsRaw, isLoading: insightsLoading } = useQuery<{ insights: AiFinanceInsight[]; generatedAt: string } | AiFinanceInsight[]>({ queryKey: ["/api/ai/finance/insights"] });
  const aiInsights: AiFinanceInsight[] = Array.isArray(aiInsightsRaw)
    ? aiInsightsRaw
    : (aiInsightsRaw as { insights?: AiFinanceInsight[] } | undefined)?.insights ?? [];

  const chartData = (Array.isArray(weeklyMetrics) ? weeklyMetrics : []).map((m) => ({
    date: new Date(m.metricDate).toLocaleDateString("uz-UZ", { weekday: "short", day: "numeric" }),
    daromad: m.dailyIncome || 0, xarajat: m.dailyExpense || 0, pulOqimi: m.dailyNetCash || 0,
  })).reverse() || [];

  const netCashPositive = (todayMetrics?.dailyNetCash || 0) >= 0;

  if (isError) return <EPErrorState onRetry={refetchToday}  error={error} />;

  const kpiCards: { title: string; value: number; icon: React.ElementType; gradient: string; trend?: number; fallback?: string; isNetCash?: boolean }[] = [
    { title: "Pul qoldig'i", value: todayMetrics?.cashBalance || 0, icon: Wallet, gradient: "from-[#3563AC] to-[#2a55a0]", trend: todayMetrics?.cashTrend, fallback: "Kassalar va bank hisoblarida" },
    { title: "Kunlik daromad", value: todayMetrics?.dailyIncome || 0, icon: TrendingUp, gradient: "from-[#2E8A5A] to-[#247049]", trend: todayMetrics?.incomeTrend, fallback: "Bugungi tushum" },
    { title: "Kunlik xarajat", value: todayMetrics?.dailyExpense || 0, icon: TrendingDown, gradient: "from-[#C0432F] to-[#a83826]", trend: undefined, fallback: "Bugungi chiqim" },
    { title: "Pul oqimi", value: todayMetrics?.dailyNetCash || 0, icon: Banknote, gradient: netCashPositive ? "from-primary to-amber-500" : "from-[#C0432F] to-[#a83826]", isNetCash: true },
  ];

  return (
    <div data-testid="daily-kpi-dashboard">
      <div className="-mx-4 -mt-4 lg:-mx-6 lg:-mt-6 border-b from-primary to-amber-500 text-white">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8" />
              <div><h1 className="text-2xl font-bold">{t("kunlikMoliyaKpi")}</h1><p className="text-white/75 text-sm">{t("kunlikMoliyaviyKorsatkichlarPaneli")}</p></div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="bg-white/10 border-white/30 text-white">{new Date().toLocaleDateString("uz-UZ", { weekday: "long", day: "numeric", month: "long" })}</Badge>
              <Button size="sm" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20" onClick={() => refetchToday()} data-testid="button-refresh-metrics"><RefreshCw className="h-4 w-4 mr-1" />{t("refresh")}</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 pt-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {(Array.isArray(kpiCards) ? kpiCards : []).map((card, i) => (
            <Card key={`k-${i}`} className={`${card.gradient} text-white border-0`} data-testid={`card-${["cash-balance","daily-income","daily-expense","net-cash-flow"][i]}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium opacity-90">{card.title}</CardTitle>
                <card.icon className="h-5 w-5 opacity-80" />
              </CardHeader>
              <CardContent>
                {todayLoading ? <Skeleton className="h-8 w-32 bg-card/20 rounded-lg" /> : (
                  <>
                    <div className="text-2xl font-bold">{card.isNetCash && netCashPositive ? "+" : ""}{formatShortCurrency(card.value)}</div>
                    <p className="text-xs opacity-75 mt-1">
                      {card.trend !== undefined && card.trend !== 0 ? (
                        <>{card.trend > 0 ? <ArrowUpRight className="inline h-3 w-3" /> : <ArrowDownRight className="inline h-3 w-3" />}{" "}{Math.abs(card.trend).toFixed(1)}% kechagi kundan</>
                      ) : card.isNetCash ? (
                        netCashPositive ? <><ArrowUpRight className="inline h-3 w-3" /> {t("ijobiyOqim")}</> : <><ArrowDownRight className="inline h-3 w-3" /> {t("salbiyOqim")}</>
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
            <CardHeader><CardTitle className="flex items-center gap-2"><PlusCircle className="h-4 w-4 text-primary" />{t("tezkorAmallar")}</CardTitle><CardDescription>{t("tezTezIshlatiladiganFunksiyalar")}</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {([
                { href: "/accounting/income-expense", icon: TrendingUp, label: "Yangi kirim qo'shish", variant: "default" as const, testId: "button-new-income" },
                { href: "/accounting/income-expense", icon: TrendingDown, label: "Yangi chiqim qo'shish", variant: "outline" as const, testId: "button-new-expense" },
                { href: "/accounting/cash-register", icon: Receipt, label: "Kassa operatsiyalari", variant: "outline" as const, testId: "button-cash-register" },
                { href: "/finance/reports", icon: FileText, label: "Moliya hisobotlari", variant: "outline" as const, testId: "button-finance-reports" },
                { href: "/accounting/payroll", icon: Calculator, label: "Oylik hisoblash", variant: "outline" as const, testId: "button-payroll" },
              ]).map((action) => (
                <Button key={action.testId} asChild variant={action.variant} className="w-full justify-start" data-testid={action.testId}>
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
              <Card data-testid="card-receivables"><CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2"><CardTitle className="text-sm font-medium">{t("debitorlikQarzi")}</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{formatShortCurrency(todayMetrics.totalReceivables)}</div>{todayMetrics.overdueReceivables !== undefined && todayMetrics.overdueReceivables > 0 && <p className="text-xs text-[var(--ep-red)] mt-1">Muddati o'tgan: {formatShortCurrency(todayMetrics.overdueReceivables)}</p>}</CardContent></Card>
            )}
            {todayMetrics.totalPayables !== undefined && (
              <Card data-testid="card-payables"><CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2"><CardTitle className="text-sm font-medium">{t("kreditorlikQarzi")}</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{formatShortCurrency(todayMetrics.totalPayables)}</div>{todayMetrics.overduePayables !== undefined && todayMetrics.overduePayables > 0 && <p className="text-xs text-[var(--ep-red)] mt-1">Muddati o'tgan: {formatShortCurrency(todayMetrics.overduePayables)}</p>}</CardContent></Card>
            )}
            {todayMetrics.newOrdersCount !== undefined && (
              <Card data-testid="card-new-orders"><CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2"><CardTitle className="text-sm font-medium">{t("bugungiBuyurtmalar")}</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{todayMetrics.newOrdersCount} ta</div>{todayMetrics.newOrdersValue !== undefined && <p className="text-xs text-muted-foreground mt-1">{formatShortCurrency(todayMetrics.newOrdersValue)} qiymatida</p>}</CardContent></Card>
            )}
            {todayMetrics.inventoryValue !== undefined && (
              <Card data-testid="card-inventory-value"><CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2"><CardTitle className="text-sm font-medium">{t("inventarQiymati")}</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{formatShortCurrency(todayMetrics.inventoryValue)}</div><p className="text-xs text-muted-foreground mt-1">{t("umumiyOmborQiymati")}</p></CardContent></Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
