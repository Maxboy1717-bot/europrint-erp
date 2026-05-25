/**
 * @module ForecastTab
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtMoney, fmtQty, fmtDate } from "@/components/wms/helpers";
import type { ForecastData, MaterialBasic } from "@/components/wms/wms-types";
import { useTranslation } from '@/lib/i18n';

const STATUS_CONF: Record<string, { label: string; cls: string }> = {
  overdue: { label: "KECHIKDI", cls: "text-destructive" },
  urgent: { label: "SHOSHILINCH", cls: "text-[var(--ep-red)]" },
  soon: { label: "Tez orada", cls: "text-[var(--ep-yellow)]" },
  ok: { label: "Normal", cls: "text-[var(--ep-green)]" },
  unknown: { label: "Noma'lum", cls: "text-muted-foreground" },
};

interface ForecastTabProps {
  forecast: ForecastData | null | undefined;
  basic: MaterialBasic;
}

export function ForecastTab({ forecast, basic }: ForecastTabProps) {
  const { t } = useTranslation("common");
  if (!forecast) return <div className="text-muted-foreground text-sm py-8 text-center">{t("prognozMalumotlariYoq")}</div>;

  const statusInfo = STATUS_CONF[forecast.reorderDateStatus || "unknown"];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">{t("zaxiraNechaKungaYetadi")}</p>
          <p className={`text-3xl font-bold ${forecast.daysRemaining != null && forecast.daysRemaining < 7 ? "text-destructive" : "text-primary"}`}>
            {forecast.daysRemaining != null ? forecast.daysRemaining : "?"}
          </p>
          <p className="text-xs text-muted-foreground">kun</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">{t("zaxiraTugashSanasiTaxmin")}</p>
          <p className="text-xl font-bold">{fmtDate(forecast.stockoutDate)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">{t("buyurtmaBerishSanasi")}</p>
          <p className={`text-xl font-bold ${statusInfo.cls}`}>{fmtDate(forecast.reorderDate)}</p>
          <p className={`text-xs ${statusInfo.cls} font-medium`}>{statusInfo.label}</p>
        </CardContent></Card>
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">{t("avtomatikBuyurtmaTavsiyasi")}</CardTitle></CardHeader>
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
