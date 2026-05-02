import { SdLtvData, SdOrdersData } from "./sd-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, BarChart2, Calendar, Target } from "lucide-react";
import { KpiCard, fmtMoney, fmtDate } from "./helpers";

export function LtvTab({ ltv, orders }: { ltv: SdLtvData; orders: SdOrdersData }) {
  if (!ltv) return <div className="text-sm text-muted-foreground py-8 text-center">Ma'lumot yuklanmadi</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <KpiCard icon={DollarSign} label="Jami daromad" value={fmtMoney(ltv.totalRevenueAllTime)} />
        <KpiCard icon={TrendingUp} label="Taxminiy marja" value={fmtMoney(ltv.totalMarginEstimate)} sub={`${ltv.marginRate}%`} />
        <KpiCard icon={BarChart2} label="O'rtacha oylik" value={fmtMoney(ltv.averageMonthlyRevenue)} />
        <KpiCard icon={Calendar} label="Mijozlik davri" value={`${ltv.customerLifetimeMonths || 0} oy`} />
        <KpiCard icon={Target} label="LTV qiymati" value={fmtMoney(ltv.ltvValue)} />
        <KpiCard icon={TrendingUp} label="O'rtachadan farq"
          value={`${ltv.vsAveragePercent >= 0 ? "+" : ""}${ltv.vsAveragePercent}%`}
          color={ltv.vsAveragePercent >= 0 ? "text-green-600" : "text-destructive"} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Daromadlilik tahlili</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Jami daromad</span>
              <span className="font-medium">{fmtMoney(ltv.totalRevenueAllTime)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taxminiy marja ({ltv.marginRate}%)</span>
              <span className="font-medium text-green-600">{fmtMoney(ltv.totalMarginEstimate)}</span>
            </div>
            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Jalb xarajati</span>
                <span>{fmtMoney(ltv.acquisitionCostEstimate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Xizmat/oy</span>
                <span>{fmtMoney(ltv.serviceMonthlyEstimate)}</span>
              </div>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="font-medium">Sof foyda</span>
              <span className={`font-bold text-lg ${ltv.netProfit >= 0 ? "text-green-600" : "text-destructive"}`}>
                {fmtMoney(ltv.netProfit)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Taqqoslama</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="p-4 rounded-md bg-muted text-center">
              <p className="text-xs text-muted-foreground mb-1">Kompaniya o'rtachasidan</p>
              <p className={`text-3xl font-bold ${ltv.vsAveragePercent >= 0 ? "text-green-600" : "text-destructive"}`}>
                {ltv.vsAveragePercent >= 0 ? "+" : ""}{ltv.vsAveragePercent}%
              </p>
            </div>
            {orders && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Birinchi buyurtma</span>
                  <span>{fmtDate(orders.firstOrderDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">So'nggi buyurtma</span>
                  <span>{fmtDate(orders.lastOrderDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jami buyurtmalar</span>
                  <span>{orders.totalCount || 0} ta</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
