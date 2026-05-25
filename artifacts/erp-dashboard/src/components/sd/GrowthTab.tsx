/**
 * @module GrowthTab
 * @description React UI component.
 */

import { SdGrowthData } from "./sd-types";
import { AlertTriangle, TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { KpiCard, fmtMoney, fmtNum } from "./helpers";
import { useTranslation } from '@/lib/i18n';

export function GrowthTab({ growth }: { growth: SdGrowthData }) {
  const { t } = useTranslation("common");
  if (!growth) return <div className="text-sm text-muted-foreground py-8 text-center">{t("malumotYuklanmadi")}</div>;

  const currentYear = new Date().getFullYear();
  const rate = growth.growthRate ?? 0;
  const trend = growth.trend ?? ((growth.totalOrders ?? 0) > 3 ? "growing" : (growth.totalOrders ?? 0) > 0 ? "stable" : "new");

  const trendConf: Record<string, { label: string; icon: typeof TrendingUp; cls: string; bg: string }> = {
    growing: { label: "O'sish tendensiyasi", icon: TrendingUp, cls: "text-[var(--ep-green)]", bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" },
    stable: { label: "Barqaror holat", icon: TrendingUp, cls: "text-[var(--ep-blue)]", bg: "bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800" },
    declining: { label: "Pasayish tendensiyasi", icon: TrendingDown, cls: "text-[var(--ep-red)]", bg: "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800" },
    new: { label: "Yangi mijoz", icon: Target, cls: "text-[var(--ep-purple)]", bg: "bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800" },
  };
  const tc = trendConf[trend] || trendConf.stable;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <KpiCard icon={DollarSign} label={`${currentYear - 1} yil`} value={fmtMoney(growth.lastYearTotal)}
          gradient="" />
        <KpiCard icon={DollarSign} label={`${currentYear} (hozirgacha)`} value={fmtMoney(growth.thisYearTotal)}
          gradient="" />
        <KpiCard icon={Target} label={t("yilPrognozi")} value={fmtMoney(growth.projectedThisYear)}
          sub={rate !== 0 ? `${rate >= 0 ? "+" : ""}${rate}% o'zgarish` : undefined}
          gradient="" />
      </div>

      {/* Trend indicator */}
      <div className={`rounded-xl border ${tc.bg} p-4`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tc.cls} bg-white/60 dark:bg-black/20`}>
            <tc.icon className="h-5 w-5" />
          </div>
          <div>
            <p className={`font-semibold ${tc.cls}`}>{tc.label}</p>
            {rate !== 0 && (
              <p className="text-sm text-muted-foreground">
                O'tgan yilga nisbatan{" "}
                <span className={`font-medium ${rate >= 0 ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]"}`}>
                  {rate >= 0 ? "+" : ""}{rate}%
                </span>
              </p>
            )}
            {growth.totalOrders !== undefined && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Jami: {growth.totalOrders} ta buyurtma &middot; O'rtacha: {fmtMoney(growth.avgOrderValue || (growth.totalRevenue ?? 0) / Math.max(1, growth.totalOrders ?? 0))}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Risk signals */}
      {(growth.riskSignals || []).length > 0 && (
        <div className="rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30 overflow-hidden">
          <div className="px-4 py-3 border-b border-orange-200 dark:border-orange-800">
            <h3 className="text-sm font-semibold text-[var(--ep-primary)] dark:text-orange-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />{t("xavfSignallari")}
            </h3>
          </div>
          <div className="p-4">
            <ul className="space-y-2">
              {growth.riskSignals.map((s: string, i: number) => (
                <li key={`rs-${i}`} className="flex items-center gap-2.5 text-sm text-[var(--ep-primary)] dark:text-orange-400">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />{s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Yearly trend chart */}
      {(growth.yearlyTrend || []).length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h3 className="text-sm font-semibold">Yillik trend (mln UZS)</h3>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={(growth.yearlyTrend || []).map((r) => ({
                yil: r.year, summa: Math.round(fmtNum(r.total) / 1_000_000),
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="yil" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`${v} M UZS`]} />
                <Bar dataKey="summa" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
