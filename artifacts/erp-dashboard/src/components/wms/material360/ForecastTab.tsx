/**
 * @module ForecastTab
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtQty, fmtMoney, fmtDate, type ForecastInfo, type BasicInfo } from "./types";
import { useTranslation } from '@/lib/i18n';

export function ForecastTab({ forecast, basic }: { forecast: ForecastInfo; basic: BasicInfo }) {
  const { t } = useTranslation("common");
  const statusConf: Record<string, { label: string; cls: string }> = {
    overdue: { label: "KECHIKDI", cls: "text-destructive" }, urgent: { label: "SHOSHILINCH", cls: "text-[var(--ep-red)]" },
    soon: { label: "Tez orada", cls: "text-[var(--ep-yellow)]" }, ok: { label: "Normal", cls: "text-[var(--ep-green)]" },
    unknown: { label: "Noma'lum", cls: "text-muted-foreground" },
  };
  const s = statusConf[forecast.reorderDateStatus || "unknown"];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">{t("nechaKungaYetadi")}</p>
          <p className={`text-3xl font-bold ${forecast.daysRemaining != null && forecast.daysRemaining < 7 ? "text-destructive" : "text-primary"}`}>{forecast.daysRemaining ?? "?"}</p>
          <p className="text-xs text-muted-foreground">kun</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">{t("tugashSanasiTaxmin")}</p>
          <p className="text-xl font-bold">{fmtDate(forecast.stockoutDate)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">{t("buyurtmaSanasi")}</p>
          <p className={`text-xl font-bold ${s.cls}`}>{fmtDate(forecast.reorderDate)}</p>
          <p className={`text-xs ${s.cls} font-medium`}>{s.label}</p>
        </CardContent></Card>
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">{t("buyurtmaTavsiyasi")}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {([["Tavsiya qilingan miqdor", fmtQty(forecast.recommendedOrderQty, basic.unitOfMeasure)], ["Tavsiya qilingan yetkazib beruvchi", forecast.recommendedSupplier || "—"], ["Taxminiy xarajat", fmtMoney(forecast.estimatedCost, forecast.currency)]]).map(([l, v]) => (
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
