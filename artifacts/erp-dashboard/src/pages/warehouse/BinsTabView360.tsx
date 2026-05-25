/**
 * @module BinsTabView360
 * @description 360° view dialog for a warehouse bin.
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Package, AlertTriangle, Clock } from "lucide-react";
import { Lang } from "./warehouse-types";
import { Bin360Data } from "./BinsTabTypes";

interface Bin360DialogProps {
  viewing360BinId: string | null;
  bin360Data: Bin360Data | undefined;
  is360Loading: boolean;
  onOpenChange: (open: boolean) => void;
  lang: Lang;
}

export function Bin360Dialog({ viewing360BinId, bin360Data, is360Loading, onOpenChange, lang }: Bin360DialogProps) {
  return (
    <Dialog open={!!viewing360BinId} onOpenChange={open => { if (!open) onOpenChange(false); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-[var(--ep-blue)]" />
            {lang === "uz" ? "Bin 360° Ko'rinish" : "360° Обзор ячейки"}
            {bin360Data && <Badge variant="outline" className="ml-2 font-mono">{bin360Data.bin.binCode}</Badge>}
          </DialogTitle>
          {bin360Data && <p className="text-sm text-muted-foreground mt-1">{bin360Data.bin.fullAddress}</p>}
        </DialogHeader>

        {is360Loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={`k-${i}`} className="h-16 w-full rounded-lg" />)}
          </div>
        ) : bin360Data ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-1">{lang === "uz" ? "Materiallar soni" : "Кол-во материалов"}</p>
                <p className="text-2xl font-bold">{bin360Data.currentMaterials.count}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-1">{lang === "uz" ? "Ombor qiymati" : "Стоимость"}</p>
                <p className="text-2xl font-bold">{Number(bin360Data.currentMaterials.totalStockValue).toLocaleString()} so'm</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-1">{lang === "uz" ? "Band bo'lish" : "Заполненность"}</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{bin360Data.capacity.currentOccupancy}%</p>
                  <Badge variant={bin360Data.capacity.occupancyStatus === "critical" ? "destructive" : "outline"} className="text-xs">
                    {bin360Data.capacity.occupancyStatus}
                  </Badge>
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-1">{lang === "uz" ? "Muddati o'tayotgan" : "Истекающие"}</p>
                <p className={`text-2xl font-bold ${bin360Data.expiryAlerts.count > 0 ? "text-[var(--ep-primary)]" : "text-[var(--ep-green)]"}`}>
                  {bin360Data.expiryAlerts.count}
                  {bin360Data.expiryAlerts.expired > 0 && (
                    <span className="text-[var(--ep-red)] ml-1 text-sm">({bin360Data.expiryAlerts.expired} muddati o'tgan)</span>
                  )}
                </p>
              </div>
            </div>

            {bin360Data.expiryAlerts.count > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-[var(--ep-primary)]" />
                  {lang === "uz" ? "Muddati yaqin/o'tgan materiallar (FEFO)" : "Материалы с истекающим сроком (FEFO)"}
                </h3>
                <div className="space-y-1">
                  {bin360Data.expiryAlerts.items.slice(0, 5).map((a, i) => (
                    <div key={`k-${i}`} className={`flex items-center justify-between p-2 rounded text-sm border ${a.isExpired ? "border-red-200 bg-red-50" : "border-orange-200 bg-orange-50"}`}>
                      <span className="truncate">{a.materialName}</span>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-xs text-muted-foreground">{a.expiryDate}</span>
                        <Badge variant={a.isExpired ? "destructive" : "secondary"} className="text-xs">
                          {a.isExpired ? "Muddati o'tgan" : `${a.daysUntilExpiry} kun`}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bin360Data.currentMaterials.items.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                  <Package className="h-4 w-4 text-[var(--ep-blue)]" />
                  {lang === "uz" ? "Joriy materiallar (FEFO tartibida)" : "Текущие материалы (порядок FEFO)"}
                </h3>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {bin360Data.currentMaterials.items.slice(0, 10).map((m, i) => (
                    <div key={m.id || i} className="flex items-center justify-between p-2 rounded border text-sm">
                      <div className="min-w-0">
                        <span className="font-mono text-xs text-muted-foreground">{m.kod}</span>
                        <p className="truncate">{m.xomAshyo}</p>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="font-medium">{Number(m.currentStock).toLocaleString()} {m.unitOfMeasure}</p>
                        {m.expiryDate && <p className="text-xs text-muted-foreground">Muddat: {m.expiryDate}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bin360Data.recentMovements.items.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {lang === "uz" ? "So'nggi harakatlar" : "Последние движения"}
                </h3>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {bin360Data.recentMovements.items.slice(0, 5).map((m, i) => (
                    <div key={`k-${i}`} className="flex items-center justify-between p-2 rounded border text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant={m.transactionType === "kirim" ? "default" : "secondary"} className="text-xs">
                          {m.transactionType}
                        </Badge>
                        <span className="truncate">{m.materialName}</span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">{m.transactionDate}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
