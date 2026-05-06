import { SdLtvData, SdOrdersData } from "./sd-types";
import { DollarSign, TrendingUp, BarChart2, Calendar, Target } from "lucide-react";
import { KpiCard, fmtMoney, fmtDate, fmtNum } from "./helpers";

export function LtvTab({ ltv, orders }: { ltv: SdLtvData; orders: SdOrdersData }) {
  if (!ltv) return <div className="text-sm text-muted-foreground py-8 text-center">Ma'lumot yuklanmadi</div>;

  // Safely access fields — backend may return different field names
  const totalRevenue = ltv.totalRevenueAllTime ?? ltv.lifetimeValue ?? 0;
  const marginRate = ltv.marginRate ?? 0;
  const totalMargin = ltv.totalMarginEstimate ?? (Number(totalRevenue) * marginRate / 100);
  const avgMonthly = ltv.averageMonthlyRevenue ?? 0;
  const months = ltv.customerLifetimeMonths ?? ltv.daysSinceFirstOrder
    ? Math.ceil(Number(ltv.daysSinceFirstOrder || 0) / 30)
    : 0;
  const ltvValue = ltv.ltvValue ?? ltv.lifetimeValue ?? totalRevenue;
  const vsAvg = ltv.vsAveragePercent ?? 0;
  const isVsAvgDefined = ltv.vsAveragePercent !== undefined && ltv.vsAveragePercent !== null && !isNaN(Number(ltv.vsAveragePercent));
  const acqCost = ltv.acquisitionCostEstimate ?? 0;
  const svcCost = ltv.serviceMonthlyEstimate ?? 0;
  const netProfit = ltv.netProfit ?? (Number(totalRevenue) - Number(acqCost) - (Number(svcCost) * months));

  // Orders data (may be different shape)
  const ordersTotal = orders?.totalCount ?? orders?.totalOrders ?? 0;
  const firstDate = orders?.firstOrderDate ?? ltv.firstOrderDate;
  const lastDate = orders?.lastOrderDate ?? ltv.lastOrderDate;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <KpiCard icon={DollarSign} label="Jami daromad" value={fmtMoney(totalRevenue)}
          gradient="from-emerald-500 to-teal-500" />
        <KpiCard icon={TrendingUp} label="Taxminiy marja" value={fmtMoney(totalMargin)}
          sub={marginRate > 0 ? `${marginRate}%` : undefined}
          gradient="from-sky-500 to-blue-500" />
        <KpiCard icon={BarChart2} label="O'rtacha oylik" value={fmtMoney(avgMonthly)}
          gradient="from-violet-500 to-purple-500" />
        <KpiCard icon={Calendar} label="Mijozlik davri" value={`${months} oy`}
          gradient="from-amber-500 to-orange-500" />
        <KpiCard icon={Target} label="LTV qiymati" value={fmtMoney(ltvValue)}
          gradient="from-rose-500 to-pink-500" />
        <KpiCard icon={TrendingUp} label="O'rtachadan farq"
          value={isVsAvgDefined ? `${vsAvg >= 0 ? "+" : ""}${vsAvg}%` : "—"}
          color={!isVsAvgDefined ? "text-muted-foreground" : vsAvg >= 0 ? "text-emerald-600" : "text-destructive"}
          gradient="from-slate-500 to-gray-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Profitability */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h3 className="text-sm font-semibold">Daromadlilik tahlili</h3>
          </div>
          <div className="p-4 space-y-3">
            <Row label="Jami daromad" value={fmtMoney(totalRevenue)} />
            <Row label={`Taxminiy marja${marginRate > 0 ? ` (${marginRate}%)` : ""}`} value={fmtMoney(totalMargin)} cls="text-emerald-600" />
            <div className="border-t pt-3 space-y-2">
              <Row label="Jalb xarajati" value={fmtMoney(acqCost)} />
              <Row label="Xizmat/oy" value={fmtMoney(svcCost)} />
            </div>
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="font-semibold text-sm">Sof foyda</span>
              <span className={`font-bold text-lg ${Number(netProfit) >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                {fmtMoney(netProfit)}
              </span>
            </div>
          </div>
        </div>

        {/* Comparison */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h3 className="text-sm font-semibold">Taqqoslama</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="p-5 rounded-xl bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground mb-1.5">Kompaniya o'rtachasidan</p>
              {isVsAvgDefined ? (
                <p className={`text-4xl font-bold ${vsAvg >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                  {vsAvg >= 0 ? "+" : ""}{vsAvg}%
                </p>
              ) : (
                <p className="text-2xl font-bold text-muted-foreground">—</p>
              )}
            </div>
            <div className="space-y-2.5">
              <Row label="Birinchi buyurtma" value={fmtDate(firstDate)} />
              <Row label="So'nggi buyurtma" value={fmtDate(lastDate)} />
              <Row label="Jami buyurtmalar" value={`${ordersTotal} ta`} />
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
