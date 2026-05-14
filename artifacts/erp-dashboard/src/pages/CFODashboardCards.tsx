/**
 * @module CFODashboardCards
 * @description Currency formatters + KPI summary cards + financial ratio cards
 *   for CFODashboard.
 *
 *   Migrated to the EuroPrint design system:
 *     - <EPKpiCard> replaces the old flat coloured boxes
 *       (bg-green-500 / bg-red-500 / bg-blue-500 / bg-purple-500)
 *     - 42px round icon tile in the module/status hue (FI cyan + EP green/red/blue/purple)
 *     - Animated count-up via `staticValue` (we pass the pre-formatted short
 *       currency string so the animation just fades in)
 *     - Stagger entrance (0/60/120/180/240ms)
 *
 *   Ratio cards remain on `EPCard` since they show ratios as text rather than
 *   raw numbers — EPKpiCard is the wrong shape for "Current Ratio: 1.45".
 */

import {
  ArrowUpRight, ArrowDownRight, DollarSign, TrendingDown,
  Wallet, Briefcase, Coins, BarChart3,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import {
  CFODashboardData,
  ProfitabilityData,
} from "./CFODashboardTypes";
import { EPCard, EPKpiCard } from "@/components/ep";

// ─── Helpers ────────────────────────────────────────────────────────────────

export function formatPercent(value: number | undefined): string {
  if (value === undefined || value === null || isNaN(value)) return "—";
  return value.toFixed(1) + "%";
}

export function formatRatio(value: number | undefined): string {
  if (value === undefined || value === null || isNaN(value)) return "—";
  return value.toFixed(2);
}

export function makeFormatShortCurrency(billion: string, million: string, thousand: string) {
  return (amount: number): string => {
    if (amount >= 1_000_000_000) return (amount / 1_000_000_000).toFixed(1) + " " + billion;
    if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(1) + " " + million;
    if (amount >= 1_000) return (amount / 1_000).toFixed(0) + " " + thousand;
    return amount.toString();
  };
}

// ─── KPI Summary Cards ───────────────────────────────────────────────────────

interface KpiCardsProps {
  dashboard: CFODashboardData | undefined;
  netProfit: number;
  netProfitTrend: boolean;
  formatShortCurrency: (n: number) => string;
}

export function KpiCards({
  dashboard, netProfit, netProfitTrend, formatShortCurrency,
}: KpiCardsProps) {
  const { t } = useTranslation("finance");

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
      <EPKpiCard
        label={t("totalRevenue")}
        staticValue={formatShortCurrency(dashboard?.revenue || 0)}
        icon={ArrowUpRight}
        iconBg="var(--ep-green)"
        enterDelayMs={0}
      />
      <EPKpiCard
        label={t("totalExpenses")}
        staticValue={formatShortCurrency(dashboard?.expenses || 0)}
        icon={ArrowDownRight}
        iconBg="var(--ep-red)"
        enterDelayMs={60}
      />
      <EPKpiCard
        label={t("netProfit")}
        staticValue={formatShortCurrency(netProfit)}
        icon={netProfitTrend ? DollarSign : TrendingDown}
        iconBg={netProfitTrend ? "var(--ep-green)" : "var(--ep-yellow)"}
        enterDelayMs={120}
      />
      <EPKpiCard
        label={t("cashBalance")}
        staticValue={formatShortCurrency(dashboard?.cashBalance || 0)}
        icon={Wallet}
        iconBg="fi"
        enterDelayMs={180}
      />
      <EPKpiCard
        label={t("workingCapital")}
        staticValue={formatShortCurrency(dashboard?.workingCapital || 0)}
        icon={Briefcase}
        iconBg="var(--ep-purple)"
        enterDelayMs={240}
      />
    </div>
  );
}

// ─── Ratio Cards ─────────────────────────────────────────────────────────────

interface RatioCardsProps {
  dashboard: CFODashboardData | undefined;
  profitability: ProfitabilityData | undefined;
}

interface RatioBlockProps {
  label: string;
  value: string;
  hint: string;
  valueColor?: string;
  testId: string;
}

function RatioBlock({ label, value, hint, valueColor, testId }: RatioBlockProps) {
  return (
    <EPCard padding={20} data-testid={testId}>
      <p className="ep-eyebrow">{label}</p>
      <p
        className="ep-kpi-value mt-1"
        style={{ color: valueColor ?? "hsl(var(--foreground))" }}
      >
        {value}
      </p>
      <p className="text-[11px] text-muted-foreground mt-2">{hint}</p>
    </EPCard>
  );
}

export function RatioCards({ dashboard, profitability }: RatioCardsProps) {
  const { t } = useTranslation("finance");
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      <RatioBlock
        testId="card-current-ratio"
        label={t("currentRatio")}
        value={formatRatio(dashboard?.kpis?.currentRatio)}
        hint={t("currentRatioDesc")}
      />
      <RatioBlock
        testId="card-quick-ratio"
        label={t("quickRatio")}
        value={formatRatio(dashboard?.kpis?.quickRatio)}
        hint={t("quickRatioDesc")}
      />
      <RatioBlock
        testId="card-gross-profit-margin"
        label={t("grossProfitMargin")}
        value={formatPercent(profitability?.grossMargin || dashboard?.kpis?.grossProfitMargin)}
        hint="Gross Profit Margin"
        valueColor="var(--ep-green)"
      />
      <RatioBlock
        testId="card-net-profit-margin"
        label={t("netProfitMargin")}
        value={formatPercent(dashboard?.kpis?.netProfitMargin)}
        hint="Net Profit Margin"
        valueColor="var(--ep-blue)"
      />
      <RatioBlock
        testId="card-roa"
        label="ROA"
        value={formatPercent(dashboard?.kpis?.returnOnAssets)}
        hint="Return on Assets"
        valueColor="var(--ep-purple)"
      />
      <RatioBlock
        testId="card-roe"
        label="ROE"
        value={formatPercent(dashboard?.kpis?.returnOnEquity)}
        hint="Return on Equity"
        valueColor="var(--ep-yellow)"
      />
    </div>
  );
}
