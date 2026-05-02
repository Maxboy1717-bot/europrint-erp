import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtMoney, fmtQty, fmtDate } from "@/components/wms/helpers";
import type { ForecastData, MaterialBasic } from "@/components/wms/wms-types";

const STATUS_CONF: Record<string, { label: string; cls: string }> = {
  overdue: { label: "KECHIKDI", cls: "text-destructive" },
  urgent: { label: "SHOSHILINCH", cls: "text-red-600" },
  soon: { label: "Tez orada", cls: "text-yellow-600" },
  ok: { label: "Normal", cls: "text-green-600" },
  unknown: { label: "Noma'lum", cls: "text-muted-foreground" },
};

interface ForecastTabProps {
  forecast: ForecastData | null | undefined;
  basic: MaterialBasic;
}

export function ForecastTab({ forecast, basic }: ForecastTabProps) {
  if (!forecast) return <div className="text-muted-foreground text-sm py-8 text-center">Prognoz ma'lumotlari yo'q</div>;

  const statusInfo = STATUS_CONF[forecast.reorderDateStatus || "unknown"];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Zaxira necha kunga yetadi</p>
          <p className={`text-3xl font-bold ${forecast.daysRemaining != null && forecast.daysRemaining < 7 ? "text-destructive" : "text-primary"}`}>
            {forecast.daysRemaining != null ? forecast.daysRemaining : "?"}
          </p>
          <p className="text-xs text-muted-foreground">kun</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Zaxira tugash sanasi (taxmin)</p>
          <p className="text-xl font-bold">{fmtDate(forecast.stockoutDate)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Buyurtma berish sanasi</p>
          <p className={`text-xl font-bold ${statusInfo.cls}`}>{fmtDate(forecast.reorderDate)}</p>
          <p className={`text-xs ${statusInfo.cls} font-medium`}>{statusInfo.label}</p>
        </CardContent></Card>
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Avtomatik buyurtma tavsiyasi</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {([
            { label: "Tavsiya qilingan miqdor", value: fmtQty(forecast.recommendedOrderQty, basic.unitOfMeasure) },
            { label: "Tavsiya qilingan yetkazib beruvchi", value: forecast.recommendedSupplier || "—" },
            { label: "Taxminiy xarajat", value: fmtMoney(forecast.estimatedCost, forecast.currency) },
          ]).map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
