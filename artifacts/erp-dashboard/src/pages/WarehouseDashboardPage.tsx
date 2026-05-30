/**
 * @module WarehouseDashboardPage
 * @description Moliya/Ombor umumiy dashboard (/wms/overview) — "markaziy ombor yo'q, moliya rahbari
 *   ko'rib turadi". Har ombor qoldiq + QIYMAT, umumiy yig'indilar va so'nggi harakatlar. Config-driven
 *   toza UI (EP/ui + semantic token + tLabel) — eski rasvo WMSDashboard o'rniga.
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Warehouse, Wallet, Boxes, Layers, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { tLabel } from "@/lib/i18n/tLabel";
import { warehouseApi, type WarehouseDashboard } from "@/lib/api/warehouse.api";

const MOVEMENT_LABEL: Record<string, string> = {
  RECEIVE: "Kirim",
  ISSUE: "Chiqim",
  INTERNAL_ISSUE: "Ichki chiqim",
  TRANSFER: "Ko'chirish",
  ADJUST: "Tuzatish",
};

function fmtMoney(n: number): string {
  const v = Number(n) || 0;
  return new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 }).format(v);
}
function fmtQty(n: number): string {
  const v = Number(n) || 0;
  return v % 1 === 0 ? String(v) : v.toFixed(2);
}

export default function WarehouseDashboardPage() {
  const { toast } = useToast();
  const [data, setData] = useState<WarehouseDashboard | null>(null);

  useEffect(() => {
    warehouseApi
      .dashboard()
      .then(setData)
      .catch((e) =>
        toast({ title: tLabel("common.whDash.error", "Xato"), description: String((e as Error).message), variant: "destructive" }),
      );
  }, [toast]);

  const t = data?.totals;
  const warehouses = Array.isArray(data?.warehouses) ? data!.warehouses : [];
  const movements = Array.isArray(data?.recentMovements) ? data!.recentMovements : [];

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Warehouse className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-semibold">{tLabel("common.whDash.title", "Ombor — Moliya nazorati")}</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {!data ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-muted-foreground">{tLabel("common.whDash.totalValue", "Jami qiymat")}</CardTitle>
                <Wallet className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{fmtMoney(t!.totalValue)}</div>
                <div className="text-xs text-muted-foreground">{tLabel("common.whDash.sum", "so'm")}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-muted-foreground">{tLabel("common.whDash.warehouses", "Omborlar")}</CardTitle>
                <Boxes className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{t!.stockedWarehouses}<span className="text-base text-muted-foreground"> / {t!.warehouses}</span></div>
                <div className="text-xs text-muted-foreground">{tLabel("common.whDash.stocked", "qoldiqli / jami")}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-muted-foreground">{tLabel("common.whDash.stockLines", "Stok qatorlari")}</CardTitle>
                <Layers className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{t!.stockLines}</div>
                <div className="text-xs text-muted-foreground">{tLabel("common.whDash.materials", "material pozitsiyasi")}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {data && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className={data.totals.lowStockCount > 0 ? "h-4 w-4 text-destructive" : "h-4 w-4 text-muted-foreground"} />
              {tLabel("common.whDash.lowStock", "Kam qoldiq")}
            </CardTitle>
            <Badge variant={data.totals.lowStockCount > 0 ? "destructive" : "secondary"}>{data.totals.lowStockCount}</Badge>
          </CardHeader>
          <CardContent>
            {data.lowStock.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">{tLabel("common.whDash.lowStockOk", "Barcha materiallar yetarli")}</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {data.lowStock.map((it) => (
                  <Link
                    key={`${it.warehouseId}-${it.materialId}`}
                    href={`/wms/warehouse-stock/${it.warehouseId}`}
                    className="flex items-center justify-between gap-2 rounded-md border border-destructive/40 p-2 text-sm hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{it.name}</div>
                      <div className="text-xs text-muted-foreground">{it.warehouseCode}</div>
                    </div>
                    <div className="whitespace-nowrap text-right">
                      <div className="font-medium text-destructive">{fmtQty(it.available)} {it.unit}</div>
                      <div className="text-xs text-muted-foreground">/ {fmtQty(it.threshold)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{tLabel("common.whDash.byWarehouse", "Omborlar bo'yicha qiymat")}</CardTitle>
          </CardHeader>
          <CardContent>
            {!data ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
            ) : warehouses.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">{tLabel("common.whDash.empty", "Ombor yo'q")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">{tLabel("common.whDash.warehouse", "Ombor")}</th>
                      <th className="py-2 pr-3 text-right font-medium">{tLabel("common.whDash.lines", "Qator")}</th>
                      <th className="py-2 pr-3 text-right font-medium">{tLabel("common.whDash.qty", "Qoldiq")}</th>
                      <th className="py-2 pr-0 text-right font-medium">{tLabel("common.whDash.value", "Qiymat")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {warehouses.map((w) => (
                      <tr key={w.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-2 pr-3">
                          <Link href={`/wms/warehouse-stock/${w.id}`} className="font-medium text-primary hover:underline">
                            {w.name}
                          </Link>
                          <span className="ml-2 text-xs text-muted-foreground">{w.code}</span>
                        </td>
                        <td className="py-2 pr-3 text-right text-muted-foreground">{w.lineCount}</td>
                        <td className="py-2 pr-3 text-right">{fmtQty(w.totalQuantity)}</td>
                        <td className="py-2 pr-0 text-right font-medium">{fmtMoney(w.totalValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{tLabel("common.whDash.recent", "So'nggi harakatlar")}</CardTitle>
          </CardHeader>
          <CardContent>
            {!data ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : movements.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">{tLabel("common.whDash.noMoves", "Harakat yo'q")}</p>
            ) : (
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {movements.map((m) => (
                  <div key={m.id} className="flex items-start justify-between gap-2 border-b pb-2 text-sm last:border-0">
                    <div className="min-w-0">
                      <Badge variant={m.movementType === "RECEIVE" ? "secondary" : "outline"}>
                        {MOVEMENT_LABEL[m.movementType] ?? m.movementType}
                      </Badge>
                      <div className="mt-1 truncate">{m.materialName}</div>
                      <div className="text-xs text-muted-foreground">
                        {m.performedByName ?? "—"}{m.createdAt ? ` · ${new Date(m.createdAt).toLocaleDateString()}` : ""}
                      </div>
                    </div>
                    <div className="whitespace-nowrap font-medium">{fmtQty(m.quantity)} {m.unit ?? ""}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
