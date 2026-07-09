/**
 * @module FinishedGoodsStock
 * @description Tayyor mahsulot ombori qoldig'i (/warehouse/finished-goods) — faqat KO'RISH.
 *   warehouse_stock_fg (products.id-kalitli) — xom-ashyo warehouse_stock'dan ALOHIDA (Batch 3 Variant-2 split).
 *   ERP = moliya/ombor nazorat sahifasi (view-only). Kirim = QC/MES FG-receipt; chiqim = yetkazish (Gate 4).
 *   Config-driven toza UI (EP/ui + semantic token + tLabel).
 */
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PackageCheck, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { tLabel } from "@/lib/i18n/tLabel";
import { warehouseApi, type FinishedGoodsStock } from "@/lib/api/warehouse.api";

function fmtQty(n: number): string {
  const v = Number(n) || 0;
  return v % 1 === 0 ? String(v) : v.toFixed(2);
}

export default function FinishedGoodsStockPage() {
  const { toast } = useToast();
  const [data, setData] = useState<FinishedGoodsStock | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    warehouseApi
      .finishedGoodsStock()
      .then((d) => setData(d))
      .catch((e) =>
        toast({ title: tLabel("common.fgStock.error", "Xato"), description: String((e as Error).message), variant: "destructive" }),
      )
      .finally(() => setLoaded(true));
  }, [toast]);

  const rows = Array.isArray(data?.stock) ? data!.stock : [];

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <PackageCheck className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold">{tLabel("common.fgStock.title", "Tayyor mahsulot ombori")}</h1>
          <Badge variant="secondary">{tLabel("common.fgStock.badge", "Tayyor mahsulot")}</Badge>
        </div>
        {data && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>{tLabel("common.fgStock.lines", "Qator")}: {data.lineCount}</span>
            <span>·</span>
            <span>{tLabel("common.fgStock.total", "Jami")}: {fmtQty(data.totalQuantity)}</span>
            <span>·</span>
            <span>{tLabel("common.fgStock.availableSum", "Mavjud")}: {fmtQty(data.totalAvailable)}</span>
          </div>
        )}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{tLabel("common.fgStock.cardTitle", "Tayyor mahsulot qoldig'i")}</CardTitle>
        </CardHeader>
        <CardContent>
          {!loaded ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
            </div>
          ) : rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {tLabel("common.fgStock.empty", "Tayyor mahsulot qoldig'i yo'q")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">{tLabel("common.fgStock.product", "Mahsulot")}</th>
                    <th className="py-2 pr-3 font-medium">{tLabel("common.fgStock.code", "Kod")}</th>
                    <th className="py-2 pr-3 font-medium">{tLabel("common.fgStock.warehouse", "Ombor")}</th>
                    <th className="py-2 pr-3 text-right font-medium">{tLabel("common.fgStock.qty", "Qoldiq")}</th>
                    <th className="py-2 pr-3 text-right font-medium">{tLabel("common.fgStock.reserved", "Rezerv")}</th>
                    <th className="py-2 pr-3 text-right font-medium">{tLabel("common.fgStock.availableCol", "Mavjud")}</th>
                    <th className="py-2 pr-0 font-medium">{tLabel("common.fgStock.unit", "Birlik")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-2 pr-3">{r.name}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{r.code ?? "—"}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{r.warehouseName ?? "—"}</td>
                      <td className="py-2 pr-3 text-right font-medium">{fmtQty(r.quantity)}</td>
                      <td className="py-2 pr-3 text-right text-muted-foreground">{fmtQty(r.reserved)}</td>
                      <td className="py-2 pr-3 text-right">{fmtQty(r.available)}</td>
                      <td className="py-2 pr-0 text-muted-foreground">{r.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
