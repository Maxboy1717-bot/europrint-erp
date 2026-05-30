/**
 * @module WarehouseStockPage
 * @description Bitta ombor qoldig'i (/wms/warehouse-stock/:id) — material kartochka bo'yicha joriy stok.
 *   P2P qabul (§7.7) tovarni warehouse_stock ga prixod qiladi; bu sahifa shu qoldiqni ko'rsatadi.
 *   Config-driven toza UI (EP/ui + semantic token + tLabel) — eski rasvo WMS sahifalarini almashtiradi.
 */
import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Warehouse, ArrowLeft, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { tLabel } from "@/lib/i18n/tLabel";
import { warehouseApi, type WarehouseStock } from "@/lib/api/warehouse.api";

function fmtQty(n: number): string {
  const v = Number(n) || 0;
  return v % 1 === 0 ? String(v) : v.toFixed(2);
}

export default function WarehouseStockPage() {
  const params = useParams<{ id?: string }>();
  const id = params.id ?? "";
  const { toast } = useToast();
  const [data, setData] = useState<WarehouseStock | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoaded(false);
    warehouseApi
      .stock(id)
      .then((d) => setData(d))
      .catch((e) =>
        toast({ title: tLabel("common.warehouseStock.error", "Xato"), description: String((e as Error).message), variant: "destructive" }),
      )
      .finally(() => setLoaded(true));
  }, [id, toast]);

  const wh = data?.warehouse;
  const rows = Array.isArray(data?.stock) ? data!.stock : [];

  return (
    <div className="space-y-4 p-4">
      <Link href={`/wms/warehouses/${wh?.type ?? ""}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        {tLabel("common.warehouseStock.back", "Omborlar")}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Warehouse className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold">{wh?.name ?? (loaded ? id : "")}</h1>
          {wh?.code && <Badge variant="secondary">{wh.code}</Badge>}
        </div>
        {data && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>{tLabel("common.warehouseStock.lines", "Qator")}: {data.lineCount}</span>
            <span>·</span>
            <span>{tLabel("common.warehouseStock.total", "Jami")}: {fmtQty(data.totalQuantity)}</span>
          </div>
        )}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{tLabel("common.warehouseStock.title", "Ombor qoldig'i")}</CardTitle>
        </CardHeader>
        <CardContent>
          {!loaded ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
            </div>
          ) : rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {tLabel("common.warehouseStock.empty", "Bu omborda qoldiq yo'q")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">{tLabel("common.warehouseStock.material", "Material")}</th>
                    <th className="py-2 pr-3 font-medium">{tLabel("common.warehouseStock.code", "Kod")}</th>
                    <th className="py-2 pr-3 text-right font-medium">{tLabel("common.warehouseStock.qty", "Qoldiq")}</th>
                    <th className="py-2 pr-3 text-right font-medium">{tLabel("common.warehouseStock.reserved", "Rezerv")}</th>
                    <th className="py-2 pr-3 text-right font-medium">{tLabel("common.warehouseStock.available", "Mavjud")}</th>
                    <th className="py-2 pr-3 font-medium">{tLabel("common.warehouseStock.unit", "Birlik")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-2 pr-3">{r.name}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{r.kod ?? "—"}</td>
                      <td className="py-2 pr-3 text-right font-medium">{fmtQty(r.quantity)}</td>
                      <td className="py-2 pr-3 text-right text-muted-foreground">{fmtQty(r.reserved)}</td>
                      <td className="py-2 pr-3 text-right">{fmtQty(r.available)}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{r.unit}</td>
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
