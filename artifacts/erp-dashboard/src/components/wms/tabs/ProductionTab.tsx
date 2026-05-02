import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, Clock } from "lucide-react";
import { fmtQty } from "@/components/wms/helpers";
import { KpiCard } from "@/components/wms/tabs/KpiCard";
import type { ProductionUsageData, MaterialBasic } from "@/components/wms/wms-types";

interface ProductionTabProps {
  productionUsage: ProductionUsageData | null | undefined;
  basic: MaterialBasic;
}

export function ProductionTab({ productionUsage, basic }: ProductionTabProps) {
  if (!productionUsage) return <div className="text-muted-foreground text-sm py-8 text-center">Ishlab chiqarish ma'lumotlari yo'q</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <KpiCard icon={TrendingDown} label="Kunlik sarflanish (o'rt)" value={fmtQty(productionUsage.avgDailyConsumption, basic.unitOfMeasure)} sub="so'nggi 30 kun" />
        <KpiCard icon={TrendingDown} label="Oylik sarflanish" value={fmtQty(productionUsage.avgMonthlyConsumption, basic.unitOfMeasure)} />
        <KpiCard icon={Clock} label="Hozirgi zaxira davri"
          value={productionUsage.daysRemaining != null ? `${productionUsage.daysRemaining} kun` : "Noma'lum"}
          color={productionUsage.daysRemaining != null && productionUsage.daysRemaining < 7 ? "text-destructive" : "text-primary"} />
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Sarflanish tahlili</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {([
            { label: "Kunlik o'rtacha sarflanish", value: fmtQty(productionUsage.avgDailyConsumption, basic.unitOfMeasure) },
            { label: "Oylik o'rtacha sarflanish", value: fmtQty(productionUsage.avgMonthlyConsumption, basic.unitOfMeasure) },
            { label: "Band qilingan (zaxira)", value: fmtQty(productionUsage.currentReservations, basic.unitOfMeasure) },
            { label: "Kelasi 30 kun talabi", value: fmtQty(productionUsage.next30DaysDemand, basic.unitOfMeasure) },
          ]).map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      {productionUsage.usedInProducts?.length === 0 && (
        <Card><CardContent className="py-6 text-center text-muted-foreground text-sm">BOM (mahsulot tarkibi) bog'liqligi topilmadi</CardContent></Card>
      )}
    </div>
  );
}
