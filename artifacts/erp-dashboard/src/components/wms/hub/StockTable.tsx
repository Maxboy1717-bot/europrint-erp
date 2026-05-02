import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { WarehouseStockData } from "./types";

interface StockTableProps {
  loading: boolean;
  data?: WarehouseStockData;
}

export function StockTable({ loading, data }: StockTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {([1, 2, 3]).map(i => <Skeleton key={`k-${i}`} className="h-20 w-full rounded-xl" />)}
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="text-center py-10 border border-dashed rounded-lg">
        <p className="text-muted-foreground">Ma'lumot topilmadi</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-muted-foreground">
          Jami {data.totalItems} ta material
          {" · "}mavjud: <span className="text-green-600 font-bold">{data.totalAvailable.toLocaleString()}</span>
          {" · "}band: <span className="text-amber-600 font-bold">{data.totalReserved.toLocaleString()}</span>
        </p>
      </div>
      <div className="rounded-lg border border-outline-variant overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-4 w-8">#</TableHead>
              <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-4">Material nomi</TableHead>
              <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-4">Kategoriya</TableHead>
              <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-4">Birlik</TableHead>
              <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-4 text-right">Mavjud</TableHead>
              <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-4 text-right">Band</TableHead>
              <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-4 text-right">Jami</TableHead>
              <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-4">Holat</TableHead>
              <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-4 text-right">Minimal</TableHead>
              <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-4"></TableHead>
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
                <TableRow key={item.id} className="hover:bg-surface-container-low transition-colors">
                  <TableCell className="py-4 px-4 font-medium text-on-surface-variant">{idx + 1}</TableCell>
                  <TableCell className="py-4 px-4 font-bold text-on-surface">{item.materialName}</TableCell>
                  <TableCell className="py-4 px-4"><span className="text-xs bg-surface-container px-2 py-1 rounded-full">{item.category}</span></TableCell>
                  <TableCell className="py-4 px-4">{item.unitOfMeasure}</TableCell>
                  <TableCell className="py-4 px-4 text-right font-black text-green-600">{item.availableQuantity.toLocaleString()}</TableCell>
                  <TableCell className="py-4 px-4 text-right font-bold text-amber-600">{item.reservedQuantity.toLocaleString()}</TableCell>
                  <TableCell className="py-4 px-4 text-right font-bold">{item.quantity.toLocaleString()}</TableCell>
                  <TableCell className="py-4 px-4">
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${statusColors[item.stockStatus] || ''}`}>
                      {statusLabels[item.stockStatus] || item.stockStatus}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 px-4 text-right text-on-surface-variant">{item.minStock}</TableCell>
                  <TableCell className="py-4 px-4 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-on-surface-variant hover:text-primary">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
