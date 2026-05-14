/**
 * @module StockTab
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Package, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { fmtNum, fmtQty, fmtDate, StockStatusBadge } from "@/components/wms/helpers";
import { KpiCard } from "@/components/wms/tabs/KpiCard";
import type { StockData, MaterialBasic } from "@/components/wms/wms-types";
import { useTranslation } from '@/lib/i18n';

interface StockTabProps {
  stock: StockData | null | undefined;
  basic: MaterialBasic;
}

export function StockTab({ stock, basic }: StockTabProps) {
  const { t } = useTranslation("common");
  if (!stock) return <div className="text-muted-foreground text-sm py-8 text-center">{t("omborMalumotlariYoq")}</div>;

  const maxStock = fmtNum(stock.maxStock || basic.maxStock || 0);
  const curr = fmtNum(stock.totalQty || 0);
  const progressPct = maxStock > 0 ? Math.min(100, (curr / maxStock) * 100) : 0;
  const min = fmtNum(stock.reorderPoint || 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={Package} label={t("jamiMiqdor")} value={fmtQty(stock.totalQty, basic.unitOfMeasure)} color="text-primary" />
        <KpiCard icon={CheckCircle} label={t("mavjud")} value={fmtQty(stock.totalAvailable, basic.unitOfMeasure)} color="text-[var(--ep-green)]" />
        <KpiCard icon={AlertTriangle} label={t("bandQilingan")} value={fmtQty(stock.totalReserved, basic.unitOfMeasure)} color="text-[var(--ep-yellow)]" />
        <KpiCard icon={Clock} label={t("nechaKungaYetadi")}
          value={stock.daysRemaining != null ? `${stock.daysRemaining} kun` : "Noma'lum"}
          color={stock.daysRemaining != null && stock.daysRemaining < 7 ? "text-destructive" : "text-primary"} />
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">{t("zaxiraHolati")}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Joriy: {fmtQty(curr, basic.unitOfMeasure)}</span>
            <span>Maksimal: {maxStock > 0 ? fmtQty(maxStock, basic.unitOfMeasure) : "—"}</span>
          </div>
          {maxStock > 0 && (
            <Progress value={progressPct} className={progressPct < 20 ? "[&>div]:bg-destructive" : progressPct < 40 ? "[&>div]:bg-yellow-500" : ""} />
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm pt-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("minimalZaxira")}</span>
              <span>{min > 0 ? fmtQty(min, basic.unitOfMeasure) : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("holat1")}</span>
              <StockStatusBadge status={stock.stockStatus || "normal"} />
            </div>
          </div>
          {stock.reorderDate && (
            <div className="text-sm flex justify-between pt-1 border-t">
              <span className="text-muted-foreground">{t("buyurtmaBerishSanasi1")}</span>
              <span className="font-medium">{fmtDate(stock.reorderDate)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {(stock.byWarehouse || []).length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{t("omborBoyicha")}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>{(["Ombor", "Jami", "Mavjud", "Band", "Yangilangan"]).map(h => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {(stock.byWarehouse || []).map((w) => (
                    <tr key={w.warehouseId} className="border-b hover-elevate">
                      <td className="px-4 py-2"><div className="font-medium">{w.warehouseName}</div><div className="text-xs text-muted-foreground">{w.warehouseCode}</div></td>
                      <td className="px-4 py-2">{fmtQty(w.quantity, basic.unitOfMeasure)}</td>
                      <td className="px-4 py-2 text-[var(--ep-green)]">{fmtQty(w.availableQuantity, basic.unitOfMeasure)}</td>
                      <td className="px-4 py-2 text-[var(--ep-yellow)]">{fmtQty(w.reservedQuantity, basic.unitOfMeasure)}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{fmtDate(w.lastUpdatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
