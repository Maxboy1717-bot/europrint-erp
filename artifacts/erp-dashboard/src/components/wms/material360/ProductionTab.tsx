/**
 * @module ProductionTab
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, Clock } from "lucide-react";
import { KpiCard } from "./KpiCard";
import { fmtQty, type ProductionUsageInfo, type BasicInfo } from "./types";
import { useTranslation } from '@/lib/i18n';

export function ProductionTab({ productionUsage, basic }: { productionUsage: ProductionUsageInfo; basic: BasicInfo }) {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <KpiCard icon={TrendingDown} label={t("kunlikSarflanish")} value={fmtQty(productionUsage.avgDailyConsumption, basic.unitOfMeasure)} sub="so'nggi 30 kun" />
        <KpiCard icon={TrendingDown} label={t("oylikSarflanish")} value={fmtQty(productionUsage.avgMonthlyConsumption, basic.unitOfMeasure)} />
        <KpiCard icon={Clock} label={t("zaxiraDavri")}
          value={productionUsage.daysRemaining != null ? `${productionUsage.daysRemaining} kun` : "Noma'lum"}
          color={productionUsage.daysRemaining != null && productionUsage.daysRemaining < 7 ? "text-destructive" : "text-primary"} />
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">{t("sarflanishTahlili")}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {([["Kunlik o'rtacha", fmtQty(productionUsage.avgDailyConsumption, basic.unitOfMeasure)], ["Oylik o'rtacha", fmtQty(productionUsage.avgMonthlyConsumption, basic.unitOfMeasure)], ["Band qilingan", fmtQty(productionUsage.currentReservations, basic.unitOfMeasure)], ["Kelasi 30 kun talabi", fmtQty(productionUsage.next30DaysDemand, basic.unitOfMeasure)]]).map(([l, v]) => (
            <div key={l} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{l}</span>
              <span className="font-medium">{v}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
