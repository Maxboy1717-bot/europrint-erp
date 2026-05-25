/**
 * @module CFODashboardCharts
 * @description Cash-by-currency pie chart, profitability trend bar chart,
 *              Altman Z-Score card, and cashflow forecast chart for CFODashboard.
 */

import React from "react";
import { Link } from "wouter";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PieChart as PieChartIcon,
  BarChart3,
  Activity,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ComposedChart,
  Line,
} from "recharts";
import { useTranslation } from "@/lib/i18n";
import {
  CashPositionData,
  ProfitabilityTrendItem,
  FinancialRatiosDto,
  CashflowForecastDto,
} from "./CFODashboardTypes";

// ─── Cash by Currency + Profitability Trend ──────────────────────────────────

interface ChartSectionProps {
  currencyData: Array<{ name: string; value: number; color: string }>;
  profitabilityTrend: ProfitabilityTrendItem[];
  cashPosition: CashPositionData | undefined;
  formatShortCurrency: (n: number) => string;
}

export function ChartSection({ currencyData, profitabilityTrend, cashPosition, formatShortCurrency }: ChartSectionProps) {
  const { t } = useTranslation('finance');
  const { t: tCommon } = useTranslation('common');
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="bg-card rounded-xl p-6" data-testid="card-cash-by-currency">
        <div className="flex flex-col gap-1 mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />{t('currencyBalances')}
          </h3>
          <p className="text-sm text-muted-foreground">{t('allBankFunds')}</p>
        </div>
        <div className="glass-chart flex flex-col lg:flex-row items-center gap-6">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={currencyData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {(Array.isArray(currencyData) ? currencyData : []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ backgroundColor: "hsl(var(--surface-container-lowest))", border: "1px solid hsl(var(--outline-variant))", borderRadius: "8px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 min-w-[160px]">
            {(Array.isArray(currencyData) ? currencyData : []).map((item, index) => (
              <div key={`k-${index}`} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">{formatShortCurrency(item.value)}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-bold">{tCommon('total')}:</span>
                <span className="text-sm font-bold">{formatShortCurrency(cashPosition?.summary?.totalBalance || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl p-6" data-testid="card-profitability-trend">
        <div className="flex flex-col gap-1 mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />{t('profitabilityTrend')}
          </h3>
          <p className="text-sm text-muted-foreground">{t('last6MonthsRevExp')}</p>
        </div>
        <div className="glass-chart">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={profitabilityTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--outline-variant))" />
              <XAxis dataKey="month" tick={{ fill: "hsl(var(--on-surface-variant))", fontSize: 12 }} axisLine={{ stroke: "hsl(var(--outline-variant))" }} />
              <YAxis tick={{ fill: "hsl(var(--on-surface-variant))", fontSize: 12 }} axisLine={{ stroke: "hsl(var(--outline-variant))" }} tickFormatter={(value) => formatShortCurrency(value)} />
              <Tooltip
                formatter={(value: number, name: string) => [formatCurrency(value), name === "revenue" ? t('revenue') : t('expenses')]}
                contentStyle={{ backgroundColor: "hsl(var(--surface-container-lowest))", border: "1px solid hsl(var(--outline-variant))", borderRadius: "8px" }} />
              <Legend formatter={(value) => value === "revenue" ? t('revenue') : t('expenses')} />
              <Bar dataKey="revenue" fill="hsl(145, 65%, 50%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="hsl(0, 70%, 55%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── Altman Z-Score + Cashflow Forecast ──────────────────────────────────────

interface Sprint1SectionProps {
  ratios: FinancialRatiosDto | undefined;
  cfForecast: CashflowForecastDto | undefined;
  cfScenario: 'base' | 'optimistic' | 'pessimistic';
  setCfScenario: (s: 'base' | 'optimistic' | 'pessimistic') => void;
}

export function Sprint1Section({ ratios, cfForecast, cfScenario, setCfScenario }: Sprint1SectionProps) {
  const { t } = useTranslation('finance');
  if (!ratios && !cfForecast) return null;
  return (
    <div className="grid gap-4 lg:grid-cols-2" data-testid="section-sprint1">
      {ratios && (
        <div className={`rounded-xl p-6 text-white ${
          ratios.altmanZ.zone === 'Safe'      ? 'bg-emerald-500' :
          ratios.altmanZ.zone === 'Grey Zone' ? 'bg-amber-500' :
                                               'bg-red-500'
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
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-1 text-center mb-4">
            {(['x1','x2','x3','x4','x5'] as const).map(k => (
              <div key={k} className="bg-white/10 rounded p-1.5">
                <div className="text-xs text-white/70 uppercase">{k.toUpperCase()}</div>
                <div className="text-sm font-bold">{ratios.altmanZ[k].toFixed(2)}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
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

      {cfForecast && (
        <div className="bg-card rounded-xl p-6" data-testid="card-cashflow-forecast">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg">{t('cfo.cashflow.title')}</h3>
            <Link href="/finance/cashflow">
              <Button variant="outline" size="sm" className="text-xs">{t('cfo.cashflow.viewMore')}</Button>
            </Link>
          </div>
          <div className="flex gap-1 mb-3">
            {(['base','optimistic','pessimistic'] as const).map(sc => {
              const labelKey = sc === 'base' ? 'cfo.cashflow.scenario.base' : sc === 'optimistic' ? 'cfo.cashflow.scenario.optimistic' : 'cfo.cashflow.scenario.pessimistic';
              return (
                <button key={sc} onClick={() => setCfScenario(sc)}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${cfScenario === sc ? 'bg-primary text-primary-foreground border-primary' : 'border-muted-foreground/30 text-muted-foreground hover:bg-muted'}`}>
                  {t(labelKey)}
                </button>
              );
            })}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart
              data={(cfForecast.scenarios[cfScenario] ?? cfForecast.scenarios.base).map(w => ({
                week: `H${w.week}`, inflow: w.totalInflow, outflow: w.totalOutflow, cumulative: w.cumulativeCash,
              }))}
              margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="week" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="bar" tick={{ fontSize: 10 }} tickFormatter={v => (v / 1_000_000).toFixed(0) + t('cfo.cashflow.mSuffix')} />
              <YAxis yAxisId="line" orientation="right" tick={{ fontSize: 10 }} tickFormatter={v => (v / 1_000_000).toFixed(0) + t('cfo.cashflow.mSuffix')} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="bar" dataKey="inflow"  name={t('cfo.cashflow.inflow')}     stackId="a" fill="#10b981" />
              <Bar yAxisId="bar" dataKey="outflow" name={t('cfo.cashflow.outflow')}    stackId="a" fill="#ef4444" />
              <Line yAxisId="line" type="monotone" dataKey="cumulative" name={t('cfo.cashflow.cumulative')} stroke="#3b82f6" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-muted/50 rounded p-2">
              <div className="text-muted-foreground">{t('cfo.cashflow.opening')}</div>
              <div className="font-semibold">{formatCurrency(cfForecast.openingBalance)}</div>
            </div>
            <div className="bg-muted/50 rounded p-2">
              <div className="text-muted-foreground">{t('cfo.cashflow.minReserve')}</div>
              <div className="font-semibold text-[var(--ep-yellow)]">{formatCurrency(cfForecast.minCash)}</div>
            </div>
            <div className="bg-muted/50 rounded p-2">
              <div className="text-muted-foreground">{t('cfo.cashflow.weeks')}</div>
              <div className="font-semibold">{cfForecast.scenarios.base.length}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
