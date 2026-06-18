/**
 * @module DailyKPIDashboard
 * @description React page component. Route-level UI.
 */

import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, TrendingDown, Banknote, Receipt, RefreshCw, FileText, Calculator, PlusCircle, BarChart3, FileDown, type LucideIcon } from "lucide-react";
import type { DailyMetrics, AiFinanceInsight } from "./daily-kpi/types";
import { formatShortCurrency, getWeeklyDateRange } from "./daily-kpi/types";
import { WeeklyTrendChart } from "./daily-kpi/WeeklyTrendChart";
import { AIInsightsSection } from "./daily-kpi/AIInsightsSection";
import { EPErrorState, EPPageHeader, EPKpiCard, EPSkeletonKpiRow } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

function toCsv(rows: string[][]): string {
  return "﻿" + rows.map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

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

  const handleExportCsv = () => {
    const m = todayMetrics;
    if (!m) return;
    const rows: string[][] = [
      ["Ko'rsatkich", "Qiymat"],
      ["Sana", m.metricDate ?? new Date().toISOString().split("T")[0]],
      ["Pul qoldig'i", String(m.cashBalance ?? 0)],
      ["Kunlik daromad", String(m.dailyIncome ?? 0)],
      ["Kunlik xarajat", String(m.dailyExpense ?? 0)],
      ["Pul oqimi", String(m.dailyNetCash ?? 0)],
      ["Debitorlik qarzi", String(m.totalReceivables ?? 0)],
      ["Kreditorlik qarzi", String(m.totalPayables ?? 0)],
      ["Bugungi buyurtmalar", String(m.newOrdersCount ?? 0)],
      ["Buyurtmalar qiymati", String(m.newOrdersValue ?? 0)],
      ["Inventar qiymati", String(m.inventoryValue ?? 0)],
    ];
    downloadCsv(`kunlik-kpi-${m.metricDate ?? new Date().toISOString().split("T")[0]}.csv`, toCsv(rows));
  };

  if (isError) return <EPErrorState onRetry={refetchToday}  error={error} />;

  const kpiCards: { title: string; value: number; icon: LucideIcon; iconBg: string; trend?: number; isNetCash?: boolean }[] = [
    { title: "Pul qoldig'i", value: todayMetrics?.cashBalance || 0, icon: Wallet, iconBg: "fi", trend: todayMetrics?.cashTrend },
    { title: "Kunlik daromad", value: todayMetrics?.dailyIncome || 0, icon: TrendingUp, iconBg: "var(--ep-green)", trend: todayMetrics?.incomeTrend },
    { title: "Kunlik xarajat", value: todayMetrics?.dailyExpense || 0, icon: TrendingDown, iconBg: "var(--ep-red)" },
    { title: "Pul oqimi", value: todayMetrics?.dailyNetCash || 0, icon: Banknote, iconBg: netCashPositive ? "var(--ep-green)" : "var(--ep-red)", isNetCash: true },
  ];

  return (
    <div className="space-y-6" data-testid="daily-kpi-dashboard">
      <EPPageHeader
        icon={<BarChart3 className="h-5 w-5" />}
        title={t("kunlikMoliyaKpi")}
        subtitle={t("kunlikMoliyaviyKorsatkichlarPaneli")}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{new Date().toLocaleDateString("uz-UZ", { weekday: "long", day: "numeric", month: "long" })}</Badge>
            <Button size="sm" variant="outline" onClick={() => refetchToday()} data-testid="button-refresh-metrics"><RefreshCw className="h-4 w-4 mr-1" />{t("refresh")}</Button>
            <Button size="sm" variant="outline" onClick={handleExportCsv} disabled={!todayMetrics} data-testid="button-export-csv"><FileDown className="h-4 w-4 mr-1" />CSV</Button>
          </div>
        }
      />

      <div className="space-y-6">
        {todayLoading ? <EPSkeletonKpiRow count={4} /> : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {(Array.isArray(kpiCards) ? kpiCards : []).map((card, i) => (
            <div key={`k-${i}`} data-testid={`card-${["cash-balance","daily-income","daily-expense","net-cash-flow"][i]}`}>
              <EPKpiCard
                label={card.title}
                staticValue={`${card.isNetCash && netCashPositive ? "+" : ""}${formatShortCurrency(card.value)}`}
                icon={card.icon}
                iconBg={card.iconBg}
                delta={card.trend !== undefined && card.trend !== 0
                  ? { value: `${Math.abs(card.trend).toFixed(1)}%`, trend: card.trend > 0 ? "up" : "down" }
                  : undefined}
              />
            </div>
          ))}
        </div>
        )}

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
