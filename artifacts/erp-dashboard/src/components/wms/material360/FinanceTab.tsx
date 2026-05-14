/**
 * @module FinanceTab
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Package, BarChart2 } from "lucide-react";
import { KpiCard } from "./KpiCard";
import { fmtMoney, type FinanceInfo, type BasicInfo } from "./types";

export function FinanceTab({ finance, basic }: { finance: FinanceInfo; basic: BasicInfo }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={DollarSign} label="Joriy o'rt. narx" value={fmtMoney(finance.currentAvgPrice, finance.currency)} sub={`/${basic.unitOfMeasure}`} />
        <KpiCard icon={ShoppingCart} label="Oxirgi xarid narxi" value={fmtMoney(finance.lastPurchasePrice, finance.currency)} sub={`/${basic.unitOfMeasure}`} />
        <KpiCard icon={Package} label="Ombor qiymati" value={fmtMoney(finance.currentStockValue, finance.currency)} color="text-primary" />
        <KpiCard icon={BarChart2} label="Oylik xarajat (o'rt)" value={fmtMoney(finance.monthlySpendAvg, finance.currency)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Narx ma'lumotlari</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {([["Joriy o'rtacha narx", fmtMoney(finance.currentAvgPrice, finance.currency)], ["Oxirgi xarid narxi", fmtMoney(finance.lastPurchasePrice, finance.currency)], ["Narx trendi", finance.priceTrend === "up" ? "O'sish" : finance.priceTrend === "down" ? "Pasayish" : "Barqaror"], ["Yillik xarajat (taxmin)", fmtMoney(finance.annualSpendEstimate, finance.currency)]]).map(([l, v]) => (
              <div key={l} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{l}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Yetkazib beruvchi</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {finance.supplierName ? (
              <div className="flex justify-between"><span className="text-muted-foreground">Nomi:</span><span className="font-medium">{finance.supplierName}</span></div>
            ) : (
              <p className="text-muted-foreground text-xs">Yetkazib beruvchi ma'lumoti yo'q</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
