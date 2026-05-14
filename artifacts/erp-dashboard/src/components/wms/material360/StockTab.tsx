/**
 * @module StockTab
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Package, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { KpiCard } from "./KpiCard";
import { StockStatusBadge } from "./StockStatusBadge";
import { fmtQty, fmtNum, fmtDate, type StockInfo, type BasicInfo } from "./types";

export function StockTab({ stock, basic }: { stock: StockInfo; basic: BasicInfo }) {
  const maxStock = fmtNum(stock.maxStock || basic.maxStock || 0);
  const curr = fmtNum(stock.totalQty || 0);
  const progressPct = maxStock > 0 ? Math.min(100, (curr / maxStock) * 100) : 0;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={Package} label="Jami miqdor" value={fmtQty(stock.totalQty, basic.unitOfMeasure)} color="text-primary" />
        <KpiCard icon={CheckCircle} label="Mavjud" value={fmtQty(stock.totalAvailable, basic.unitOfMeasure)} color="text-[var(--ep-green)]" />
        <KpiCard icon={AlertTriangle} label="Band qilingan" value={fmtQty(stock.totalReserved, basic.unitOfMeasure)} color="text-[var(--ep-yellow)]" />
        <KpiCard icon={Clock} label="Necha kunga yetadi"
          value={stock.daysRemaining != null ? `${stock.daysRemaining} kun` : "Noma'lum"}
          color={stock.daysRemaining != null && stock.daysRemaining < 7 ? "text-destructive" : "text-primary"} />
      </div>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Zaxira holati</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Joriy: {fmtQty(curr, basic.unitOfMeasure)}</span>
            <span>Maksimal: {maxStock > 0 ? fmtQty(maxStock, basic.unitOfMeasure) : "—"}</span>
          </div>
          {maxStock > 0 && (
            <Progress value={progressPct}
              className={progressPct < 20 ? "[&>div]:bg-destructive" : progressPct < 40 ? "[&>div]:bg-yellow-500" : ""} />
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm pt-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Minimal:</span>
              <span>{fmtNum(stock.reorderPoint) > 0 ? fmtQty(stock.reorderPoint, basic.unitOfMeasure) : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Holat:</span>
              <StockStatusBadge status={stock.stockStatus || "normal"} />
            </div>
          </div>
          {stock.reorderDate && (
            <div className="text-sm flex justify-between pt-1 border-t">
              <span className="text-muted-foreground">Buyurtma sanasi:</span>
              <span className="font-medium">{fmtDate(stock.reorderDate)}</span>
            </div>
          )}
        </CardContent>
      </Card>
      {(stock.byWarehouse || []).length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Ombor bo'yicha</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>{(["Ombor", "Jami", "Mavjud", "Band", "Yangilangan"]).map(h => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {stock.byWarehouse?.map((w) => (
                  <tr key={w.warehouseId} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-2"><div className="font-medium">{w.warehouseName}</div><div className="text-xs text-muted-foreground">{w.warehouseCode}</div></td>
                    <td className="px-4 py-2">{fmtQty(w.quantity, basic.unitOfMeasure)}</td>
                    <td className="px-4 py-2 text-[var(--ep-green)]">{fmtQty(w.availableQuantity, basic.unitOfMeasure)}</td>
                    <td className="px-4 py-2 text-[var(--ep-yellow)]">{fmtQty(w.reservedQuantity, basic.unitOfMeasure)}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{fmtDate(w.lastUpdatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
