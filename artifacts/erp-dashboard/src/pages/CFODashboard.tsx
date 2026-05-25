/**
 * @module CFODashboard
 * @description CFO Panel (FI moduli — cyan accent).
 *
 *   Migrated to the EuroPrint design system:
 *     - <EPPageHeader> replaces the "CFO Panel" split-typography heading
 *       (no more `text-4xl font-light` + `font-bold text-primary` mix)
 *     - <EPErrorState> {t("forFetchFailures")}<EPEmptyState> for "no financial
 *       data yet", and skeleton helpers for the loading branch
 *     - Inline dynamic apiRequest import is preserved (the queryFn is still
 *       dynamic for code-splitting reasons)
 *
 *   The downstream KpiCards/RatioCards/ChartSection/Sprint1Section sections
 *   live in CFODashboardSections.tsx and keep their existing styling for now.
 *   They can be refactored to use <EPKpiCard> + <EPCard> in a follow-up
 *   without changing this orchestration file.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Settings, DollarSign } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

import {
  CFODashboardData,
  CashPositionData,
  ProfitabilityData,
  ProfitabilityTrendItem,
  FinancialRatiosDto,
  CashflowForecastDto,
  FinancialRiskData,
  CURRENCY_COLORS,
  DEFAULT_COLORS,
} from "./CFODashboardTypes";

import {
  makeFormatShortCurrency,
  KpiCards,
  RatioCards,
  ChartSection,
  Sprint1Section,
  QuickLinksSection,
  RiskSection,
  FinancialSummarySection,
} from "./CFODashboardSections";

import {
  EPPageHeader, EPErrorState, EPEmptyState,
  EPSkeletonKpiRow, EPSkeletonCard, EPStatusPill,
} from "@/components/ep";

export default function CFODashboard() {
  const { t } = useTranslation("finance");

  const [cfScenario, setCfScenario] = useState<"base" | "optimistic" | "pessimistic">("base");

  const {
    data: dashboard,
    isLoading: dashboardLoading,
    isError, error,
    refetch,
  } = useQuery<CFODashboardData>({ queryKey: ["/api/cfo/dashboard"] });

  const { data: cashPosition, isLoading: cashLoading } = useQuery<CashPositionData>({
    queryKey: ["/api/cfo/cash-position"],
  });

  const { data: profitability, isLoading: profitLoading } = useQuery<ProfitabilityData>({
    queryKey: ["/api/cfo/profitability"],
  });

  const { data: profitabilityTrend = [], isLoading: trendLoading } = useQuery<
    ProfitabilityTrendItem[]
  >({
    queryKey: ["/api/cfo/profitability-trend"],
  });

  const { data: financialRisk, isLoading: riskLoading } = useQuery<FinancialRiskData>({
    queryKey: ["/api/cfo/financial-risk"],
    refetchInterval: 5 * 60 * 1000,
  });

  const currentPeriod = new Date().toISOString().slice(0, 7);
  const { data: ratios } = useQuery<FinancialRatiosDto>({
    queryKey: ["/api/finance/ratios", currentPeriod],
    queryFn: () =>
      apiRequest("GET", `/api/finance/ratios?period=${currentPeriod}`) as Promise<FinancialRatiosDto>,
    staleTime: 5 * 60 * 1000,
  });

  const { data: cfForecast } = useQuery<CashflowForecastDto>({
    queryKey: ["/api/finance/cashflow/forecast"],
    queryFn: () =>
      apiRequest("GET", "/api/finance/cashflow/forecast") as Promise<CashflowForecastDto>,
    staleTime: 10 * 60 * 1000,
  });

  const netProfit = (dashboard?.revenue || 0) - (dashboard?.expenses || 0);
  const netProfitTrend = netProfit >= 0;

  const currencyData =
    cashPosition?.byCurrency?.map((item, index) => ({
      name: item.currency || "UZS",
      value: Number(item.total) || 0,
      color: CURRENCY_COLORS[item.currency] || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    })) || [];

  const formatShortCurrency = makeFormatShortCurrency(t("billion"), t("million"), t("thousand"));

  const isLoading = dashboardLoading && cashLoading && profitLoading && trendLoading;

  // Period badge in the header
  const periodBadge = (
    <EPStatusPill tone="info" hideDot>
      {new Date().toLocaleDateString("uz-UZ", { month: "long", year: "numeric" })}
    </EPStatusPill>
  );

  const headerActions = (
    <>
      <Link href="/cfo/config">
        <Button variant="outline" className="gap-1.5">
          <Settings className="h-4 w-4" />
          {t("settings")}
        </Button>
      </Link>
    </>
  );

  // ─── Error branch ──────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
        <EPPageHeader
          breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t('cfoPanel')}</b></>}
          title={t('cfoPanel')}
          subtitle={t("moliyaviyKorsatkichlarVaXavfTahlili")}
          status={periodBadge}
          actions={headerActions}
        />
        <EPErrorState onRetry={refetch}  error={error} />
      </div>
    );
  }

  // ─── Loading branch ───────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col h-full p-5 lg:p-6 gap-5" data-testid="cfo-dashboard-loading">
        <EPPageHeader
          breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t('cfoPanel')}</b></>}
          title={t('cfoPanel')}
          subtitle={t("moliyaviyKorsatkichlarVaXavfTahlili")}
          status={periodBadge}
          actions={headerActions}
        />
        <EPSkeletonKpiRow count={5} />
        <EPSkeletonKpiRow count={3} />
        <div className="grid gap-3 lg:grid-cols-2">
          <EPSkeletonCard lines={6} />
          <EPSkeletonCard lines={6} />
        </div>
      </div>
    );
  }

  // ─── Empty data branch ────────────────────────────────────────────────
  const hasNoFinancialData =
    !dashboardLoading &&
    !dashboard &&
    !cashPosition &&
    !profitability &&
    profitabilityTrend.length === 0;

  if (hasNoFinancialData) {
    return (
      <div className="flex flex-col h-full p-5 lg:p-6 gap-5" data-testid="cfo-dashboard-empty">
        <EPPageHeader
          breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t('cfoPanel')}</b></>}
          title={t('cfoPanel')}
          subtitle={t("moliyaviyKorsatkichlarVaXavfTahlili")}
          status={periodBadge}
          actions={headerActions}
        />
        <EPEmptyState
          icon={DollarSign}
          title={t("noFinancialData")}
          description={t("noFinancialReports")}
        />
      </div>
    );
  }

  // ─── Main render ──────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5" data-testid="cfo-dashboard">
      <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t('cfoPanel')}</b></>}
        title={t('cfoPanel')}
        subtitle={t("moliyaviyKorsatkichlarVaXavfTahlili")}
        status={periodBadge}
        actions={headerActions}
      />

      <div className="space-y-5">
        <KpiCards
          dashboard={dashboard}
          netProfit={netProfit}
          netProfitTrend={netProfitTrend}
          formatShortCurrency={formatShortCurrency}
        />

        <RatioCards dashboard={dashboard} profitability={profitability} />

        <ChartSection
          currencyData={currencyData}
          profitabilityTrend={profitabilityTrend}
          cashPosition={cashPosition}
          formatShortCurrency={formatShortCurrency}
        />

        <Sprint1Section
          ratios={ratios}
          cfForecast={cfForecast}
          cfScenario={cfScenario}
          setCfScenario={setCfScenario}
        />

        <QuickLinksSection />

        <RiskSection financialRisk={financialRisk} riskLoading={riskLoading} />

        <FinancialSummarySection
          dashboard={dashboard}
          netProfit={netProfit}
          netProfitTrend={netProfitTrend}
        />
      </div>
    </div>
  );
}
