import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart as PieChartIcon,
  FileText,
  Calculator,
  Banknote,
  Target,
  Percent,
  Building2,
  CircleDollarSign,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Activity,
  Clock,
  Settings,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  ComposedChart,
} from "recharts";
import { useTranslation } from "@/lib/i18n";
import { ErrorState } from "@/components/ui/error-state";

interface CFODashboardData {
  kpis: {
    currentRatio?: number;
    quickRatio?: number;
    grossProfitMargin?: number;
    netProfitMargin?: number;
    returnOnAssets?: number;
    returnOnEquity?: number;
  };
  revenue: number;
  expenses: number;
  grossProfit: number;
  cashBalance: number;
  accountsReceivable: number;
  accountsPayable: number;
  workingCapital: number;
}

interface CashPositionData {
  accounts: Array<{
    id: string;
    accountName: string;
    accountNumber: string;
    bankName: string;
    currency: string;
    balance: number;
  }>;
  summary: {
    totalBalance: number;
    accountCount: number;
  };
  byCurrency: Array<{
    currency: string;
    total: number;
    accountCount: number;
  }>;
}

interface ProfitabilityData {
  revenue: {
    total: number;
    netValue: number;
    taxAmount: number;
    invoiceCount: number;
  };
  costs: {
    total: number;
    material: number;
    labor: number;
    overhead: number;
  };
  grossProfit: number;
  grossMargin: number;
}

interface RiskItem {
  category: string;
  level: "low" | "medium" | "high" | "critical";
  score: number;
  detail: string;
  recommendation: string;
}

interface FinancialRiskData {
  generatedAt: string;
  overallRiskScore: number;
  overallRiskLevel: "low" | "medium" | "high" | "critical";
  summary: {
    totalAR: number;
    overdueAR: number;
    totalAP: number;
    overdueAP: number;
    cashBalanceUZS: number;
    cashRunwayDays: number;
    collectionRisk: number;
    profitMarginTrend: "improving" | "declining" | "stable";
    latestGrossProfitMargin: number | null;
  };
  risks: RiskItem[];
  bankAccounts: Array<{ bankName: string; currency: string; balance: number; accountNumber: string }>;
  aiInsight: string;
}


const CURRENCY_COLORS: Record<string, string> = {
  UZS: "hsl(145, 65%, 50%)",
  USD: "hsl(210, 80%, 55%)",
  EUR: "hsl(270, 60%, 60%)",
  RUB: "hsl(45, 90%, 55%)",
};

const DEFAULT_COLORS = [
  "hsl(145, 65%, 50%)",
  "hsl(210, 80%, 55%)",
  "hsl(270, 60%, 60%)",
  "hsl(45, 90%, 55%)",
  "hsl(0, 70%, 55%)",
  "hsl(200, 70%, 55%)",
];

interface ProfitabilityTrendItem {
  month: string;
  revenue: number;
  expenses: number;
}

interface FinancialRatiosDto {
  period: string;
  liquidity: { currentRatio: number; quickRatio: number; cashRatio: number; workingCapital: number };
  profitability: { grossMarginPct: number; netMarginPct: number; roa: number; roe: number; roce: number };
  leverage: { debtToEquity: number; interestCoverage: number };
  altmanZ: { score: number; zone: 'Safe' | 'Grey Zone' | 'Distress'; x1: number; x2: number; x3: number; x4: number; x5: number };
  revenue: number; cogs: number; opex: number; netIncome: number;
  totalAssets: number; totalEquity: number; totalDebt: number;
}

interface WeeklyForecast { week: number; weekStart: string; weekEnd: string; totalInflow: number; totalOutflow: number; netCashFlow: number; cumulativeCash: number; status: 'OK' | 'WARNING' | 'CRITICAL' }
interface CashflowForecastDto { openingBalance: number; minCash: number; scenarios: { base: WeeklyForecast[]; optimistic: WeeklyForecast[]; pessimistic: WeeklyForecast[] }; generatedAt: string }

export default function CFODashboard() {
  const { t } = useTranslation('finance');
  const { t: tCommon } = useTranslation('common');

  const [cfScenario, setCfScenario] = useState<'base' | 'optimistic' | 'pessimistic'>('base');

  const { data: dashboard, isLoading: dashboardLoading, isError, refetch} = useQuery<CFODashboardData>({
    queryKey: ["/api/cfo/dashboard"],
  });

  const { data: cashPosition, isLoading: cashLoading } = useQuery<CashPositionData>({
    queryKey: ["/api/cfo/cash-position"],
  });

  const { data: profitability, isLoading: profitLoading } = useQuery<ProfitabilityData>({
    queryKey: ["/api/cfo/profitability"],
  });

  const { data: profitabilityTrend = [], isLoading: trendLoading } = useQuery<ProfitabilityTrendItem[]>({
    queryKey: ["/api/cfo/profitability-trend"],
  });

  const { data: financialRisk, isLoading: riskLoading } = useQuery<FinancialRiskData>({
    queryKey: ["/api/cfo/financial-risk"],
    refetchInterval: 5 * 60 * 1000, // 5 daqiqada bir yangilanadi
  });

  const currentPeriod = new Date().toISOString().slice(0, 7);
  const { data: ratios } = useQuery<FinancialRatiosDto>({
    queryKey: ["/api/finance/ratios", currentPeriod],
    queryFn: () => import("@/lib/queryClient").then(m => m.apiRequest(`/finance/ratios?period=${currentPeriod}`)),
    staleTime: 5 * 60 * 1000,
  });

  const { data: cfForecast } = useQuery<CashflowForecastDto>({
    queryKey: ["/api/finance/cashflow/forecast"],
    queryFn: () => import("@/lib/queryClient").then(m => m.apiRequest(`/finance/cashflow/forecast`)),
    staleTime: 10 * 60 * 1000,
  });

  const netProfit = (dashboard?.revenue || 0) - (dashboard?.expenses || 0);
  const netProfitTrend = netProfit >= 0;

  const currencyData = cashPosition?.byCurrency?.map((item, index) => ({
    name: item.currency || "UZS",
    value: Number(item.total) || 0,
    color: CURRENCY_COLORS[item.currency] || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  })) || [];

  const formatShortCurrency = (amount: number): string => {
    if (amount >= 1000000000) {
      return (amount / 1000000000).toFixed(1) + " " + t('billion');
    }
    if (amount >= 1000000) {
      return (amount / 1000000).toFixed(1) + " " + t('million');
    }
    if (amount >= 1000) {
      return (amount / 1000).toFixed(0) + " " + t('thousand');
    }
    return amount.toString();
  };

  function formatPercent(value: number | undefined): string {
    if (value === undefined || value === null || isNaN(value)) return "—";
    return value.toFixed(1) + "%";
  }

  function formatRatio(value: number | undefined): string {
    if (value === undefined || value === null || isNaN(value)) return "—";
    return value.toFixed(2);
  }

  const isLoading = dashboardLoading && cashLoading && profitLoading && trendLoading;

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto bg-surface p-6" data-testid="cfo-dashboard-loading">
        <h1 className="text-4xl font-light tracking-tight text-on-surface mb-8">
          CFO <span className="font-bold text-primary">Panel</span>
        </h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {([1, 2, 3, 4, 5]).map((i) => <Skeleton key={`k-${i}`} className="h-32" />)}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {([1, 2, 3, 4, 5, 6]).map((i) => <Skeleton key={`k-${i}`} className="h-24" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const hasNoFinancialData = !dashboardLoading && !dashboard && !cashPosition && !profitability && profitabilityTrend.length === 0;

  if (hasNoFinancialData) {
    return (
      <div className="flex-1 overflow-auto bg-surface p-6" data-testid="cfo-dashboard-empty">
        <h1 className="text-4xl font-light tracking-tight text-on-surface mb-8">
          CFO <span className="font-bold text-primary">Panel</span>
        </h1>
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <DollarSign className="h-16 w-16 mb-4" />
          <p className="text-lg font-medium">{t('noFinancialData')}</p>
          <p className="text-sm mt-2">{t('noFinancialReports')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-surface p-6" data-testid="cfo-dashboard">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-light tracking-tight text-on-surface">
          CFO <span className="font-bold text-primary">Panel</span>
        </h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {new Date().toLocaleDateString("uz-UZ", { month: "long", year: "numeric" })}
          </Badge>
          <Link href="/cfo/config">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-1.5" />
              Sozlamalar
            </Button>
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="bg-gradient-to-br from-green-600 to-green-700 text-white rounded-lg p-5" data-testid="card-revenue">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-90">{t('totalRevenue')}</p>
            <p className="text-4xl font-bold tracking-tight mt-1">{formatShortCurrency(dashboard?.revenue || 0)}</p>
            <p className="text-xs opacity-75 mt-2">
              <ArrowUpRight className="inline h-3 w-3" /> {t('sales')}
            </p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg p-5" data-testid="card-expenses">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-90">{t('totalExpenses')}</p>
            <p className="text-4xl font-bold tracking-tight mt-1">{formatShortCurrency(dashboard?.expenses || 0)}</p>
            <p className="text-xs opacity-75 mt-2">
              <ArrowDownRight className="inline h-3 w-3" /> {t('expenditures')}
            </p>
          </div>

          <div className={`bg-gradient-to-br ${netProfitTrend ? "from-emerald-500 to-emerald-600" : "from-orange-500 to-orange-600"} text-white rounded-lg p-5`} data-testid="card-net-profit">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-90">{t('netProfit')}</p>
            <p className="text-4xl font-bold tracking-tight mt-1">{formatShortCurrency(netProfit)}</p>
            <p className="text-xs opacity-75 mt-2">
              {netProfitTrend ? (
                <><ArrowUpRight className="inline h-3 w-3" /> {t('profitable')}</>
              ) : (
                <><ArrowDownRight className="inline h-3 w-3" /> {t('loss')}</>
              )}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-5" data-testid="card-cash-position">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-90">{t('cashBalance')}</p>
            <p className="text-4xl font-bold tracking-tight mt-1">{formatShortCurrency(dashboard?.cashBalance || 0)}</p>
            <p className="text-xs opacity-75 mt-2">{t('inBankAccounts')}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-5" data-testid="card-working-capital">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-90">{t('workingCapital')}</p>
            <p className="text-4xl font-bold tracking-tight mt-1">{formatShortCurrency(dashboard?.workingCapital || 0)}</p>
            <p className="text-xs opacity-75 mt-2">{t('currentAssetsMinusDebt')}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-current-ratio">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Current Ratio</p>
            <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">{formatRatio(dashboard?.kpis?.currentRatio)}</p>
            <p className="text-xs text-muted-foreground mt-2">{t('currentRatioDesc')}</p>
          </div>

          <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-quick-ratio">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Quick Ratio</p>
            <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">{formatRatio(dashboard?.kpis?.quickRatio)}</p>
            <p className="text-xs text-muted-foreground mt-2">{t('quickRatioDesc')}</p>
          </div>

          <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-gross-profit-margin">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t('grossProfitMargin')}</p>
            <p className="text-4xl font-bold tracking-tight text-green-600 mt-1">
              {formatPercent(profitability?.grossMargin || dashboard?.kpis?.grossProfitMargin)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Gross Profit Margin</p>
          </div>

          <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-net-profit-margin">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t('netProfitMargin')}</p>
            <p className="text-4xl font-bold tracking-tight text-blue-600 mt-1">
              {formatPercent(dashboard?.kpis?.netProfitMargin)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Net Profit Margin</p>
          </div>

          <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-roa">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">ROA</p>
            <p className="text-4xl font-bold tracking-tight text-purple-600 mt-1">
              {formatPercent(dashboard?.kpis?.returnOnAssets)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Return on Assets</p>
          </div>

          <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-roe">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">ROE</p>
            <p className="text-4xl font-bold tracking-tight text-amber-600 mt-1">
              {formatPercent(dashboard?.kpis?.returnOnEquity)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Return on Equity</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="bg-surface-container-lowest rounded-xl p-6" data-testid="card-cash-by-currency">
            <div className="flex flex-col gap-1 mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                {t('currencyBalances')}
              </h3>
              <p className="text-sm text-muted-foreground">{t('allBankFunds')}</p>
            </div>
            <div className="glass-chart flex flex-col lg:flex-row items-center gap-6">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={currencyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {(Array.isArray(currencyData) ? currencyData : []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: "hsl(var(--surface-container-lowest))",
                      border: "1px solid hsl(var(--outline-variant))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 min-w-[160px]">
                {(Array.isArray(currencyData) ? currencyData : []).map((item, index) => (
                  <div key={`k-${index}`} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatShortCurrency(item.value)}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-bold">{tCommon('total')}:</span>
                    <span className="text-sm font-bold">
                      {formatShortCurrency(cashPosition?.summary?.totalBalance || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-6" data-testid="card-profitability-trend">
            <div className="flex flex-col gap-1 mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {t('profitabilityTrend')}
              </h3>
              <p className="text-sm text-muted-foreground">{t('last6MonthsRevExp')}</p>
            </div>
            <div className="glass-chart">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={profitabilityTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--outline-variant))" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: "hsl(var(--on-surface-variant))", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(var(--outline-variant))" }}
                  />
                  <YAxis 
                    tick={{ fill: "hsl(var(--on-surface-variant))", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(var(--outline-variant))" }}
                    tickFormatter={(value) => formatShortCurrency(value)}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name === "revenue" ? t('revenue') : t('expenses')
                    ]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--surface-container-lowest))",
                      border: "1px solid hsl(var(--outline-variant))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend 
                    formatter={(value) => value === "revenue" ? t('revenue') : t('expenses')}
                  />
                  <Bar dataKey="revenue" fill="hsl(145, 65%, 50%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="hsl(0, 70%, 55%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Sprint 1: Altman Z-Score + 13-Week Cashflow Forecast */}
        {(ratios || cfForecast) && (
          <div className="grid gap-4 lg:grid-cols-2" data-testid="section-sprint1">
            {/* Altman Z-Score Card */}
            {ratios && (
              <div className={`rounded-xl p-6 text-white ${
                ratios.altmanZ.zone === 'Safe'      ? 'bg-gradient-to-br from-emerald-600 to-emerald-700' :
                ratios.altmanZ.zone === 'Grey Zone' ? 'bg-gradient-to-br from-amber-500 to-amber-600' :
                                                     'bg-gradient-to-br from-red-600 to-red-700'
              }`} data-testid="card-altman-z">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    <h3 className="font-semibold">{t('cfo.altman.title')}</h3>
                  </div>
                  <Badge className="bg-white/20 text-white border-white/30 text-xs">{ratios.period}</Badge>
                </div>
                <div className="flex items-end gap-3 mb-4">
                  <span className="text-5xl font-bold">{ratios.altmanZ.score.toFixed(2)}</span>
                  <span className="mb-1 text-lg font-semibold uppercase tracking-wide text-white/90">
                    {ratios.altmanZ.zone === 'Safe' ? t('cfo.altman.safe') : ratios.altmanZ.zone === 'Grey Zone' ? t('cfo.altman.greyZone') : t('cfo.altman.distress')}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1 text-center mb-4">
                  {(['x1','x2','x3','x4','x5'] as const).map(k => (
                    <div key={k} className="bg-white/10 rounded p-1.5">
                      <div className="text-xs text-white/70 uppercase">{k.toUpperCase()}</div>
                      <div className="text-sm font-bold">{ratios.altmanZ[k].toFixed(2)}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="bg-white/10 rounded-lg p-2 text-center">
                    <div className="text-white/70 text-xs">{t('cfo.altman.grossMargin')}</div>
                    <div className="font-semibold">{ratios.profitability.grossMarginPct.toFixed(1)}%</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-2 text-center">
                    <div className="text-white/70 text-xs">{t('cfo.altman.roa')}</div>
                    <div className="font-semibold">{ratios.profitability.roa.toFixed(1)}%</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-2 text-center">
                    <div className="text-white/70 text-xs">{t('cfo.altman.de')}</div>
                    <div className="font-semibold">{ratios.leverage.debtToEquity.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* 13-Week Cashflow Forecast Mini Chart */}
            {cfForecast && (
              <div className="bg-surface-container-lowest rounded-xl p-6" data-testid="card-cashflow-forecast">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{t('cfo.cashflow.title')}</h3>
                  </div>
                  <Link href="/finance/cashflow">
                    <Button variant="outline" size="sm" className="text-xs">{t('cfo.cashflow.viewMore')}</Button>
                  </Link>
                </div>
                {/* Scenario toggle */}
                <div className="flex gap-1 mb-3">
                  {(['base','optimistic','pessimistic'] as const).map(sc => {
                    const labelKey = sc === 'base'
                      ? 'cfo.cashflow.scenario.base'
                      : sc === 'optimistic'
                      ? 'cfo.cashflow.scenario.optimistic'
                      : 'cfo.cashflow.scenario.pessimistic';
                    return (
                      <button
                        key={sc}
                        onClick={() => setCfScenario(sc)}
                        className={`text-xs px-2 py-1 rounded border transition-colors ${
                          cfScenario === sc
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-muted-foreground/30 text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {t(labelKey)}
                      </button>
                    );
                  })}
                </div>
                {/* Stacked inflow/outflow bar + cumulative line */}
                <ResponsiveContainer width="100%" height={180}>
                  <ComposedChart
                    data={(cfForecast.scenarios[cfScenario] ?? cfForecast.scenarios.base).map(w => ({
                      week: `H${w.week}`,
                      inflow:     w.totalInflow,
                      outflow:    w.totalOutflow,
                      cumulative: w.cumulativeCash,
                    }))}
                    margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="bar" tick={{ fontSize: 10 }} tickFormatter={v => (v / 1_000_000).toFixed(0) + t('cfo.cashflow.mSuffix')} />
                    <YAxis yAxisId="line" orientation="right" tick={{ fontSize: 10 }} tickFormatter={v => (v / 1_000_000).toFixed(0) + t('cfo.cashflow.mSuffix')} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    <Bar yAxisId="bar" dataKey="inflow"     name={t('cfo.cashflow.inflow')}      stackId="a" fill="#10b981" />
                    <Bar yAxisId="bar" dataKey="outflow"    name={t('cfo.cashflow.outflow')}     stackId="a" fill="#ef4444" />
                    <Line yAxisId="line" type="monotone" dataKey="cumulative" name={t('cfo.cashflow.cumulative')} stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-muted/50 rounded p-2">
                    <div className="text-muted-foreground">{t('cfo.cashflow.opening')}</div>
                    <div className="font-semibold">{formatCurrency(cfForecast.openingBalance)}</div>
                  </div>
                  <div className="bg-muted/50 rounded p-2">
                    <div className="text-muted-foreground">{t('cfo.cashflow.minReserve')}</div>
                    <div className="font-semibold text-amber-600">{formatCurrency(cfForecast.minCash)}</div>
                  </div>
                  <div className="bg-muted/50 rounded p-2">
                    <div className="text-muted-foreground">{t('cfo.cashflow.weeks')}</div>
                    <div className="font-semibold">{cfForecast.scenarios.base.length}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-surface-container-lowest rounded-xl p-6" data-testid="card-quick-links">
          <div className="flex flex-col gap-1 mb-6">
            <h3 className="text-lg font-semibold">{t('quickLinks')}</h3>
            <p className="text-sm text-muted-foreground">{t('cfoMainModules')}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/cash-flow">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 hover-elevate" data-testid="link-cash-flow">
                <Banknote className="h-6 w-6 text-green-500" />
                <span>{t('cashFlow')}</span>
                <span className="text-xs text-muted-foreground">Cash Flow</span>
              </Button>
            </Link>
            <Link href="/finance/budgets">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 hover-elevate" data-testid="link-budgets">
                <Target className="h-6 w-6 text-blue-500" />
                <span>{t('budgets')}</span>
                <span className="text-xs text-muted-foreground">Manage Budgets</span>
              </Button>
            </Link>
            <Link href="/finance/order-costing">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 hover-elevate" data-testid="link-order-costing">
                <Calculator className="h-6 w-6 text-purple-500" />
                <span>{t('orderCosting')}</span>
                <span className="text-xs text-muted-foreground">Order Costing</span>
              </Button>
            </Link>
            <Link href="/financial-reports">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 hover-elevate" data-testid="link-reports">
                <FileText className="h-6 w-6 text-amber-500" />
                <span>{t('financialReports')}</span>
                <span className="text-xs text-muted-foreground">Financial Reports</span>
              </Button>
            </Link>
            <Link href="/finance/variance">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 hover-elevate" data-testid="link-variance">
                <TrendingDown className="h-6 w-6 text-rose-500" />
                <span>Variance Tahlili</span>
                <span className="text-xs text-muted-foreground">MPV · MQV · LRV · LEV · OV</span>
              </Button>
            </Link>
            <Link href="/finance/break-even">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 hover-elevate" data-testid="link-break-even">
                <BarChart3 className="h-6 w-6 text-cyan-500" />
                <span>Break-Even</span>
                <span className="text-xs text-muted-foreground">CVP · BEP tahlili</span>
              </Button>
            </Link>
            <Link href="/finance/pricing-tiers">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 hover-elevate" data-testid="link-pricing">
                <Percent className="h-6 w-6 text-indigo-500" />
                <span>Narxlar Tizimi</span>
                <span className="text-xs text-muted-foreground">Tiered Pricing</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Financial Risk AI Panel */}
        <div className="grid gap-4 lg:grid-cols-2" data-testid="section-financial-risk">
          {/* Risk Score Card */}
          <div className={`rounded-xl p-6 text-white ${
            financialRisk?.overallRiskLevel === "critical" ? "bg-gradient-to-br from-red-700 to-red-800" :
            financialRisk?.overallRiskLevel === "high" ? "bg-gradient-to-br from-orange-600 to-orange-700" :
            financialRisk?.overallRiskLevel === "medium" ? "bg-gradient-to-br from-amber-500 to-amber-600" :
            "bg-gradient-to-br from-emerald-600 to-emerald-700"
          }`} data-testid="card-risk-score">
            {riskLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-40 bg-white/20" />
                <Skeleton className="h-12 w-28 bg-white/20" />
                <Skeleton className="h-4 w-full bg-white/20" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {(financialRisk?.overallRiskLevel === "critical" || financialRisk?.overallRiskLevel === "high") ? (
                      <ShieldAlert className="h-6 w-6" />
                    ) : (
                      <ShieldCheck className="h-6 w-6" />
                    )}
                    <h3 className="text-lg font-bold">Moliyaviy Risk Tahlili</h3>
                  </div>
                  <Badge className="bg-white/20 text-white border-white/30 text-xs">
                    AI • Rule-based
                  </Badge>
                </div>
                <div className="flex items-end gap-3 mb-3">
                  <span className="text-5xl font-bold">{financialRisk?.overallRiskScore ?? 0}</span>
                  <span className="text-white/70 mb-2">/100</span>
                  <span className="mb-2 text-lg font-semibold uppercase tracking-wide">
                    {financialRisk?.overallRiskLevel === "critical" ? t('cfo.risk.critical') :
                     financialRisk?.overallRiskLevel === "high" ? t('cfo.risk.high') :
                     financialRisk?.overallRiskLevel === "medium" ? t('cfo.risk.medium') : t('cfo.risk.low')}
                  </span>
                </div>
                <p className="text-white/90 text-sm leading-relaxed mb-4">{financialRisk?.aiInsight}</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white/10 rounded-lg p-2 text-center">
                    <p className="text-xs text-white/70 uppercase tracking-wide mb-1">{t('cfo.risk.cash')}</p>
                    <p className="text-sm font-bold">{financialRisk?.summary?.cashRunwayDays ?? "—"} {t('cfo.risk.days')}</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-2 text-center">
                    <p className="text-xs text-white/70 uppercase tracking-wide mb-1">{t('cfo.risk.arDelay')}</p>
                    <p className="text-sm font-bold">{financialRisk?.summary?.collectionRisk?.toFixed(0) ?? "—"}%</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-2 text-center">
                    <p className="text-xs text-white/70 uppercase tracking-wide mb-1">{t('cfo.risk.gpmTrend')}</p>
                    <p className="text-sm font-bold flex items-center justify-center gap-1">
                      {financialRisk?.summary?.profitMarginTrend === "improving" ? (
                        <><TrendingUp className="h-3 w-3" /> {t('cfo.risk.improving')}</>
                      ) : financialRisk?.summary?.profitMarginTrend === "declining" ? (
                        <><TrendingDown className="h-3 w-3" /> {t('cfo.risk.declining')}</>
                      ) : t('cfo.risk.stable')}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Risk Breakdown */}
          <div className="bg-surface-container-lowest rounded-xl p-6" data-testid="card-risk-breakdown">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">{t('cfo.risk.title')}</h3>
            </div>
            {riskLoading ? (
              <div className="space-y-3">
                {([1,2,3,4,5]).map(i => <Skeleton key={`k-${i}`} className="h-10 w-full" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {(financialRisk?.risks || []).map((risk, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-surface-container" data-testid={`risk-item-${idx}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">{risk.category}</span>
                        <Badge variant="outline" className={`text-xs shrink-0 ${
                          risk.level === "critical" ? "border-red-500 text-red-600 dark:text-red-400" :
                          risk.level === "high" ? "border-orange-500 text-orange-600 dark:text-orange-400" :
                          risk.level === "medium" ? "border-amber-500 text-amber-600 dark:text-amber-400" :
                          "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                        }`}>
                          {risk.level === "critical" ? t('cfo.risk.criticalBadge') :
                           risk.level === "high" ? t('cfo.risk.highBadge') :
                           risk.level === "medium" ? t('cfo.risk.mediumBadge') : t('cfo.risk.lowBadge')}
                        </Badge>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            risk.level === "critical" ? "bg-red-500" :
                            risk.level === "high" ? "bg-orange-500" :
                            risk.level === "medium" ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${(risk.score / 25) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-muted-foreground w-8 text-right shrink-0">{risk.score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-surface-container-lowest rounded-xl p-6" data-testid="card-financial-summary">
          <h3 className="text-lg font-semibold mb-4">{t('financialSummary')}</h3>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant md:border-b-0 md:border-r md:pr-4">
              <div>
                <span className="text-sm text-on-surface-variant">Debitorlar (AR)</span>
                <p className="font-bold text-green-600 text-lg">{formatCurrency(dashboard?.accountsReceivable || 0)}</p>
              </div>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant md:border-b-0 md:border-r md:px-4">
              <div>
                <span className="text-sm text-on-surface-variant">Kreditorlar (AP)</span>
                <p className="font-bold text-red-600 text-lg">{formatCurrency(dashboard?.accountsPayable || 0)}</p>
              </div>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant md:border-b-0 md:border-r md:px-4">
              <div>
                <span className="text-sm text-on-surface-variant">Yalpi foyda</span>
                <p className="font-bold text-lg">{formatCurrency(dashboard?.grossProfit || 0)}</p>
              </div>
            </div>
            <div className="flex justify-between items-center md:pl-4">
              <div>
                <span className="text-sm text-on-surface-variant">Sof pozitsiya</span>
                <p className={`font-bold text-xl ${netProfitTrend ? "text-emerald-600" : "text-orange-600"}`}>
                  {formatCurrency(netProfit)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
