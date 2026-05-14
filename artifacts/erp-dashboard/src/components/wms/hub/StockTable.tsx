/**
 * @module StockTable
 * @description React UI component.
 */

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { WarehouseStockData } from "./types";
import { useTranslation } from '@/lib/i18n';

interface StockTableProps {
  loading: boolean;
  data?: WarehouseStockData;
}

export function StockTable({ loading, data }: StockTableProps) {
  const { t } = useTranslation("common");
  if (loading) {
    return (
      <div className="space-y-3">
        {([1, 2, 3]).map(i => <Skeleton key={`k-${i}`} className="h-20 w-full rounded-lg" />)}
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="text-center py-10 border border-dashed rounded-lg">
        <p className="text-muted-foreground">{t("noData")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-muted-foreground">
          Jami {data.totalItems} ta material
          {" · "}mavjud: <span className="text-[var(--ep-green)] font-bold">{data.totalAvailable.toLocaleString()}</span>
          {" · "}band: <span className="text-[var(--ep-yellow)] font-bold">{data.totalReserved.toLocaleString()}</span>
        </p>
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="ep-table-scroll"><Table>
          <TableHeader>
            <TableRow>
              <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4 w-8">#</TableHead>
              <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4">{t("materialNomi")}</TableHead>
              <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4">{t("category")}</TableHead>
              <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4">{t("unit")}</TableHead>
              <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4 text-right">{t("mavjud")}</TableHead>
              <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4 text-right">{t("band")}</TableHead>
              <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4 text-right">{t("total")}</TableHead>
              <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4">{t("status28")}</TableHead>
              <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4 text-right">{t("minimum")}</TableHead>
              <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(Array.isArray(data.items) ? data.items : []).map((item, idx) => {
              const statusColors: Record<string, string> = {
                normal: "bg-green-100 text-green-800",
                low: "bg-yellow-100 text-yellow-800",
                critical: "bg-red-100 text-red-800",
                zero: "bg-gray-100 text-gray-700",
              };
              const statusLabels: Record<string, string> = {
                normal: "Normal", low: "Kam", critical: "Kritik", zero: "Tugagan"
              };
              return (
                <TableRow key={item.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="py-4 px-4 font-medium text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell className="py-4 px-4 font-bold text-foreground">{item.materialName}</TableCell>
                  <TableCell className="py-4 px-4"><span className="text-xs bg-muted/60 px-2 py-1 rounded-full">{item.category}</span></TableCell>
                  <TableCell className="py-4 px-4">{item.unitOfMeasure}</TableCell>
                  <TableCell className="py-4 px-4 text-right font-black text-[var(--ep-green)]">{item.availableQuantity.toLocaleString()}</TableCell>
                  <TableCell className="py-4 px-4 text-right font-bold text-[var(--ep-yellow)]">{item.reservedQuantity.toLocaleString()}</TableCell>
                  <TableCell className="py-4 px-4 text-right font-bold">{item.quantity.toLocaleString()}</TableCell>
                  <TableCell className="py-4 px-4">
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${statusColors[item.stockStatus] || ''}`}>
                      {statusLabels[item.stockStatus] || item.stockStatus}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 px-4 text-right text-muted-foreground">{item.minStock}</TableCell>
                  <TableCell className="py-4 px-4 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table></div>
      </div>
    </div>
  );
}
