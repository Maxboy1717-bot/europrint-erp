/**
 * @module LtvTab
 * @description React UI component.
 */

import { SdLtvData, SdOrdersData } from "./sd-types";
import { DollarSign, TrendingUp, BarChart2, Calendar, Target, AlertTriangle, Zap, Brain } from "lucide-react";
import { KpiCard, fmtMoney, fmtDate } from "./helpers";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from '@/lib/i18n';

interface PredictiveData {
  churnRisk: number;
  churnLabel: string;
  ltvForecast: number;
  avgMonthlyRevenue: number;
  nextBestAction: string | null;
}

export function LtvTab({ ltv, orders, predictive }: { ltv: SdLtvData; orders: SdOrdersData; predictive?: PredictiveData }) {
  const { t } = useTranslation("common");
  if (!ltv) return <div className="text-sm text-muted-foreground py-8 text-center">{t("malumotYuklanmadi")}</div>;

  // Field names: backend sends avgMonthlyRevenue & lifetimeMonths (not averageMonthlyRevenue & customerLifetimeMonths)
  const totalRevenue = ltv.totalRevenueAllTime ?? ltv.lifetimeValue ?? 0;
  const marginRate = ltv.marginRate ?? 0;
  const totalMargin = ltv.totalMarginEstimate ?? (Number(totalRevenue) * marginRate / 100);
  const avgMonthly = ltv.averageMonthlyRevenue ?? ltv.avgMonthlyRevenue ?? predictive?.avgMonthlyRevenue ?? 0;
  const months = ltv.customerLifetimeMonths ?? ltv.lifetimeMonths ?? (ltv.daysSinceFirstOrder ? Math.ceil(Number(ltv.daysSinceFirstOrder) / 30) : 0);
  const ltvValue = ltv.ltvValue ?? ltv.ltvForecast ?? ltv.lifetimeValue ?? totalRevenue;
  const ltvForecast24 = predictive?.ltvForecast ?? ltv.ltvForecast ?? Math.round(Number(avgMonthly) * 24);
  const vsAvg = ltv.vsAveragePercent ?? 0;
  const isVsAvgDefined = ltv.vsAveragePercent !== undefined && ltv.vsAveragePercent !== null && !isNaN(Number(ltv.vsAveragePercent));
  const acqCost = ltv.acquisitionCostEstimate ?? 0;
  const svcCost = ltv.serviceMonthlyEstimate ?? 0;
  const netProfit = ltv.netProfit ?? (Number(totalRevenue) - Number(acqCost) - (Number(svcCost) * months));

  // Orders data
  const ordersTotal = orders?.totalCount ?? (orders as Record<string, unknown>)?.totalOrders ?? ltv.totalOrders ?? 0;
  const firstDate = orders?.firstOrderDate ?? ltv.firstOrderDate;
  const lastDate = orders?.lastOrderDate ?? ltv.lastOrderDate;

  // Predictive
  const churnRisk = predictive?.churnRisk ?? 0;
  const churnLabel = predictive?.churnLabel ?? (churnRisk >= 70 ? "high" : churnRisk >= 40 ? "medium" : "low");
  const churnConf = {
    high: { label: "Yuqori xavf", cls: "text-[var(--ep-red)]", bar: "[&>div]:bg-rose-500", bg: "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800" },
    medium: { label: "O'rtacha xavf", cls: "text-[var(--ep-yellow)]", bar: "[&>div]:bg-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" },
    low: { label: "Past xavf", cls: "text-[var(--ep-green)]", bar: "[&>div]:bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" },
  }[churnLabel] || { label: "Noma'lum", cls: "text-muted-foreground", bar: "", bg: "bg-muted/30 border-border" };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <KpiCard icon={DollarSign} label={t("jamiDaromad")} value={fmtMoney(totalRevenue)}
          gradient="" />
        <KpiCard icon={TrendingUp} label={t("taxminiyMarja")} value={fmtMoney(totalMargin)}
          sub={marginRate > 0 ? `${marginRate}%` : undefined}
          gradient="" />
        <KpiCard icon={BarChart2} label={t("ortachaOylik")} value={fmtMoney(avgMonthly)}
          gradient="" />
        <KpiCard icon={Calendar} label={t("mijozlikDavri")} value={`${months} oy`}
          gradient="" />
        <KpiCard icon={Target} label="LTV (hozirgi)" value={fmtMoney(ltvValue)}
          gradient="" />
        <KpiCard icon={Brain} label="LTV (24 oy prognoz)" value={fmtMoney(ltvForecast24)}
          gradient="" />
      </div>

      {/* Churn risk indicator */}
      {predictive && (
        <div className={`rounded-xl border ${churnConf.bg} overflow-hidden`}>
          <div className="px-4 py-3 border-b border-current/20">
            <h3 className={`text-sm font-semibold flex items-center gap-2 ${churnConf.cls}`}>
              <AlertTriangle className="h-4 w-4" />Ketish xavfi (Churn Risk)
            </h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className={`text-2xl font-black ${churnConf.cls}`}>{churnRisk}%</span>
              <span className={`text-sm font-semibold px-3 py-1 rounded-full bg-white/60 dark:bg-black/20 ${churnConf.cls}`}>
                {churnConf.label}
              </span>
            </div>
            <Progress value={churnRisk} className={`h-2.5 rounded-full ${churnConf.bar}`} />
            {predictive.nextBestAction && (
              <div className="flex items-start gap-2 text-sm mt-2">
                <Zap className="h-4 w-4 shrink-0 mt-0.5 text-[var(--ep-yellow)]" />
                <p className="text-muted-foreground">{predictive.nextBestAction}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Profitability */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h3 className="text-sm font-semibold">{t("daromadlilikTahlili")}</h3>
          </div>
          <div className="p-4 space-y-3">
            <Row label={t("jamiDaromad")} value={fmtMoney(totalRevenue)} />
            <Row label={`Taxminiy marja${marginRate > 0 ? ` (${marginRate}%)` : ""}`} value={fmtMoney(totalMargin)} cls="text-[var(--ep-green)]" />
            <div className="border-t pt-3 space-y-2">
              <Row label={t("jalbXarajati")} value={fmtMoney(acqCost)} />
              <Row label="Xizmat/oy" value={fmtMoney(svcCost)} />
            </div>
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="font-semibold text-sm">{t("sofFoyda")}</span>
              <span className={`font-bold text-lg ${Number(netProfit) >= 0 ? "text-[var(--ep-green)]" : "text-destructive"}`}>
                {fmtMoney(netProfit)}
              </span>
            </div>
          </div>
        </div>

        {/* Comparison + Timeline */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h3 className="text-sm font-semibold">{t("taqqoslamaVaVaqtChizigi")}</h3>
          </div>
          <div className="p-4 space-y-4">
            {isVsAvgDefined && (
              <div className="p-4 rounded-xl bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground mb-1.5">{t("kompaniyaOrtachasidan")}</p>
                <p className={`text-4xl font-bold ${vsAvg >= 0 ? "text-[var(--ep-green)]" : "text-destructive"}`}>
                  {vsAvg >= 0 ? "+" : ""}{vsAvg}%
                </p>
              </div>
            )}
            <div className="space-y-2.5">
              <Row label={t("birinchiBuyurtma")} value={fmtDate(firstDate)} />
              <Row label={t("songgiBuyurtma")} value={fmtDate(lastDate)} />
              <Row label={t("jamiBuyurtmalar")} value={`${ordersTotal} ta`} />
              <Row label="LTV (24 oylik prognoz)" value={fmtMoney(ltvForecast24)} cls="text-[var(--ep-blue)] font-bold" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, cls }: { label: string; value: string; cls?: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${cls || ""}`}>{value}</span>
    </div>
  );
}

